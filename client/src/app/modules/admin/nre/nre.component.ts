import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';


import { AppService } from 'app/core/services/app.service';
import { NreService } from './nre.service';
import { Subject, takeUntil } from 'rxjs';
import { SpecialAlpha } from 'app/core/validators/special-alpha';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { fuseAnimations } from '@fuse/animations';

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

    customers: any;
    records: any;
    selectedCustomer: any;

    page = {
        search: {
            opened: false,
        },
        project: {
            id: null,
            name: '',
            power_ratio: null,
            customer: null
        },
        status: {
            label: null,
            color: null,
            change: false,
        },
        tab: {
            index: 0
        },
        data: null
    }

    constructor(
        private _formBuilder: UntypedFormBuilder,
        private _changeDetectorRef: ChangeDetectorRef,
        private _specialApha: SpecialAlpha,
        private _fuseConfirmationService: FuseConfirmationService,
        private _nreService: NreService

    ) { }

    ngOnInit(): void {

        this.form = this._formBuilder.group({
            customer: [0, [Validators.required]],
            project: ['proj-demo-1', [Validators.required, this._specialApha.nameValidator]]
        });

        this.formSave = this._formBuilder.group({
            power_ratio: [null, [Validators.required]]
        })

        // Get the categories
        this._nreService.customers$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((res: any) => {
                this.customers = res.results;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        if (this._nreService.project) {
            this.page.project = this._nreService.project;

            this.form.get('project').setValue(this.page.project.name);
            this.form.get('customer').setValue(this.page.project.customer);
            this.formSave.get('power_ratio').setValue(this.page.project.power_ratio);
            this.search();
        }

        console.log(this._nreService.project);

    }

    onSearchOpen(): void {
        // Return if it's already opened
        if (this.page.search.opened) {
            return;
        }

        // Open the search
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

    search(): void {


        this.page.status.label = undefined;
        this.page.data = JSON.parse(JSON.stringify(this.customers[this.form.value.customer]));

        this._nreService.getProject(this.form.value.project).subscribe({
            next: (res) => {
                if (res) {

                    for (let i in this.page.data.functions) {
                        let fun = this.page.data.functions[i]
                        for (let j in fun.test_items) {
                            let item = fun.test_items[j];
                            let record = res.records.find(e => e.test_item === item.id)
                            if (record) {
                                this.page.data.functions[i].test_items[j].record = record;
                            }
                        }
                    }

                    this.page.project = {
                        id: res.id,
                        name: res.name,
                        power_ratio: +res.power_ratio,
                        customer: this.form.value.customer
                    }

                    this.formSave.get('power_ratio').setValue(this.page.project.power_ratio);

                    // keep page data
                    this._nreService.project = this.page.project;

                    this.page.status = {
                        label: 'Saved',
                        change: false,
                        color: 'green'
                    }

                    this._changeDetectorRef.markForCheck();
                }
            },
            error: e => {
                if (e.status === 404) {
                    // console.log(e.error.detail ? e.error.detail : e.message)

                    this.page.project = {
                        id: null,
                        name: this.form.value.project,
                        power_ratio: null,
                        customer: this.form.value.customer
                    }
                    this._nreService.project = this.page.project;

                    this.page.status = {
                        label: 'New',
                        change: false,
                        color: 'blue'
                    }

                    this.formSave.get('power_ratio').setValue(null);

                    this._changeDetectorRef.markForCheck();
                }
            }
        });
    }

    save(): void {

        if (this.formSave.invalid) return;

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

        // this.page.tab.index = 1;
        console.log(this.page.data)

        let request = {
            'id': null,
            'name': this.page.project.name,
            'power_ratio': this.formSave.value.power_ratio,
            'records': []
        }
        for (let func of this.page.data.functions) {
            for (let item of func.test_items) {
                item.record.test_item = item.id;
                request.records.push(item.record)
            }
        }

        // Update
        if (this.page.project.id) {
            request.id = this.page.project.id

            this._nreService.updateProject(this.page.project.name, request).subscribe({
                next: (res) => {
                    let dialogRef = this._fuseConfirmationService.open({
                        message: `The project has been saved.`,
                        icon: { color: 'primary' },
                        actions: { confirm: { color: 'primary', label: 'OK' }, cancel: { show: false } }
                    });

                    this.search();
                },
                error: e => { }
            })
        }
        // Crate
        else {

            console.log('request-->', request)
            this._nreService.createProject(request).subscribe({
                next: (res) => {
                    let dialogRef = this._fuseConfirmationService.open({
                        message: `The project has been saved.`,
                        icon: { color: 'primary' },
                        actions: { confirm: { color: 'primary', label: 'OK' }, cancel: { show: false } }
                    });

                    this.search();

                    // let dialogRef = this._fuseConfirmationService.open({
                    //     title: 'Hint',
                    //     message: `Save completed.`,
                    //     icon: { color: 'success' },
                    //     actions: { confirm: { color: 'primary', label: 'OK' }, cancel: { show: false } }
                    // });


                    this._changeDetectorRef.markForCheck();
                },
                error: e => { }
            });
        }

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
}
