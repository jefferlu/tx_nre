import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewEncapsulation, Input, Output, EventEmitter } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { Observable, Subject, takeUntil } from 'rxjs';

import { Workbook, Worksheet } from 'exceljs';
import * as fs from 'file-saver';
import * as dayjs from 'dayjs';

import { NreService } from '../nre.service';
import { SpecialAlpha } from 'app/core/validators/special-alpha';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { fuseAnimations } from '@fuse/animations';
import { VersionDuplicate } from 'app/core/validators/version-duplicate';
import { AlertService } from 'app/layout/common/alert/alert.service';
import { UserService } from 'app/core/user/user.service';
import { User } from 'app/core/user/user.types';


@Component({
    selector: 'nre-detail',
    templateUrl: './nre-detail.component.html',
    styleUrls: ['./nre-detail.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NreDetailComponent implements OnInit {
    @Input() project: any;
    @Output() goToPanelEvent = new EventEmitter<any>();

    private _unsubscribeAll: Subject<any> = new Subject<any>();
    user: User;

    form: UntypedFormGroup;
    // formSave: UntypedFormGroup;
    versionCtrl: UntypedFormControl;
    originalVersionValue: string;
    isHistory: boolean = false;

    filteredProjects: Observable<string[]>;

    records: any;
    selectedCustomer: any;

    modeltemp: any;
    page: any = {
        debounce: 300,
        minLength: 3,
        dataset: {
            chambers: null,
            customers: null,
            projects: null,
            versions: []
        },
        search: {
            opened: false,
        },
        project: {
            id: null,
            name: null,
            customer: null,
            customer_name: null,
            version: null,
            power_ratio: null,
            equip_hrs: null,
            man_hrs: null,
            fees: null,
            records: []
        },
        status: {
            label: null,
            color: null,
            change: false,
        },
        tab: {
            index: 0
        },
        data: null,

    }

    constructor(
        private _formBuilder: UntypedFormBuilder,
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseConfirmationService: FuseConfirmationService,
        private _specialApha: SpecialAlpha,
        private _versionDuplicate: VersionDuplicate,
        private _userService: UserService,
        private _nreService: NreService,
        private _alert: AlertService

    ) { }

    ngOnInit(): void {

        this.page.project = this.project;

        this.form = this._formBuilder.group({
            customer: [{ value: 0, disabled: true }, [Validators.required]],
            project: [{ value: this.page.project.name, disabled: true }, [Validators.required, this._specialApha.nameValidator]],
            version: [null, [Validators.required, this._specialApha.nameValidator,
            control => this._versionDuplicate.validator(control, this.page.project.id, this.page.dataset.versions)]],
            power_ratio: [null, [Validators.required]]
        });

        // get user
        this._userService.user$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((user: User) => {
                this.user = user;
            });

        // Get customers
        this._nreService.customers$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((res: any) => {
                if (res && res.length > 0) {
                    this.page.dataset.customers = res;
                    this.form.get('customer').setValue(res[0].name);
                }
            });

        // Get chambers
        this._nreService.chambers$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((res: any) => {
                if (res) {
                    this.page.dataset.chambers = res;
                }
            });

        // Get versions
        this._nreService.versions$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((res: any) => {
                if (res) {
                    this.page.dataset.versions = res;
                    this._changeDetectorRef.markForCheck();
                }
            });

        this.search();

        // // reload saved page data
        // if (this._nreService.page) {

        //     this.page = this._nreService.page;

        //     this.form.get('project').setValue(this.page.project.name);
        //     this.form.get('customer').setValue(this.page.project.customer);
        // }
    }

    search(version?: any): void {

        let slug: any = { 'customer': this.page.project.customer, 'version': this.page.project.version };
        if (version) {
            slug.version = version;

            //修改parent參數
            this.project.version = version;
        }

        this._nreService.getProject(this.page.project.name, slug).subscribe({
            next: (res) => {
                if (res) {
                    this.manageData(res);
                }
            },
            error: e => {
                console.log(e)
                const dialogRef = this._fuseConfirmationService.open({
                    title: 'Error',
                    message: JSON.stringify(e.message),
                    actions: { confirm: { color: 'warn', label: 'OK' }, cancel: { show: false } }
                });
            }
        });
    }

    onSave(): void {
        // check version and project.id is in 'version' FormControl
        if (this.form.invalid) return;

        // check project is loaded
        if (!this.page.data) {
            this._alert.open({ type: 'warn', message: 'Project has not been loaded.' });
            return;
        }

        let dialogRef = this._fuseConfirmationService.open({
            message: 'Are you sure to save?',
            icon: { color: 'primary' },
            actions: { confirm: { label: 'Save', color: 'primary' } }

        });

        dialogRef.afterClosed().subscribe(result => {
            if (result === 'confirmed') {
                this.save();
                this._changeDetectorRef.markForCheck();
            }
        });
    }

    save(): void {

        this.calculate();

        this.page.project.name = this.form.get('project').value;
        this.page.project.version = this.form.get('version').value;
        this.page.project.power_ratio = this.form.get('power_ratio').value;

        // 圖表用
        this.page.project.man_hrs = parseFloat(this.page.data.proj_man_hrs).toFixed(2);
        this.page.project.equip_hrs = parseFloat(this.page.data.proj_equip_hrs).toFixed(2);
        this.page.project.fees = parseFloat(this.page.data.proj_fees).toFixed(2);

        this.page.project.records = [];

        for (let func of this.page.data.functions) {
            for (let item of func.test_items) {
                item.record.test_item = item.id;    //new record from api doesn't have item id
                this.page.project.records.push(item.record)
            }
        }

        for (let m of ['rel_', 'sv_', 'pkg_'])
            for (let n of ['concept', 'bu', 'ct', 'nt', 'ot'])
                this.page.project[m + n + '_hr'] = (this.page.project[m + n + '_duration'] / 5 * this.page.project[m + n + '_duty_rate']).toFixed(2);


        this._nreService.createProject(this.page.project).subscribe({
            next: (res) => {
                if (res) {
                    this._alert.open({ message: 'The project has been saved.' });
                    this.manageData(res);
                }
            },
            error: e => {
                console.log(e)
                let message = JSON.stringify(e.message);
                if (e.error) message = e.error

                const dialogRef = this._fuseConfirmationService.open({
                    icon: { color: 'warn' },
                    title: `Error`,
                    message: message,
                    actions: { confirm: { label: 'Done', color: 'primary' }, cancel: { show: false } }
                });
            }
        });
    }

    private manageData(res: any) {

        this.page.data = JSON.parse(JSON.stringify(this.page.dataset.customers.find((e: any) => e.id === this.page.project.customer)));

        // fill res.records from api GET to this.page.data
        for (let i in this.page.data.functions) {
            let func = this.page.data.functions[i]
            for (let j in func.test_items) {
                let item = func.test_items[j];
                let record = res.records.find(e => e.test_item === item.id)

                // 0968一律用Walk-in(自動勾選)
                if (item.item_no.includes('0968')) {
                    item.record.walk_in = true;
                    if (record) record.walk_in = true;
                }

                if (record) {
                    this.page.data.functions[i].test_items[j].record = record;
                }
            }
        }

        // fill this.page.project
        delete res.records;
        this.page.project = res;

        this.form.get('power_ratio').setValue(this.page.project.power_ratio);

        this.page.status = {
            label: res.id ? 'Saved' : 'New',
            change: false,
            color: res.id ? 'green' : 'blue'
        }

        // refresh versions
        this._nreService.getVersions({ 'customer': this.page.project.customer, 'name': this.page.project.name }).subscribe({
            next: (res) => {
                if (res) {
                    // 更新versions後才設定formSave.version，確保validate duplicate時是用最新的versions
                    // this.form.get('version').setValue(res.find((e: any) => e.version === this.page.project.version).id);
                    this.form.get('version').setValue(this.page.project.version);
                }
            }
        });


        // this._nreService.page = this.page;        

        this.page.tab.index = 0;

        this._changeDetectorRef.markForCheck();
    }

    onSelectedTabChange(event: any) {
        if (event.index == 0) return;
        this.calculate()
    }

    calculate(): void {

        if (this.page.data) {
            this.page.data['proj_equip_hrs'] = 0;
            this.page.data['proj_man_hrs'] = 0;
            this.page.data['proj_fees'] = 0;

            for (let i in this.page.data.functions) {
                let func = this.page.data.functions[i];

                func['concept_man_hrs_sum'] = null;
                func['bu_man_hrs_sum'] = null;
                func['ct_man_hrs_sum'] = null;
                func['nt_man_hrs_sum'] = null;
                func['ot_man_hrs_sum'] = null;

                for (let j in func.test_items) {
                    let item = func.test_items[j];

                    item['concept_equip_hrs'] = null;
                    item['concept_capacity'] = null;
                    item['concept_chambers'] = null;
                    item['bu_equip_hrs'] = null;
                    item['bu_capacity'] = null;
                    item['bu_chambers'] = null;
                    item['ct_equip_hrs'] = null;
                    item['ct_capacity'] = null;
                    item['ct_chambers'] = null;
                    item['nt_equip_hrs'] = null;
                    item['nt_capacity'] = null;
                    item['nt_chambers'] = null;
                    item['ot_equip_hrs'] = null;
                    item['ot_capacity'] = null;
                    item['ot_chambers'] = null;
                    item['sub_total'] = null;

                    // 選擇fee
                    if (item.fee) {
                        let chamber = item.record.walk_in ? 'WALKIN' : '2K';
                        let current_fee = item.fee.find((e: any) => e.chamber == chamber)
                        item.current_fee = current_fee ? current_fee.amount : 'no fee';
                    }

                    // Concept/BU/CT/NT/OT
                    for (let n of ['concept', 'bu', 'ct', 'nt', 'ot']) {
                        if (item.record[n + '_need_test']) {
                            item[n + '_capacity'] = item.record[n + '_test_uut'] * this.page.project.power_ratio;

                            // 選擇Chamber
                            item[n + '_chambers'] = [];
                            if (func.name === 'Reliability') {  //S&V以及Other完全都不會用到chamber
                                item[n + '_capacity'] *= 0.8;
                                item[n + '_chambers'] = this.selectChambers(item[n + '_capacity'], item.record.walk_in);
                            }

                            if (item.record[n + '_regression_rate'] != null) {
                                if (item.equip_working_hours != null) {
                                    item[n + '_equip_hrs'] = parseFloat(item.record[n + '_regression_rate']) * item.equip_working_hours;

                                    // 乘上chamber數量
                                    if (item[n + '_chambers'].length > 0) item[n + '_equip_hrs'] *= item[n + '_chambers'][0].count;

                                    // 累加total
                                    if (item['sub_total'] == null) item['sub_total'] = 0;
                                    item['sub_total'] += item[n + '_equip_hrs'];

                                    // 專案總設備工時
                                    this.page.data['proj_equip_hrs'] += item[n + '_equip_hrs'];
                                }

                                if (item.man_working_hours != null) {
                                    if (func[n + '_man_hrs_sum'] == null) func[n + '_man_hrs_sum'] = 0;
                                    func[n + '_man_hrs_sum'] += parseFloat(item.record[n + '_regression_rate']) * item.man_working_hours;

                                    // 專案總人力工時
                                    this.page.data['proj_man_hrs'] += parseFloat(item.record[n + '_regression_rate']) * item.man_working_hours;
                                }
                            }

                            // Reliability項目只要設備工時為0，就不會用到chamber
                            if (item[n + '_equip_hrs'] == null || item[n + '_equip_hrs'] === 0) {
                                item[n + '_chambers'] = [];
                            }

                        }
                    }

                    // if (item.record.concept_need_test) {
                    //     item['concept_capacity'] = item.record.concept_test_uut * this.page.project.power_ratio;

                    //     // 選擇Chamber
                    //     item['concept_chambers'] = [];
                    //     if (func.name === 'Reliability') {  //S&V以及Other完全都不會用到chamber
                    //         item['concept_capacity'] *= 0.8;
                    //         item['concept_chambers'] = this.selectChambers(item['concept_capacity'], item.record.walk_in);
                    //     }

                    //     if (item.record.concept_regression_rate != null) {

                    //         if (item.equip_working_hours != null) {
                    //             item['concept_equip_hrs'] = parseFloat(item.record.concept_regression_rate) * item.equip_working_hours;

                    //             // 乘上chamber數量
                    //             if (item['concept_chambers'].length > 0) item['concept_equip_hrs'] *= item.concept_chambers[0].count;

                    //             // 累加total
                    //             if (item['sub_total'] == null) item['sub_total'] = 0;
                    //             item['sub_total'] += item['concept_equip_hrs'];

                    //             // 專案總設備工時
                    //             this.page.data['proj_equip_hrs'] += item['concept_equip_hrs'];
                    //         }

                    //         if (item.man_working_hours != null) {
                    //             if (func['concept_man_hrs_sum'] == null) func['concept_man_hrs_sum'] = 0;
                    //             func['concept_man_hrs_sum'] += parseFloat(item.record.concept_regression_rate) * item.man_working_hours;

                    //             // 專案總人力工時
                    //             this.page.data['proj_man_hrs'] += parseFloat(item.record.concept_regression_rate) * item.man_working_hours;
                    //         }
                    //     }

                    //     // Reliability項目只要設備工時為0，就不會用到chamber
                    //     if (item['concept_equip_hrs'] == null || item['concept_equip_hrs'] === 0) {
                    //         item['concept_chambers'] = [];
                    //     }

                    // }

                    // // BU        
                    // if (item.record.bu_need_test) {
                    //     item['bu_capacity'] = item.record.bu_test_uut * this.page.project.power_ratio;

                    //     if (func.name === 'Reliability') item['bu_capacity'] *= 0.8;
                    //     item['bu_chambers'] = this.selectChambers(item['bu_capacity'], item.record.walk_in);

                    //     if (item.record.bu_regression_rate != null) {

                    //         if (item.equip_working_hours != null) {
                    //             item['bu_equip_hrs'] = parseFloat(item.record.bu_regression_rate) * item.equip_working_hours;

                    //             // 乘上chamber數量
                    //             if (item['bu_chambers'].length > 0) item['bu_equip_hrs'] *= item.bu_chambers[0].count;

                    //             // 累加total
                    //             if (item['sub_total'] == null) item['sub_total'] = 0;
                    //             item['sub_total'] += item['bu_equip_hrs'];

                    //             // 專案總設備工時
                    //             this.page.data['proj_equip_hrs'] += item['bu_equip_hrs'];
                    //         }

                    //         if (item.man_working_hours != null) {
                    //             if (func['bu_man_hrs_sum'] == null) func['bu_man_hrs_sum'] = 0;
                    //             func['bu_man_hrs_sum'] += parseFloat(item.record.bu_regression_rate) * item.man_working_hours;

                    //             // 專案總人力工時
                    //             this.page.data['proj_man_hrs'] += parseFloat(item.record.bu_regression_rate) * item.man_working_hours;
                    //         }
                    //     }
                    // }

                    // // CT
                    // if (item.record.ct_need_test) {
                    //     item['ct_capacity'] = item.record.ct_test_uut * this.page.project.power_ratio;

                    //     if (func.name === 'Reliability') item['ct_capacity'] *= 0.8;
                    //     item['ct_chambers'] = this.selectChambers(item['ct_capacity'], item.record.walk_in);

                    //     if (item.record.ct_regression_rate != null) {

                    //         if (item.equip_working_hours != null) {
                    //             item['ct_equip_hrs'] = parseFloat(item.record.ct_regression_rate) * item.equip_working_hours;

                    //             // 乘上chamber數量
                    //             if (item['ct_chambers'].length > 0) item['ct_equip_hrs'] *= item.ct_chambers[0].count;

                    //             // 累加total
                    //             if (item['sub_total'] == null) item['sub_total'] = 0;
                    //             item['sub_total'] += item['ct_equip_hrs'];

                    //             // 專案總設備工時
                    //             this.page.data['proj_equip_hrs'] += item['ct_equip_hrs'];
                    //         }

                    //         if (item.man_working_hours != null) {
                    //             if (func['ct_man_hrs_sum'] == null) func['ct_man_hrs_sum'] = 0;
                    //             func['ct_man_hrs_sum'] += parseFloat(item.record.ct_regression_rate) * item.man_working_hours;

                    //             // 專案總人力工時
                    //             this.page.data['proj_man_hrs'] += parseFloat(item.record.ct_regression_rate) * item.man_working_hours;
                    //         }
                    //     }
                    // }

                    // // NT
                    // if (item.record.nt_need_test) {
                    //     item['nt_capacity'] = item.record.nt_test_uut * this.page.project.power_ratio;

                    //     if (func.name === 'Reliability') item['nt_capacity'] *= 0.8;
                    //     item['nt_chambers'] = this.selectChambers(item['nt_capacity'], item.record.walk_in);

                    //     if (item.record.nt_regression_rate != null) {

                    //         if (item.equip_working_hours != null) {
                    //             item['nt_equip_hrs'] = parseFloat(item.record.nt_regression_rate) * item.equip_working_hours;

                    //             // 乘上chamber數量
                    //             if (item['nt_chambers'].length > 0) item['nt_equip_hrs'] *= item.nt_chambers[0].count;

                    //             // 累加total
                    //             if (item['sub_total'] == null) item['sub_total'] = 0;
                    //             item['sub_total'] += item['nt_equip_hrs'];

                    //             // 專案總設備工時
                    //             this.page.data['proj_equip_hrs'] += item['nt_equip_hrs'];
                    //         }

                    //         if (item.man_working_hours != null) {
                    //             if (func['nt_man_hrs_sum'] == null) func['nt_man_hrs_sum'] = 0
                    //             func['nt_man_hrs_sum'] += parseFloat(item.record.nt_regression_rate) * item.man_working_hours;

                    //             // 專案總人力工時
                    //             this.page.data['proj_man_hrs'] += parseFloat(item.record.nt_regression_rate) * item.man_working_hours;
                    //         }
                    //     }
                    // }

                    // // OT
                    // if (item.record.ot_need_test) {
                    //     item['ot_capacity'] = item.record.ot_test_uut * this.page.project.power_ratio;

                    //     if (func.name === 'Reliability') item['ot_capacity'] *= 0.8;
                    //     item['ot_chambers'] = this.selectChambers(item['ot_capacity'], item.record.walk_in);

                    //     if (item.record.ot_regression_rate != null) {

                    //         if (item.equip_working_hours != null) {
                    //             item['ot_equip_hrs'] = parseFloat(item.record.ot_regression_rate) * item.equip_working_hours;

                    //             // 乘上chamber數量
                    //             if (item['ot_chambers'].length > 0) item['ot_equip_hrs'] *= item.ot_chambers[0].count;

                    //             // 累加total
                    //             if (item['sub_total'] == null) item['sub_total'] = 0;
                    //             item['sub_total'] += item['ot_equip_hrs'];

                    //             // 專案總設備工時
                    //             this.page.data['proj_equip_hrs'] += item['ot_equip_hrs'];
                    //         }

                    //         if (item.man_working_hours != null) {
                    //             if (func['ot_man_hrs_sum'] == null) func['ot_man_hrs_sum'] = 0
                    //             func['ot_man_hrs_sum'] += parseFloat(item.record.ot_regression_rate) * item.man_working_hours;

                    //             // 專案總人力工時
                    //             this.page.data['proj_man_hrs'] += parseFloat(item.record.ot_regression_rate) * item.man_working_hours;
                    //         }
                    //     }
                    // }

                    // 設備使用費
                    if (item.current_fee && item.current_fee != 'no fee' && item.sub_total) {
                        this.page.data['proj_fees'] += item.current_fee * item.sub_total;
                    }
                }
            }
        }

    }

    private selectChambers(capacity: number, walk_in: boolean = false) {

        // const chambers: any[] = [
        //     { name: '2K', capacity: 2000, 'amount': 10 },
        //     { name: '3K', capacity: 3000, 'amount': 1 },
        //     { name: 'Walk-in', capacity: 6000, 'amount': 2 }
        // ];
        const chambers = this.page.dataset.chambers;
        chambers.sort((a, b) => b.capacity - a.capacity); // 按照容量從大到小排序

        let sortedChambers = JSON.parse(JSON.stringify(chambers));
        sortedChambers = sortedChambers.sort((a, b) => a.capacity - b.capacity)// 按照容量從小到大排序

        const selectedChambers: any[] = [];

        let remainingRate = capacity;

        if (capacity > 0) {
            // 限制只使用walk-in
            if (walk_in) {
                let chamber = chambers.find(e => e.name.toUpperCase() === 'WALK-IN');
                let count = Math.floor(remainingRate / chamber.capacity);

                remainingRate -= (count * chamber.capacity);
                remainingRate = remainingRate % chamber.capacity;
                if (remainingRate > 0) count += 1;

                selectedChambers.push({ name: chamber.name, count: count });

            }
            // 改成只使用2K
            else {
                let chamber = chambers.find(e => e.name.toUpperCase() === '2K');
                let count = Math.floor(remainingRate / chamber.capacity);

                remainingRate -= (count * chamber.capacity);
                remainingRate = remainingRate % chamber.capacity;
                if (remainingRate > 0) count += 1;

                selectedChambers.push({ name: chamber.name, count: count });
            }
        }
        return selectedChambers;
    }

    onExport(): void {
        if (this.page.status.change || !this.page.project.version) {
            this._alert.open({ type: 'warn', duration: 5, message: 'The project has not been saved.' });
            return;
        }

        let dialogRef = this._fuseConfirmationService.open({
            message: `Are you sure to export?`,
            icon: { color: 'primary' },
            actions: { confirm: { label: 'Export', color: 'primary' } }

        });

        dialogRef.afterClosed().subscribe(result => {
            if (result === 'confirmed') {
                this.export();
                this._alert.open({ type: 'info', duration: 5, message: 'Export completed.' });
                this._changeDetectorRef.markForCheck();
            }
        });

    }

    export(): void {

        this.calculate();

        /* Manage Records */
        let sheets = [
            {
                name: '使用者填入',
                headers: [
                    ["Reliability/S&V Test"],
                    ["Function", "Test Item", "Walk-in", "Concept", null, null, null, "BU", null, null, null, "CT", null, null, null, "NT", null, null, null, "OT"],
                    [null, null, null, "Test UUT", "Regression Rate", "HRS", "Equipment", "Test UUT", "Regression Rate", "HRS", "Equipment", "Test UUT", "Regression Rate", "HRS", "Equipment", "Test UUT", "Regression Rate", "HRS", "Equipment", "Test UUT", "Regression Rate", "HRS", "Equipment"]
                ],
                records: []
            },
            {
                name: '成果_Equipment',
                headers: [
                    ["Reliability/S&V Test"],
                    ["Function", "Test Item", "Lab Location", "Lab Rate", "Concept", "BU", "CT", "NT", "OT", "Sub Total"],
                    [null, null, null, null, "HRS", "HRS", "HRS", "HRS", "HRS", null]
                ],
                records: []
            },
            {
                name: '成果_Man Power',
                headers: [[null, 'Concept', 'BU(hrs)', 'CT(hrs)', 'NT(hrs)', 'OT(hrs)']],
                records: [],
                headers_rel: [['REL', 'Concept', null, 'BU', null, 'CT', null, 'NT', null, 'OT', null]],
                records_rel: [],
                headers_sv: [['SV', 'Concept', null, 'BU', null, 'CT', null, 'NT', null, 'OT', null]],
                records_sv: [],
                headers_pkg: [['PKG', 'Concept', null, 'BU', null, 'CT', null, 'NT', null, 'OT', null]],
                records_pkg: []
            }
        ]

        // sheet data
        for (let func of this.page.data.functions) {
            let record = [];
            for (let item of func.test_items) {

                // sheet 1
                record = [];

                record.push(func.name);
                record.push(item.item_name);
                record.push(item.record.walk_in ? '✔' : '');
                // record.push(item.record.concept_need_test ? '✔' : '');
                record.push(item.record.concept_test_uut);
                record.push(item.record.concept_regression_rate);
                record.push(item.concept_equip_hrs);
                record.push(item.concept_chambers ? item.concept_chambers.map(chamber => `${chamber.name}*${chamber.count}`).join(', ') : null);
                // record.push(item.record.bu_need_test ? '✔' : '');
                record.push(item.record.bu_test_uut);
                record.push(item.record.bu_regression_rate);
                record.push(item.bu_equip_hrs);
                record.push(item.bu_chambers ? item.bu_chambers.map(chamber => `${chamber.name}*${chamber.count}`).join(', ') : null);
                // record.push(item.record.ct_need_test ? '✔' : '');
                record.push(item.record.ct_test_uut);
                record.push(item.record.ct_regression_rate);
                record.push(item.ct_equip_hrs);
                record.push(item.ct_chambers ? item.ct_chambers.map(chamber => `${chamber.name}*${chamber.count}`).join(', ') : null);
                // record.push(item.record.nt_need_test ? '✔' : '');
                record.push(item.record.nt_test_uut);
                record.push(item.record.nt_regression_rate);
                record.push(item.nt_equip_hrs);
                record.push(item.nt_chambers ? item.nt_chambers.map(chamber => `${chamber.name}*${chamber.count}`).join(', ') : null);
                // record.push(item.record.ot_need_test ? '✔' : '');
                record.push(item.record.ot_test_uut);
                record.push(item.record.ot_regression_rate);
                record.push(item.ot_equip_hrs);
                record.push(item.ot_chambers ? item.ot_chambers.map(chamber => `${chamber.name}*${chamber.count}`).join(', ') : null);

                sheets[0].records.push(record);

                // sheet 2
                record = [];

                record.push(func.name);
                record.push(item.item_name);
                record.push(item.lab_location);
                record.push(item.current_fee);
                record.push(item.concept_equip_hrs);
                // record.push(item.concept_chambers ? item.concept_chambers.map(chamber => `${chamber.name}*${chamber.count}`).join(', ') : null);
                record.push(item.bu_equip_hrs);
                // record.push(item.bu_chambers ? item.bu_chambers.map(chamber => `${chamber.name}*${chamber.count}`).join(', ') : null);
                record.push(item.ct_equip_hrs);
                // record.push(item.ct_chambers ? item.ct_chambers.map(chamber => `${chamber.name}*${chamber.count}`).join(', ') : null);
                record.push(item.nt_equip_hrs);
                // record.push(item.nt_chambers ? item.nt_chambers.map(chamber => `${chamber.name}*${chamber.count}`).join(', ') : null);
                record.push(item.ot_equip_hrs);
                // record.push(item.ot_chambers ? item.ot_chambers.map(chamber => `${chamber.name}*${chamber.count}`).join(', ') : null);
                record.push(item.sub_total);

                sheets[1].records.push(record);
            }

            // sheet 3
            record = [];
            record.push(func.name);
            if (func.name === 'Reliability') {
                record.push(func.concept_man_hrs_sum ? func.concept_man_hrs_sum + (this.page.project.rel_concept_duration / 5 * this.page.project.rel_concept_duty_rate) : null);
                record.push(func.bu_man_hrs_sum ? func.bu_man_hrs_sum + (this.page.project.rel_bu_duration / 5 * this.page.project.rel_bu_duty_rate) : null);
                record.push(func.ct_man_hrs_sum ? func.ct_man_hrs_sum + (this.page.project.rel_ct_duration / 5 * this.page.project.rel_ct_duty_rate) : null);
                record.push(func.nt_man_hrs_sum ? func.nt_man_hrs_sum + (this.page.project.rel_nt_duration / 5 * this.page.project.rel_nt_duty_rate) : null);
                record.push(func.ot_man_hrs_sum ? func.ot_man_hrs_sum + (this.page.project.rel_ot_duration / 5 * this.page.project.rel_ot_duty_rate) : null);
            }
            if (func.name === 'S&V') {
                record.push(func.concept_man_hrs_sum ? func.concept_man_hrs_sum + (this.page.project.sv_concept_duration / 5 * this.page.project.sv_concept_duty_rate) : null);
                record.push(func.bu_man_hrs_sum ? func.bu_man_hrs_sum + (this.page.project.sv_bu_duration / 5 * this.page.project.sv_bu_duty_rate) : null);
                record.push(func.ct_man_hrs_sum ? func.ct_man_hrs_sum + (this.page.project.sv_ct_duration / 5 * this.page.project.sv_ct_duty_rate) : null);
                record.push(func.nt_man_hrs_sum ? func.nt_man_hrs_sum + (this.page.project.sv_nt_duration / 5 * this.page.project.sv_nt_duty_rate) : null);
                record.push(func.ot_man_hrs_sum ? func.ot_man_hrs_sum + (this.page.project.sv_ot_duration / 5 * this.page.project.sv_ot_duty_rate) : null);
            }
            if (func.name === 'Others') {
                record.push(func.concept_man_hrs_sum ? func.concept_man_hrs_sum + (this.page.project.pkg_concept_duration / 5 * this.page.project.pkg_concept_duty_rate) : null);
                record.push(func.bu_man_hrs_sum ? func.bu_man_hrs_sum + (this.page.project.pkg_bu_duration / 5 * this.page.project.pkg_bu_duty_rate) : null);
                record.push(func.ct_man_hrs_sum ? func.ct_man_hrs_sum + (this.page.project.pkg_ct_duration / 5 * this.page.project.pkg_ct_duty_rate) : null);
                record.push(func.nt_man_hrs_sum ? func.nt_man_hrs_sum + (this.page.project.pkg_nt_duration / 5 * this.page.project.pkg_nt_duty_rate) : null);
                record.push(func.ot_man_hrs_sum ? func.ot_man_hrs_sum + (this.page.project.pkg_ot_duration / 5 * this.page.project.pkg_ot_duty_rate) : null);
            }


            sheets[2].records.push(record);

        }

        /* Write to Excel */
        const workbook = new Workbook();

        let startNum = 0, endNum = 0;
        const borderStyle: any = {
            style: 'thin',
            color: { argb: '000000' }, // 黑色
        };

        for (let index in sheets) {
            let sheet = sheets[index];
            const worksheet = workbook.addWorksheet(sheet.name);

            let row = null;
            switch (+index) {
                // Sheet 1
                case 0:
                    // Fill headers
                    for (let header of sheet.headers) {
                        row = worksheet.addRow(header);
                        row.font = { name: 'Calibri', bold: true };
                        row.alignment = { horizontal: 'center', vertical: 'middle' };
                    }

                    // Merge header 1
                    worksheet.mergeCells('A1:W1');

                    // Merge header 2
                    worksheet.mergeCells('D2:G2');
                    worksheet.mergeCells('H2:K2');
                    worksheet.mergeCells('L2:O2');
                    worksheet.mergeCells('P2:S2');
                    worksheet.mergeCells('T2:W2');

                    // Merge header columns
                    worksheet.mergeCells('A2:A3');
                    worksheet.mergeCells('B2:B3');
                    worksheet.mergeCells('C2:C3');

                    // Fill records
                    for (let record of sheet.records) {
                        row = worksheet.addRow(record);
                        row.font = { name: 'Calibri' };
                        row.alignment = { horizontal: 'center', vertical: 'middle' };
                    }

                    // Merge Function columns
                    startNum = 4;
                    endNum = 0;
                    for (let func of this.page.data.functions) {
                        if (func.test_items.length === 0) continue;

                        endNum = startNum + (func.test_items.length - 1);
                        worksheet.mergeCells(`A${startNum}:A${endNum}`);
                        startNum = endNum + 1;

                    }

                    // 繪製框線                    
                    worksheet.eachRow({ includeEmpty: true }, (row, rowIndex) => {
                        row.eachCell({ includeEmpty: true }, (cell, cellIndex) => {
                            cell.border = {
                                top: borderStyle,
                                left: borderStyle,
                                bottom: borderStyle,
                                right: borderStyle,
                            };

                            // Test Item alignment
                            if (rowIndex > 3) {
                                if (cellIndex === 2)
                                    cell.alignment = { horizontal: 'left', vertical: 'middle' };
                                // if ([3, 4, 7, 10, 13, 16].includes(cellIndex))
                                if ([3].includes(cellIndex))
                                    cell.font = { name: 'Calibri', color: { argb: '00823B' } }
                            }
                        });
                    });

                    // 自動調整列寬
                    this.adjustWidth(worksheet);

                    break;

                // Sheet 2
                case 1:
                    // Fill headers
                    for (let header of sheet.headers) {
                        row = worksheet.addRow(header);
                        row.font = { name: 'Calibri', bold: true };
                        row.alignment = { horizontal: 'center', vertical: 'middle' };
                    }

                    // Merge header 1
                    worksheet.mergeCells('A1:J1');

                    // Merge header 2
                    // worksheet.mergeCells('E2:F2');
                    // worksheet.mergeCells('G2:H2');
                    // worksheet.mergeCells('I2:J2');
                    // worksheet.mergeCells('K2:L2');
                    // worksheet.mergeCells('M2:N2');

                    // Merge header columns
                    worksheet.mergeCells('A2:A3');
                    worksheet.mergeCells('B2:B3');
                    worksheet.mergeCells('C2:C3');
                    worksheet.mergeCells('D2:D3');
                    worksheet.mergeCells('J2:J3');

                    // Fill records
                    for (let record of sheet.records) {
                        row = worksheet.addRow(record);
                        row.font = { name: 'Calibri' };
                        row.alignment = { horizontal: 'center', vertical: 'middle' };
                    }

                    // Merge Function columns
                    startNum = 4;
                    endNum = 0;
                    for (let func of this.page.data.functions) {
                        if (func.test_items.length === 0) continue;

                        endNum = startNum + (func.test_items.length - 1);
                        worksheet.mergeCells(`A${startNum}:A${endNum}`);
                        startNum = endNum + 1;

                    }

                    // 繪製框線                    
                    worksheet.eachRow({ includeEmpty: true }, (row, rowIndex) => {
                        row.eachCell({ includeEmpty: true }, (cell, cellIndex) => {
                            cell.border = {
                                top: borderStyle,
                                left: borderStyle,
                                bottom: borderStyle,
                                right: borderStyle,
                            };

                            // Test Item alignment
                            if (rowIndex > 3) {
                                if (cellIndex === 2)
                                    cell.alignment = { horizontal: 'left', vertical: 'middle' };
                            }
                        });
                    });

                    // 自動調整列寬
                    this.adjustWidth(worksheet);

                    break;

                // Sheet 3
                case 2:
                    // Fill headers
                    for (let header of sheet.headers) {
                        row = worksheet.addRow(header);
                        row.font = { name: 'Calibri', bold: true };
                        row.alignment = { horizontal: 'center', vertical: 'middle' };
                    }

                    // Fill records
                    for (let record of sheet.records) {
                        row = worksheet.addRow(record);
                        row.font = { name: 'Calibri' };
                        row.alignment = { horizontal: 'center', vertical: 'middle' };
                    }

                    // Fill headers_rel
                    worksheet.addRow([]);
                    worksheet.addRow([]);

                    for (let header of sheet.headers_rel) {
                        row = worksheet.addRow(header);
                        row.font = { name: 'Calibri', bold: true };
                        row.alignment = { horizontal: 'center', vertical: 'middle' };
                    }

                    // Merge header columns
                    worksheet.mergeCells('B7:C7');
                    worksheet.mergeCells('D7:E7');
                    worksheet.mergeCells('F7:G7');
                    worksheet.mergeCells('H7:I7');
                    worksheet.mergeCells('J7:K7');

                    let data = this.page.project;

                    let rel_concept_hr = null;
                    if (data.rel_concept_duration && data.rel_concept_duty_rate) rel_concept_hr = data.rel_concept_duration / 5 * data.rel_concept_duty_rate;
                    let rel_bu_hr = null;
                    if (data.rel_bu_duration && data.rel_bu_duty_rate) rel_bu_hr = data.rel_bu_duration / 5 * data.rel_bu_duty_rate;
                    let rel_ct_hr = null;
                    if (data.rel_ct_duration && data.rel_ct_duty_rate) rel_ct_hr = data.rel_ct_duration / 5 * data.rel_ct_duty_rate;
                    let rel_nt_hr = null;
                    if (data.rel_nt_duration && data.rel_nt_duty_rate) rel_nt_hr = data.rel_nt_duration / 5 * data.rel_nt_duty_rate;
                    let rel_ot_hr = null;
                    if (data.rel_ot_duration && data.rel_ot_duty_rate) rel_ot_hr = data.rel_ot_duration / 5 * data.rel_ot_duty_rate;

                    row = worksheet.addRow(['PL', 'Duration(Day)', data.rel_concept_duration, 'Duration(Day)', data.rel_bu_duration, 'Duration(Day)', data.rel_ct_duration, 'Duration(Day)', data.rel_nt_duration, 'Duration(Day)', data.rel_ot_duration]);
                    row.font = { name: 'Calibri' };
                    row.alignment = { horizontal: 'center', vertical: 'middle' };
                    row = worksheet.addRow(['PL', 'Duty Rate(Hr)', data.rel_concept_duty_rate, 'Duty Rate(Hr)', data.rel_bu_duty_rate, 'Duty Rate(Hr)', data.rel_ct_duty_rate, 'Duty Rate(Hr)', data.rel_nt_duty_rate, 'Duty Rate(Hr)', data.rel_ot_duty_rate]);
                    row.font = { name: 'Calibri' };
                    row.alignment = { horizontal: 'center', vertical: 'middle' };
                    row = worksheet.addRow(['PL', 'Hr', rel_concept_hr, 'Hr', rel_bu_hr, 'Hr', rel_ct_hr, 'Hr', rel_nt_hr, 'Hr', rel_ot_hr]);
                    row.font = { name: 'Calibri' };
                    row.alignment = { horizontal: 'center', vertical: 'middle' };

                    worksheet.mergeCells('A8:A10');
                    worksheet.getCell('A8').font = { name: 'Calibri', bold: true };
                    worksheet.getCell('B8').font = { name: 'Calibri', bold: true };
                    worksheet.getCell('D8').font = { name: 'Calibri', bold: true };
                    worksheet.getCell('F8').font = { name: 'Calibri', bold: true };
                    worksheet.getCell('H8').font = { name: 'Calibri', bold: true };
                    worksheet.getCell('J8').font = { name: 'Calibri', bold: true };

                    worksheet.getCell('B9').font = { name: 'Calibri', bold: true };
                    worksheet.getCell('D9').font = { name: 'Calibri', bold: true };
                    worksheet.getCell('F9').font = { name: 'Calibri', bold: true };
                    worksheet.getCell('H9').font = { name: 'Calibri', bold: true };
                    worksheet.getCell('J9').font = { name: 'Calibri', bold: true };

                    worksheet.getCell('B10').font = { name: 'Calibri', bold: true };
                    worksheet.getCell('D10').font = { name: 'Calibri', bold: true };
                    worksheet.getCell('F10').font = { name: 'Calibri', bold: true };
                    worksheet.getCell('H10').font = { name: 'Calibri', bold: true };
                    worksheet.getCell('J10').font = { name: 'Calibri', bold: true };


                    // Fill headers_sv
                    worksheet.addRow([]);
                    worksheet.addRow([]);

                    for (let header of sheet.headers_sv) {
                        row = worksheet.addRow(header);
                        row.font = { name: 'Calibri', bold: true };
                        row.alignment = { horizontal: 'center', vertical: 'middle' };
                    }
                    worksheet.mergeCells('B13:C13');
                    worksheet.mergeCells('D13:E13');
                    worksheet.mergeCells('F13:G13');
                    worksheet.mergeCells('H13:I13');
                    worksheet.mergeCells('J13:K13');

                    let sv_concept_hr = null;
                    if (data.sv_concept_duration && data.sv_concept_duty_rate) sv_concept_hr = data.sv_concept_duration / 5 * data.sv_concept_duty_rate;
                    let sv_bu_hr = null;
                    if (data.sv_bu_duration && data.sv_bu_duty_rate) sv_bu_hr = data.sv_bu_duration / 5 * data.sv_bu_duty_rate;
                    let sv_ct_hr = null;
                    if (data.sv_ct_duration && data.sv_ct_duty_rate) sv_ct_hr = data.sv_ct_duration / 5 * data.sv_ct_duty_rate;
                    let sv_nt_hr = null;
                    if (data.sv_nt_duration && data.sv_nt_duty_rate) sv_nt_hr = data.sv_nt_duration / 5 * data.sv_nt_duty_rate;
                    let sv_ot_hr = null;
                    if (data.sv_ot_duration && data.sv_ot_duty_rate) sv_ot_hr = data.sv_ot_duration / 5 * data.sv_ot_duty_rate;

                    row = worksheet.addRow(['PL', 'Duration(Day)', data.sv_concept_duration, 'Duration(Day)', data.sv_bu_duration, 'Duration(Day)', data.sv_ct_duration, 'Duration(Day)', data.sv_nt_duration, 'Duration(Day)', data.sv_ot_duration]);
                    row.font = { name: 'Calibri' };
                    row.alignment = { horizontal: 'center', vertical: 'middle' };
                    row = worksheet.addRow(['PL', 'Duty Rate(Hr)', data.sv_concept_duty_rate, 'Duty Rate(Hr)', data.sv_bu_duty_rate, 'Duty Rate(Hr)', data.sv_ct_duty_rate, 'Duty Rate(Hr)', data.sv_nt_duty_rate, 'Duty Rate(Hr)', data.sv_ot_duty_rate]);
                    row.font = { name: 'Calibri' };
                    row.alignment = { horizontal: 'center', vertical: 'middle' };
                    row = worksheet.addRow(['PL', 'Hr', sv_concept_hr, 'Hr', sv_bu_hr, 'Hr', sv_ct_hr, 'Hr', sv_nt_hr, 'Hr', sv_ot_hr]);
                    row.font = { name: 'Calibri' };
                    row.alignment = { horizontal: 'center', vertical: 'middle' };

                    worksheet.mergeCells('A14:A16');
                    worksheet.getCell('A14').font = { name: 'Calibri', bold: true };
                    worksheet.getCell('B14').font = { name: 'Calibri', bold: true };
                    worksheet.getCell('D14').font = { name: 'Calibri', bold: true };
                    worksheet.getCell('F14').font = { name: 'Calibri', bold: true };
                    worksheet.getCell('H14').font = { name: 'Calibri', bold: true };
                    worksheet.getCell('J14').font = { name: 'Calibri', bold: true };

                    worksheet.getCell('B15').font = { name: 'Calibri', bold: true };
                    worksheet.getCell('D15').font = { name: 'Calibri', bold: true };
                    worksheet.getCell('F15').font = { name: 'Calibri', bold: true };
                    worksheet.getCell('H15').font = { name: 'Calibri', bold: true };
                    worksheet.getCell('J15').font = { name: 'Calibri', bold: true };

                    worksheet.getCell('B16').font = { name: 'Calibri', bold: true };
                    worksheet.getCell('D16').font = { name: 'Calibri', bold: true };
                    worksheet.getCell('F16').font = { name: 'Calibri', bold: true };
                    worksheet.getCell('H16').font = { name: 'Calibri', bold: true };
                    worksheet.getCell('J16').font = { name: 'Calibri', bold: true };

                    // Fill headers_pkg
                    worksheet.addRow([]);
                    worksheet.addRow([]);

                    for (let header of sheet.headers_pkg) {
                        row = worksheet.addRow(header);
                        row.font = { name: 'Calibri', bold: true };
                        row.alignment = { horizontal: 'center', vertical: 'middle' };
                    }

                    worksheet.mergeCells('B19:C19');
                    worksheet.mergeCells('D19:E19');
                    worksheet.mergeCells('F19:G19');
                    worksheet.mergeCells('H19:I19');
                    worksheet.mergeCells('J19:K19');

                    let pkg_concept_hr = null;
                    if (data.pkg_concept_duration && data.pkg_concept_duty_rate) pkg_concept_hr = data.pkg_concept_duration / 5 * data.pkg_concept_duty_rate;
                    let pkg_bu_hr = null;
                    if (data.pkg_bu_duration && data.pkg_bu_duty_rate) pkg_bu_hr = data.pkg_bu_duration / 5 * data.pkg_bu_duty_rate;
                    let pkg_ct_hr = null;
                    if (data.pkg_ct_duration && data.pkg_ct_duty_rate) pkg_ct_hr = data.pkg_ct_duration / 5 * data.pkg_ct_duty_rate;
                    let pkg_nt_hr = null;
                    if (data.pkg_nt_duration && data.pkg_nt_duty_rate) pkg_nt_hr = data.pkg_nt_duration / 5 * data.pkg_nt_duty_rate;
                    let pkg_ot_hr = null;
                    if (data.pkg_ot_duration && data.pkg_ot_duty_rate) pkg_ot_hr = data.pkg_ot_duration / 5 * data.pkg_ot_duty_rate;


                    row = worksheet.addRow(['PL', 'Duration(Day)', data.pkg_concept_duration, 'Duration(Day)', data.pkg_bu_duration, 'Duration(Day)', data.pkg_ct_duration, 'Duration(Day)', data.pkg_nt_duration, 'Duration(Day)', data.pkg_ot_duration]);
                    row.font = { name: 'Calibri' };
                    row.alignment = { horizontal: 'center', vertical: 'middle' };
                    row = worksheet.addRow(['PL', 'Duty Rate(Hr)', data.pkg_concept_duty_rate, 'Duty Rate(Hr)', data.pkg_bu_duty_rate, 'Duty Rate(Hr)', data.pkg_ct_duty_rate, 'Duty Rate(Hr)', data.pkg_nt_duty_rate, 'Duty Rate(Hr)', data.pkg_ot_duty_rate]);
                    row.font = { name: 'Calibri' };
                    row.alignment = { horizontal: 'center', vertical: 'middle' };
                    row = worksheet.addRow(['PL', 'Hr', pkg_concept_hr, 'Hr', pkg_bu_hr, 'Hr', pkg_ct_hr, 'Hr', pkg_nt_hr, 'Hr', pkg_ot_hr]);
                    row.font = { name: 'Calibri' };
                    row.alignment = { horizontal: 'center', vertical: 'middle' };

                    worksheet.mergeCells('A20:A22');
                    worksheet.getCell('A20').font = { name: 'Calibri', bold: true };
                    worksheet.getCell('B20').font = { name: 'Calibri', bold: true };
                    worksheet.getCell('D20').font = { name: 'Calibri', bold: true };
                    worksheet.getCell('F20').font = { name: 'Calibri', bold: true };
                    worksheet.getCell('H20').font = { name: 'Calibri', bold: true };
                    worksheet.getCell('J20').font = { name: 'Calibri', bold: true };

                    worksheet.getCell('B21').font = { name: 'Calibri', bold: true };
                    worksheet.getCell('D21').font = { name: 'Calibri', bold: true };
                    worksheet.getCell('F21').font = { name: 'Calibri', bold: true };
                    worksheet.getCell('H21').font = { name: 'Calibri', bold: true };
                    worksheet.getCell('J21').font = { name: 'Calibri', bold: true };

                    worksheet.getCell('B22').font = { name: 'Calibri', bold: true };
                    worksheet.getCell('D22').font = { name: 'Calibri', bold: true };
                    worksheet.getCell('F22').font = { name: 'Calibri', bold: true };
                    worksheet.getCell('H22').font = { name: 'Calibri', bold: true };
                    worksheet.getCell('J22').font = { name: 'Calibri', bold: true };

                    // 繪製框線                    
                    worksheet.eachRow({ includeEmpty: true }, (row, rowIndex) => {
                        row.eachCell({ includeEmpty: true }, (cell, cellIndex) => {
                            cell.border = {
                                top: borderStyle,
                                left: borderStyle,
                                bottom: borderStyle,
                                right: borderStyle,
                            };
                        });
                    });

                    // 自動調整列寬
                    this.adjustWidth(worksheet);
                    break;
            }

            // let res = this.getEndColumn(108);
            // console.log('res', res)
        }

        // Save to File
        workbook.xlsx.writeBuffer().then((buffer) => {
            let blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            let datetime: any = dayjs().format('YYYYMMDDHHmmss');
            fs.saveAs(blob, `${this.page.project.customer_name}_${this.page.project.name}_${this.page.project.version}_${datetime}.xlsx`);
        });
    }

    onDelete(): void {
        let dialogRef = this._fuseConfirmationService.open({
            message: `Are you sure to delete?`,
            icon: { color: 'warn' },
            actions: { confirm: { label: 'Delete', color: 'warn' } }

        });

        dialogRef.afterClosed().subscribe(result => {
            if (result === 'confirmed') {
                this.delete();
                this._changeDetectorRef.markForCheck();
            }
        });
    }

    delete(): void {

        this._nreService.deleteProject(this.page.project.id).subscribe({
            next: (res) => {
                this._alert.open({ message: 'The project has been deleted.' });
                this.goToPanelEvent.emit('overview');
            },
            error: e => {
                console.log(e)
                let message = JSON.stringify(e.message);
                if (e.error) message = e.error
                const dialogRef = this._fuseConfirmationService.open({
                    icon: { color: 'warn' },
                    title: `Error`,
                    message: message,
                    actions: { confirm: { label: 'Done', color: 'primary' }, cancel: { show: false } }
                });
            }
        });
    }

    onHistory(): void {
        this.isHistory = true;
    }

    onCloseHistory(isRefresh: boolean = false): void {
        console.log(isRefresh)
        this.isHistory = false;
        if (isRefresh) this.search()
    }

    change(item?: any): void {
        this.page.status = {
            label: 'Modified',
            color: 'red',
            change: true
        }

        if (item) {
            let count: number = 0;
            for (let n of ['concept', 'bu', 'ct', 'nt', 'ot']) {
                if (item.record[n + '_need_test']) {
                    count++;
                }
            }
            item.record.all_need_test = (count == 5) ? true : false;
        }
    }

    checkAllNeedTest(item: any) {

        for (let n of ['concept', 'bu', 'ct', 'nt', 'ot']) {
            item.record[n + '_need_test'] = item.record.all_need_test;
        }

    }

    checkSingleNeedTest(event: any, categ: string) {
        for (let func of this.page.data.functions) {
            for (let item of func.test_items) {
                item.record[categ + '_need_test'] = event.target.checked;

            }
        }
    }


    checkWalkin(event: any) {
        for (let func of this.page.data.functions) {
            for (let item of func.test_items) {
                if (!item.item_no.includes('0968')) {
                    item.record.walk_in = event.target.checked;
                }
            }
        }
    }

    statusNeedTest(item: any) {

        let need_test: boolean = false;
        for (let n of ['concept', 'bu', 'ct', 'nt', 'ot']) {
            if (item.record[n + '_need_test']) need_test = true;
        }

        return { 'need-test': need_test }
    }

    walkinDisable(item: any) {
        let disable: boolean = true;

        if (item.item_no.includes('0968')) return true;

        for (let n of ['concept', 'bu', 'ct', 'nt', 'ot']) {
            if (item.record[n + '_need_test']) disable = false;
        }
        return disable;
    }

    autoFill(event: any, categ: string, type: string) {

        console.log(event.target.value)
        for (let func of this.page.data.functions) {
            for (let item of func.test_items) {
                if (item.record[categ + '_need_test']) {
                    item.record[categ + type] = event.target.value === '' ? null : event.target.value;
                }
            }
        }
    }

    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();

        this._nreService.versions = null;
    }

    private adjustWidth(worksheet: Worksheet) {
        worksheet.columns.forEach((column, index) => {
            let maxCellLength = 0;
            worksheet.getColumn(index + 1).eachCell({ includeEmpty: true }, (cell) => {
                const columnLength = cell.value ? cell.value.toString().length - 2 : 0;
                maxCellLength = Math.max(maxCellLength, columnLength);
            });
            column.width = maxCellLength < 16 ? 16 : maxCellLength;

        });
    }

    private getEndColumn(num) { //num start from 0
        let letters = ''
        while (num >= 0) {
            letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[num % 26] + letters
            num = Math.floor(num / 26) - 1
        }
        return letters
    }
}
