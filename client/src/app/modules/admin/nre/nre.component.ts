import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';

import { Workbook, Worksheet } from 'exceljs';
import * as fs from 'file-saver';
import * as dayjs from 'dayjs';

import { NreService } from './nre.service';
import { Observable, Subject, debounceTime, filter, map, startWith, takeUntil } from 'rxjs';
import { SpecialAlpha } from 'app/core/validators/special-alpha';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { fuseAnimations } from '@fuse/animations';
import { VersionDuplicate } from 'app/core/validators/version-duplicate';
import { AlertService } from 'app/layout/common/alert/alert.service';


@Component({
    selector: 'app-nre',
    templateUrl: './nre.component.html',
    styleUrls: ['./nre.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NreComponent implements OnInit {

    @ViewChild('table', { static: false }) table: ElementRef;

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    form: UntypedFormGroup;
    formSave: UntypedFormGroup;
    versionCtrl: UntypedFormControl;
    originalVersionValue: string;

    filteredProjects: Observable<string[]>;

    records: any;
    selectedCustomer: any;

    page = {
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
        private _nreService: NreService,
        private _alert: AlertService

    ) { }

    ngOnInit(): void {

        this.form = this._formBuilder.group({
            customer: [0, [Validators.required]],
            project: ['', [Validators.required, this._specialApha.nameValidator]]
        });

        this.formSave = this._formBuilder.group({
            version: ['', [Validators.required, this._specialApha.nameValidator,
            control => this._versionDuplicate.validator(control, this.page.project.id, this.page.dataset.versions)]],
            power_ratio: [null, [Validators.required]]
        })


        // FormControls Observable 

        this.form.get('customer').valueChanges.pipe(
            takeUntil(this._unsubscribeAll),
            map(_ => {
                this.page.dataset.projects = null;
            })
        ).subscribe()

        this.form.get('project').valueChanges.pipe(
            debounceTime(this.page.debounce),
            takeUntil(this._unsubscribeAll),
            map(value => {

                if (!value || value.length < this.page.minLength) {
                    this.page.dataset.projects = null;
                    this._changeDetectorRef.markForCheck();
                }

                // Continue
                return value;
            }),
            filter(value => value && value.length >= this.page.minLength)
        ).subscribe(_ => {
            this._nreService.getProjects({ 'customer': this.form.value.customer, 'name': this.form.value.project }).subscribe()
        });

        // Get chambers
        this._nreService.chambers$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((res: any) => {
                if (res) {
                    this.page.dataset.chambers = res;
                }
            });

        // Get customers
        this._nreService.customers$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((res: any) => {
                if (res && res.length > 0) {
                    this.page.dataset.customers = res;
                    this.form.get('customer').setValue(res[0].id);
                }
            });

        // Get projects
        this._nreService.projects$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((res: any) => {
                if (res) {
                    this.page.dataset.projects = res;
                    this._changeDetectorRef.markForCheck();
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

        // reload saved page data
        if (this._nreService.page) {
            this.page = this._nreService.page;

            this.form.get('project').setValue(this.page.project.name);
            this.form.get('customer').setValue(this.page.project.customer);
            this.formSave.get('power_ratio').setValue(this.page.project.power_ratio);
            // this.search();
        }

        // console.log(this._nreService.project);

    }

    onSearchOpen(): void {
        // Return if it's already opened
        if (this.page.search.opened) {
            return;
        }

        // Open the search1
        this.page.search.opened = true;
    }

    onSearchClose(): void {
        // Return if it's already closed
        if (!this.page.search.opened) {
            return;
        }

        // Clear the search input
        // this.searchControl.setValue('');

        // Close the search
        this.page.search.opened = false;
    }

    onSearch(): void {

        if (this.form.invalid) return;

        if (this.page.status.change) {
            let dialogRef = this._fuseConfirmationService.open({
                message: `The project has been modified and has not been saved yet. Are you sure to discard it?`
            });

            dialogRef.afterClosed().subscribe(result => {
                if (result === 'confirmed') {
                    this.search();
                    this.onSearchClose();
                    this._changeDetectorRef.markForCheck();
                }
            });
        }
        else {
            this.search();
            this.onSearchClose();
        }
    }

    search(version?: any): void {

        if (!this.page.dataset.chambers) return;

        this.page.status.label = undefined;
        // this.page.data = JSON.parse(JSON.stringify(this.page.dataset.customers.find((e: any) => e.id === this.form.value.customer)));

        let slug: any = { 'customer': this.form.value.customer };
        if (version) slug.version = version;

        this._nreService.getProject(this.form.value.project, slug).subscribe({
            next: (res) => {
                if (res) {

                    this.manageData(res);
                }
            },
            error: e => {
                console.log(e)
                const dialogRef = this._fuseConfirmationService.open({
                    title: 'Error',
                    message: JSON.stringify(e.error),
                    actions: { confirm: { color: 'warn', label: 'OK' }, cancel: { show: false } }
                });
            }
        });
    }

    save(): void {
        // check version and project.id is in 'version' FormControl
        if (this.formSave.invalid) return;

        // check project is loaded
        if (!this.page.data) {
            this._alert.open({ type: 'warn', message: 'Project has not been loaded.' });
            this.onSearchOpen();
            this._changeDetectorRef.markForCheck();
            return;
        }

        this.page.project.version = this.formSave.value.version;
        this.page.project.power_ratio = this.formSave.value.power_ratio;
        this.page.project.records = [];
        for (let func of this.page.data.functions) {
            for (let item of func.test_items) {
                item.record.test_item = item.id;    //new record from api doesn't have item id                
                this.page.project.records.push(item.record)
            }
        }

        this._nreService.createProject(this.page.project).subscribe({
            next: (res) => {
                if (res) {
                    this._alert.open({ message: 'The project has been saved.' });
                    this.manageData(res);
                }
            },
            error: e => {
                console.log(e)
                let message = JSON.stringify(e.error)
                const dialogRef = this._fuseConfirmationService.open({
                    icon: { color: 'warn' },
                    title: `Error`,
                    message: message,
                    actions: { confirm: { color: 'primary' }, cancel: { show: false } }
                });
            }
        });
    }

    private manageData(res: any) {

        this.page.data = JSON.parse(JSON.stringify(this.page.dataset.customers.find((e: any) => e.id === this.form.value.customer)));

        // fill res.records from api GET to this.page.data
        for (let i in this.page.data.functions) {
            let func = this.page.data.functions[i]
            for (let j in func.test_items) {
                let item = func.test_items[j];
                let record = res.records.find(e => e.test_item === item.id)
                if (record) {
                    this.page.data.functions[i].test_items[j].record = record;
                }
            }
        }

        // fill this.page.project
        delete res.records;
        this.page.project = res;

        if (res.name == '') this.page.project.name = this.form.value.project;
        this.page.project.customer = this.form.value.customer;
        this.page.project.customer_name = this.page.dataset.customers.find((e: any) => e.id == this.form.value.customer).name;

        this.formSave.get('version').setValue(this.page.project.version);
        this.formSave.get('power_ratio').setValue(this.page.project.power_ratio);

        this.page.status = {
            label: res.id ? 'Saved' : 'New',
            change: false,
            color: res.id ? 'green' : 'blue'
        }

        // refresh versions
        this._nreService.getVersions({ 'customer': this.form.value.customer, 'name': this.form.value.project }).subscribe();

        // this._nreService.page = this.page;        

        this.page.tab.index = 0;

        this._changeDetectorRef.markForCheck();
    }

    calculate(): void {

        if (this.page.data) {
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
                    item['sub_total'] = 0;

                    // Concept
                    if (item.record.concept_need_test) {
                        item['concept_capacity'] = item.record.concept_test_uut * this.page.project.power_ratio;
                        if (func.name === 'Reliability') {
                            item['concept_capacity'] *= 0.8;
                            item['concept_chambers'] = this.selectChambers(item['concept_capacity'], item.record.walk_in);
                        }
                        if (item.record.concept_regression_rate != null) {

                            if (item.equip_working_hours != null) {
                                item['concept_equip_hrs'] = parseFloat(item.record.concept_regression_rate) * item.equip_working_hours;
                                item['sub_total'] += item['concept_equip_hrs'];
                            }

                            if (item.man_working_hours != null) {
                                if (func['concept_man_hrs_sum'] == null) func['concept_man_hrs_sum'] = 0
                                func['concept_man_hrs_sum'] += parseFloat(item.record.concept_regression_rate) * item.man_working_hours;
                            }
                        }
                    }

                    // BU        
                    if (item.record.bu_need_test) {
                        item['bu_capacity'] = item.record.bu_test_uut * this.page.project.power_ratio;
                        if (func.name === 'Reliability') item['bu_capacity'] *= 0.8;
                        item['bu_chambers'] = this.selectChambers(item['bu_capacity'], item.record.walk_in);
                        if (item.record.bu_regression_rate != null) {
                            if (item.equip_working_hours != null) {
                                item['bu_equip_hrs'] = parseFloat(item.record.bu_regression_rate) * item.equip_working_hours;
                                item['sub_total'] += item['bu_equip_hrs'];
                            }

                            if (item.man_working_hours != null) {
                                if (func['bu_man_hrs_sum'] == null) func['bu_man_hrs_sum'] = 0
                                func['bu_man_hrs_sum'] += parseFloat(item.record.bu_regression_rate) * item.man_working_hours;
                            }
                        }
                    }

                    // CT
                    if (item.record.ct_need_test) {
                        item['ct_capacity'] = item.record.ct_test_uut * this.page.project.power_ratio;
                        if (func.name === 'Reliability') item['ct_capacity'] *= 0.8;
                        item['ct_chambers'] = this.selectChambers(item['ct_capacity'], item.record.walk_in);
                        if (item.record.ct_regression_rate != null) {

                            if (item.equip_working_hours != null) {
                                item['ct_equip_hrs'] = parseFloat(item.record.ct_regression_rate) * item.equip_working_hours;
                                item['sub_total'] += item['ct_equip_hrs'];
                            }

                            if (item.man_working_hours != null) {
                                if (func['ct_man_hrs_sum'] == null) func['ct_man_hrs_sum'] = 0
                                func['ct_man_hrs_sum'] += parseFloat(item.record.ct_regression_rate) * item.man_working_hours;
                            }
                        }
                    }

                    // NT
                    if (item.record.nt_need_test) {
                        item['nt_capacity'] = item.record.nt_test_uut * this.page.project.power_ratio;
                        if (func.name === 'Reliability') item['nt_capacity'] *= 0.8;
                        item['nt_chambers'] = this.selectChambers(item['nt_capacity'], item.record.walk_in);
                        if (item.record.nt_regression_rate != null) {
                            if (item.equip_working_hours != null) {
                                item['nt_equip_hrs'] = parseFloat(item.record.nt_regression_rate) * item.equip_working_hours;
                                item['sub_total'] += item['nt_equip_hrs'];
                            }

                            if (item.man_working_hours != null) {
                                if (func['nt_man_hrs_sum'] == null) func['nt_man_hrs_sum'] = 0
                                func['nt_man_hrs_sum'] += parseFloat(item.record.nt_regression_rate) * item.man_working_hours;
                            }
                        }
                    }

                    // OT
                    if (item.record.ot_need_test) {
                        item['ot_capacity'] = item.record.nt_test_uut * this.page.project.power_ratio;
                        if (func.name === 'Reliability') item['ot_capacity'] *= 0.8;
                        item['ot_chambers'] = this.selectChambers(item['ot_capacity'], item.record.walk_in);
                        if (item.record.ot_regression_rate != null) {

                            if (item.equip_working_hours != null) {
                                item['ot_equip_hrs'] = parseFloat(item.record.ot_regression_rate) * item.equip_working_hours;
                                item['sub_total'] += item['ot_equip_hrs'];
                            }

                            if (item.man_working_hours != null) {
                                if (func['ot_man_hrs_sum'] == null) func['ot_man_hrs_sum'] = 0
                                func['ot_man_hrs_sum'] += parseFloat(item.record.ot_regression_rate) * item.man_working_hours;
                            }
                        }
                    }
                }
            }

        }

        // console.log(this.selectChambers(20200, true))
    }

    private selectChambers(capacity: number, walk_in: boolean = false) {
        // console.log(walk_in)
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
            else {
                for (let i in chambers) {
                    let chamber = chambers[i];
                    if (remainingRate > 0) {
                        // 商數找出滿足最大容量的chamber(降冪)
                        let count = Math.floor(remainingRate / chamber.capacity);

                        // 超過可用數量    
                        if (count > chamber.amount) {
                            remainingRate -= (chamber.amount * chamber.capacity);
                            selectedChambers.push({ name: chamber.name, count: chamber.amount });
                        }
                        // 未超過可用數量
                        else if (count > 0) {
                            selectedChambers.push({ name: chamber.name, count: count });
                            remainingRate -= count * chamber.capacity;
                        }

                        // 最後一個chamber
                        if (+i === (chambers.length - 1)) {

                            // 當remainingRate還是有商數時，表示所有的chamber都不夠用
                            count = Math.floor(remainingRate / chamber.capacity);
                            if (count > 0) {
                                selectedChambers.push({ name: 'remain', count: remainingRate });
                            }
                            else {
                                // 餘數找出滿足最小容量的chamber(升冪)
                                remainingRate = remainingRate % chamber.capacity;
                                if (remainingRate > 0) {
                                    for (let chamber of sortedChambers) {

                                        if (chamber.capacity >= remainingRate) {

                                            let index = selectedChambers.findIndex(e => e.name === chamber.name)

                                            if (index === -1) selectedChambers.push({ name: chamber.name, count: 1 });
                                            else selectedChambers[index].count += 1;
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        return selectedChambers;
    }

    change(): void {
        this.page.status = {
            label: 'Modified',
            color: 'red',
            change: true
        }
    }

    onExport(): void {

        if (this.page.status.change || !this.page.project.version) {
            this._alert.open({ type: 'warn', duration: 5, message: 'The project has not been saved.' });
            return;
        }

        this.calculate();

        /* Manage Records */
        let sheets = [
            {
                name: '使用者填入',
                headers: [
                    ["Reliability/S&V Test"],
                    ["Function", "Test Item", "Walk-in", "Concept", null, null, "BU", null, null, "CT", null, null, "NT", null, null, "OT"],
                    [null, null, null, "Need Test", "Test UUT", "Regression Rate", "Need Test", "Test UUT", "Regression Rate", "Need Test", "Test UUT", "Regression Rate", "Need Test", "Test UUT", "Regression Rate", "Need Test", "Test UUT", "Regression Rate"]
                ],
                records: []
            },
            {
                name: '成果_Equipment',
                headers: [
                    ["Reliability/S&V Test"],
                    ["Function", "Test Item", "Lab Location", "Lab Rate", "Concept", null, "BU", null, "CT", null, "NT", null, null, "OT", "Sub Total"],
                    [null, null, null, null, "HRS", "Equipment", "HRS", "Equipment", "HRS", "Equipment", "HRS", "Equipment", "HRS", "Equipment", null]
                ],
                records: []
            },
            {
                name: '成果_Man Power',
                headers: [[null, 'Concept', 'BU(hrs)', 'CT(hrs)', 'NT(hrs)', 'OT(hrs)']],
                records: []
            }
        ]

        // sheet1 data
        for (let func of this.page.data.functions) {
            let record = [];
            for (let item of func.test_items) {

                // sheet 1
                record = [];

                record.push(func.name);
                record.push(item.item_name);
                record.push(item.record.walk_in ? '✔' : '');
                record.push(item.record.concept_need_test ? '✔' : '');
                record.push(item.record.concept_test_uut);
                record.push(item.record.concept_regression_rate);
                record.push(item.record.bu_need_test ? '✔' : '');
                record.push(item.record.bu_test_uut);
                record.push(item.record.bu_regression_rate);
                record.push(item.record.ct_need_test ? '✔' : '');
                record.push(item.record.ct_test_uut);
                record.push(item.record.ct_regression_rate);
                record.push(item.record.nt_need_test ? '✔' : '');
                record.push(item.record.nt_test_uut);
                record.push(item.record.nt_regression_rate);
                record.push(item.record.ot_need_test ? '✔' : '');
                record.push(item.record.ot_test_uut);
                record.push(item.record.ot_regression_rate);

                sheets[0].records.push(record);

                // sheet 2
                record = [];

                record.push(func.name);
                record.push(item.item_name);
                record.push(item.lab_location);
                record.push(item.fee);
                record.push(item.concept_equip_hrs);
                record.push(item.concept_chambers ? item.concept_chambers.map(chamber => `${chamber.name}*${chamber.count}`).join(', ') : null);
                record.push(item.bu_equip_hrs);
                record.push(item.bu_chambers ? item.bu_chambers.map(chamber => `${chamber.name}*${chamber.count}`).join(', ') : null);
                record.push(item.ct_equip_hrs);
                record.push(item.ct_chambers ? item.ct_chambers.map(chamber => `${chamber.name}*${chamber.count}`).join(', ') : null);
                record.push(item.nt_equip_hrs);
                record.push(item.nt_chambers ? item.nt_chambers.map(chamber => `${chamber.name}*${chamber.count}`).join(', ') : null);
                record.push(item.ot_equip_hrs);
                record.push(item.ot_chambers ? item.ot_chambers.map(chamber => `${chamber.name}*${chamber.count}`).join(', ') : null);
                record.push(item.sub_total);

                sheets[1].records.push(record);
            }

            // sheet 3
            record = [];
            record.push(func.name);
            record.push(func.concept_man_hrs_sum);
            record.push(func.bu_man_hrs_sum);
            record.push(func.ct_man_hrs_sum);
            record.push(func.nt_man_hrs_sum);
            record.push(func.ot_man_hrs_sum);

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
                    worksheet.mergeCells('A1:R1');

                    // Merge header 2
                    worksheet.mergeCells('D2:F2');
                    worksheet.mergeCells('G2:I2');
                    worksheet.mergeCells('J2:L2');
                    worksheet.mergeCells('M2:O2');
                    worksheet.mergeCells('P2:R2');

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
                                if ([3, 4, 7, 10, 13, 16].includes(cellIndex))
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
                    worksheet.mergeCells('A1:O1');

                    // Merge header 2
                    worksheet.mergeCells('E2:F2');
                    worksheet.mergeCells('G2:H2');
                    worksheet.mergeCells('I2:J2');
                    worksheet.mergeCells('K2:L2');
                    worksheet.mergeCells('M2:N2');

                    // Merge header columns
                    worksheet.mergeCells('A2:A3');
                    worksheet.mergeCells('B2:B3');
                    worksheet.mergeCells('C2:C3');
                    worksheet.mergeCells('D2:D3');
                    worksheet.mergeCells('O2:O3');

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

    private adjustWidth(worksheet: Worksheet) {
        worksheet.columns.forEach((column, index) => {
            let maxCellLength = 0;
            worksheet.getColumn(index + 1).eachCell({ includeEmpty: true }, (cell) => {
                const columnLength = cell.value ? cell.value.toString().length - 2 : 0;
                maxCellLength = Math.max(maxCellLength, columnLength);
            });
            column.width = maxCellLength < 8 ? 12 : maxCellLength;

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

    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }
}
