import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';

import { NreService } from './nre.service';
import { Observable, Subject, debounceTime, filter, map, startWith, takeUntil } from 'rxjs';
import { SpecialAlpha } from 'app/core/validators/special-alpha';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { fuseAnimations } from '@fuse/animations';
import { VersionDuplicate } from 'app/core/validators/version-duplicate';
import { MatSnackBar, MatSnackBarHorizontalPosition, MatSnackBarVerticalPosition } from '@angular/material/snack-bar';
import { FuseAlertComponent } from '@fuse/components/alert/alert.component';
import { AlertComponent } from 'app/layout/common/alert/alert.component';
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
            project: ['proj-demo-1', [Validators.required, this._specialApha.nameValidator]]
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


        // Get customers
        this._nreService.customers$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((res: any) => {
                if (res) {
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
                console.log('init', res)
                if (res) {
                    this.page.dataset.versions = res;
                    this._changeDetectorRef.markForCheck();
                }
            });

        // reload saved page data
        if (this._nreService.page) {
            this.page = this._nreService.page;
            console.log(this._nreService.page)
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

        this.page.status.label = undefined;
        // this.page.data = JSON.parse(JSON.stringify(this.page.dataset.customers.find((e: any) => e.id === this.form.value.customer)));

        let slug: any = { 'customer': this.form.value.customer };
        if (version) slug.version = version;

        this._nreService.getProject(this.form.value.project, slug).subscribe({
            next: (res) => {
                if (res) {

                    this.manageData(res);
                    this.page.tab.index = 0;
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
        console.log('create')

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
        console.log(this.page.data, this.page.project);

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

    save_bk(): void {

        // check version and project.id is in 'version' FormControl
        if (this.formSave.invalid) return;

        // check project is loaded
        if (!this.page.data) {
            let dialogRef = this._fuseConfirmationService.open({
                title: 'Invalid action',
                message: `Project has not been loaded.`,
                actions: { confirm: { color: 'primary', label: 'OK' }, cancel: { show: false } }
            });

            dialogRef.afterClosed().subscribe(result => {
                if (result === 'confirmed') {
                    this.onSearchOpen();
                    this._changeDetectorRef.markForCheck();
                }
            });
            return;
        }

        this.page.project.version = this.formSave.value.version;
        this.page.project.power_ratio = this.formSave.value.power_ratio;



        // check new version. exist->update, not exist->create
        let exist = this.page.dataset.versions.findIndex(e => e.version === this.page.project.version)

        // clear project id
        if (exist === -1) this.page.project.id = null;

        this.page.project.records = [];
        for (let func of this.page.data.functions) {
            for (let item of func.test_items) {

                item.record.test_item = item.id;    //new record from api doesn't have item id

                if (exist === -1) {
                    // clear record id
                    delete item.record.id;
                    // clear project in in record
                    delete item.record.project;
                }

                this.page.project.records.push(item.record)
            }
        }

        console.log(this.page.data, this.page.project);


        // Update
        if (this.page.project.id) {
            // request.id = this.page.project.id;
            let slug: any = { 'customer': this.form.value.customer, 'version': this.page.project.version };

            this._nreService.updateProject(this.page.project.name, slug, this.page.project).subscribe({
                next: (res) => {
                    if (res) {
                        // let dialogRef = this._fuseConfirmationService.open({
                        //     message: `The project has been saved.`,
                        //     icon: { color: 'primary' },
                        //     actions: { confirm: { color: 'primary', label: 'OK' }, cancel: { show: false } }
                        // });

                        this._alert.open({ message: 'The project has been saved.' });
                        this.manageData(res);

                        // this.calculate();
                        // this.search(this.page.project.version);
                    }
                },
                error: e => {
                    console.log(e)
                    let message = JSON.stringify(e.error)

                    if (e.error.version) message = `Version: ${e.error.version[0]}`;
                    if (e.error.non_field_errors) message = `${e.error.non_field_errors[0].replace('name', 'project')}`;

                    const dialogRef = this._fuseConfirmationService.open({
                        icon: { color: 'primary' },
                        title: `Info`,
                        message: message,
                        actions: { confirm: { color: 'primary' }, cancel: { show: false } }
                    });
                }
            })
        }
        // Crate
        else {
            // console.log('request-->', request)
            this._nreService.createProject(this.page.project).subscribe({
                next: (res) => {
                    // let dialogRef = this._fuseConfirmationService.open({
                    //     message: `The project has been saved.`,
                    //     icon: { color: 'primary' },
                    //     actions: { confirm: { color: 'primary', label: 'OK' }, cancel: { show: false } }
                    // });

                    // console.log('create res', res, this.page.project)

                    this._alert.open({ message: 'The project has been saved.' });
                    this.manageData(res);
                },
                error: e => {
                    console.log(e)
                    let message = JSON.stringify(e.erro);

                    if (e.error.version) message = `The field version is required.`;
                    if (e.error.non_field_errors) message = `${e.error.non_field_errors[0].replace('name', 'project')}`;

                    const dialogRef = this._fuseConfirmationService.open({
                        icon: { color: 'primary' },
                        title: `Info`,
                        message: message,
                        actions: { confirm: { color: 'primary' }, cancel: { show: false } }
                    });
                }
            });
        }

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

        console.log(this.page.project, this.page.data)

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

                    console.log(item)

                    // Concept
                    if (item.record.concept_need_test) {
                        item['concept_capacity'] = item.record.concept_test_uut * this.page.project.power_ratio;
                        if (func.name === 'Reliability') item['concept_capacity'] *= 0.8;
                        item['concept_chambers'] = this.selectChambers(item['concept_capacity']);
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
                        item['bu_chambers'] = this.selectChambers(item['bu_capacity']);
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
                        item['ct_chambers'] = this.selectChambers(item['ct_capacity']);
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
                        item['nt_chambers'] = this.selectChambers(item['nt_capacity']);
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
                        item['ot_chambers'] = this.selectChambers(item['ot_capacity']);
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
        console.log(this.selectChambers(12200))
    }

    private selectChambers(capacity: number) {
        const chambers: any[] = [
            { name: '1K', capacity: 1000 },
            { name: '2K', capacity: 2000 },
            { name: 'Walk-in', capacity: 6000 }
        ];
        chambers.sort((a, b) => b.capacity - a.capacity); // 按照容量從大到小排序

        let sortedChambers = JSON.parse(JSON.stringify(chambers));
        sortedChambers = sortedChambers.sort((a, b) => a.capacity - b.capacity)// 按照容量從小到大排序

        const selectedChambers: any[] = [];
        if (capacity > 0) {
            // // 優先選擇可以滿足 capacity 的單個 chamber
            // for (let i = 0; i < chambers.length; i++) {
            //     let chamber = chambers[i];
            //     if (chamber.capacity >= capacity) {
            //         selectedChambers.push({ name: chambers[i].name, count: 1 });
            //         return selectedChambers; // 返回单个 chamber
            //     }
            // }


            let remainingRate = capacity;
            for (let chamber of chambers) {
                if (remainingRate > 0) {
                    // 商數找出滿足最大容量的chamber(降冪)
                    let count = Math.floor(remainingRate / chamber.capacity);
                    if (count > 0) {
                        selectedChambers.push({ name: chamber.name, count: count });
                    }

                    // 餘數找出滿足最小容量的chamber(升冪)
                    remainingRate = remainingRate % chamber.capacity;
                    if (remainingRate > 0) {
                        for (let chamber of sortedChambers) {
                            if (chamber.capacity >= remainingRate) {

                                let index = selectedChambers.findIndex(e => e.name === chamber.name)
                                console.log('index', index)
                                if (index === -1) selectedChambers.push({ name: chamber.name, count: 1 });
                                else selectedChambers[index].count += 1;
                                return selectedChambers;
                            }
                        }
                    }
                    else return selectedChambers;
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

    export(type: number): void {
        switch (type) {
            // Equipment
            case 0:
                console.log('equipment');
                break;
            // Man Power
            case 1:
                console.log('man power')
                break;
        }
    }


    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }
}
