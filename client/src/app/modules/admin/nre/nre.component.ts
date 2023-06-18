import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';


import { AppService } from 'app/core/services/app.service';
import { NreService } from './nre.service';
import { Subject, takeUntil } from 'rxjs';
import { SpecialAlpha } from 'app/core/validators/special-alpha';
import { FuseConfirmationService } from '@fuse/services/confirmation';

@Component({
    selector: 'app-nre',
    templateUrl: './nre.component.html',
    styleUrls: ['./nre.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NreComponent implements OnInit {

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    form: UntypedFormGroup;
    customers: any;
    records: any;
    selectedCustomer: any;

    // project info
    project = {
        id: null,
        name: '',
        power_ratio: null
    };

    // status
    status = {
        change: false,
        color: 'green',
        label: ''
    }

    // tab
    tab = {
        index: 0
    }


    data: any;


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
            project: ['proj-demo-1', [Validators.required, this._specialApha.nameValidator]],
            power_ratio: [],

        });

        // Get the categories
        this._nreService.customers$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((res: any) => {
                this.customers = res.results;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

    }

    onSearch(): void {

        if (this.form.invalid) return;

        if (this.status.change) {
            let dialogRef = this._fuseConfirmationService.open({
                // title: e.statusText,
                // title: 'Hint',
                message: `The project has been modified and has not been archived yet. Are you sure to discard it?`,
                // message: e.error.detail ? e.error.detail : e.message,

                actions: { confirm: {}, cancel: {} }
            });

            dialogRef.afterClosed().subscribe(result => {
                if (result === 'confirmed') {
                    this.search();
                    this._changeDetectorRef.markForCheck();
                }
            });

        }
        else {
            this.search();
        }
    }

    search(): void {

        this.status.label = undefined;

        this.data = JSON.parse(JSON.stringify(this.customers[this.form.value.customer]));
        const power_ratio = this.form.get('power_ratio');

        this._nreService.getProject(this.form.value.project).subscribe({
            next: (res) => {
                if (res) {

                    for (let i in this.data.functions) {
                        let fun = this.data.functions[i]
                        for (let j in fun.test_items) {
                            let item = fun.test_items[j];
                            let record = res.records.find(e => e.test_item === item.id)
                            if (record) {
                                this.data.functions[i].test_items[j].record = record;
                            }
                        }
                    }
                    power_ratio.setValue(+res.power_ratio);
                    this.project = {
                        id: res.id,
                        name: res.name,
                        power_ratio: res.power_ratio
                    }

                    this.status = {
                        label: 'Archived',
                        change: false,
                        color: 'green'
                    }

                    this._changeDetectorRef.markForCheck();
                }
            },
            error: e => {
                if (e.status === 404) {
                    // console.log(e.error.detail ? e.error.detail : e.message)

                    this.project = {
                        id: null,
                        name: this.form.value.project,
                        power_ratio: null
                    }

                    this.status = {
                        label: 'New',
                        change: false,
                        color: 'blue'
                    }

                    power_ratio.setValue(null);

                    // const dialogRef = this._fuseConfirmationService.open({
                    //     // title: e.statusText,
                    //     title: 'Hint',
                    //     message: `This project does not exist and the template has been automatically loaded.`,
                    //     // message: e.error.detail ? e.error.detail : e.message,
                    //     icon: { color: 'info' },
                    //     actions: { confirm: { color: 'primary', label: 'OK' }, cancel: { show: false } }
                    // });

                    this._changeDetectorRef.markForCheck();
                }
            }
        });
    }

    save(): void {
        console.log(this.data)
        this.tab.index = 1;
        // Update
        if (this.project.id) {

        }
        // Crate
        else {
            let request = {
                'name': this.project.name,
                'power_ratio': this.form.value.power_ratio,
                'records': []
            }
            for (let func of this.data.functions) {
                for (let item of func.test_items) {
                    item.record.test_item = item.id;
                    request.records.push(item.record)
                }
            }
            console.log('request-->', request)
            this._nreService.createProject(request).subscribe({
                next: (res) => {
                    this.status = {
                        change: false,
                        color: 'green',
                        label: 'Archived'
                    }

                    this.project = {
                        id: res.id,
                        name: res.name,
                        power_ratio: res.power_ratio
                    }

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
        this.status.change = true;
        this.status.label = 'Modified';
        this.status.color = 'red';
        console.log('change', this.status.change)
    }

    private concatData(data) {

        return data;
    }
}
