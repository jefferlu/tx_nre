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
            version: ['', [Validators.required, control => this._versionDuplicate.validator(control, this.page.project.id, this.page.dataset.versions)]],
            power_ratio: [null, [Validators.required]]
        })

        // Observable filter
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

                // let projects = this.page.projects.filter(e => e.customer == this.form.value.customer)
                // const name = typeof value === 'string' ? value : value?.name;
                // console.log('valuechange', name, projects)
                // return name ? this._filter(name as string) : projects.slice();
            }),
            filter(value => value && value.length >= this.page.minLength)
        ).subscribe((value) => {
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
                let dialogRef = this._fuseConfirmationService.open({
                    title: `Error ${e.status}`,
                    message: `${e.statusText}.<br/>Please contact the administrator.`,
                    actions: { confirm: { color: 'primary', label: 'OK' }, cancel: { show: false } }
                });

                dialogRef.afterClosed().subscribe(result => {
                    if (result === 'confirmed') {
                        this.onSearchOpen();
                        this._changeDetectorRef.markForCheck();
                    }
                });
            }
        });
    }

    save(): void {

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
                    let message = e.error.detail ? e.error.detail : e.message;

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
                    let dialogRef = this._fuseConfirmationService.open({
                        message: `The project has been saved.`,
                        icon: { color: 'primary' },
                        actions: { confirm: { color: 'primary', label: 'OK' }, cancel: { show: false } }
                    });

                    console.log('create res', res, this.page.project)
                    this.manageData(res);

                    this._changeDetectorRef.markForCheck();
                },
                error: e => {
                    console.log(e)
                    let message = e.error.detail ? e.error.detail : e.message;

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

    calculate(): void {

        if (this.page.data) {
            for (let i in this.page.data.functions) {
                let func = this.page.data.functions[i];

                func['concept'] = null;
                func['bu'] = null;
                func['ct'] = null;
                func['nt'] = null;
                func['ot'] = null;

                for (let j in func.test_items) {
                    let item = func.test_items[j];

                    item['concept'] = null;
                    item['bu'] = null;
                    item['ct'] = null;
                    item['nt'] = null;
                    item['ot'] = null;

                    if (item.equip_working_hours != null) {

                        item['sub_total'] = 0;
                        if (item.record.concept_regression_rate != null) {
                            item['concept'] = parseFloat(item.record.concept_regression_rate) * item.equip_working_hours;
                            item['sub_total'] += item['concept'];

                            if (func['concept'] == null) func['concept'] = 0
                            func['concept'] += parseFloat(item.record.concept_regression_rate) * item.man_working_hours;
                        }

                        if (item.record.bu_regression_rate != null) {
                            item['bu'] = parseFloat(item.record.bu_regression_rate) * item.equip_working_hours;
                            item['sub_total'] += item['bu'];

                            if (func['bu'] == null) func['bu'] = 0
                            func['bu'] += parseFloat(item.record.bu_regression_rate) * item.man_working_hours;
                        }

                        if (item.record.ct_regression_rate != null) {
                            item['ct'] = parseFloat(item.record.ct_regression_rate) * item.equip_working_hours;
                            item['sub_total'] += item['ct'];

                            if (func['ct'] == null) func['ct'] = 0
                            func['ct'] += parseFloat(item.record.ct_regression_rate) * item.man_working_hours;
                        }

                        if (item.record.nt_regression_rate != null) {
                            item['nt'] = parseFloat(item.record.nt_regression_rate) * item.equip_working_hours;
                            item['sub_total'] += item['nt'];

                            if (func['nt'] == null) func['nt'] = 0
                            func['nt'] += parseFloat(item.record.nt_regression_rate) * item.man_working_hours;
                        }

                        if (item.record.ot_regression_rate != null) {
                            item['ot'] = parseFloat(item.record.ot_regression_rate) * item.equip_working_hours;
                            item['sub_total'] += item['ot'];

                            if (func['ot'] == null) func['ot'] = 0
                            func['ot'] += parseFloat(item.record.ot_regression_rate) * item.man_working_hours;
                        }
                    }

                    if (func.name === 'Reliability') {
                        // console.log(item)
                    }
                }
            }
        }
        console.log(this.page.data)
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

    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }
}
