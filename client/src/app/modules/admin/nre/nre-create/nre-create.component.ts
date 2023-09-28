import { ChangeDetectionStrategy, Component, EventEmitter, Output, ViewEncapsulation, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Subject, map, takeUntil } from 'rxjs';
import { NreService } from '../nre.service';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { SpecialAlpha } from 'app/core/validators/special-alpha';
import { AlertService } from 'app/layout/common/alert/alert.service';

@Component({
    selector: 'nre-create',
    templateUrl: './nre-create.component.html',
    styleUrls: ['./nre-create.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NreCreateComponent implements OnInit, OnDestroy {

    @Output() closeEvent = new EventEmitter<any>();
    @Output() projectEvent = new EventEmitter<any>();

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    form: UntypedFormGroup;
    page: any = {
        dataset: {
            customers: null,
        },
        project: {},
        data: []
    }

    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _formBuilder: UntypedFormBuilder,
        private _fuseConfirmationService: FuseConfirmationService,
        private _specialApha: SpecialAlpha,
        private _alert: AlertService,
        private _nreService: NreService,
    ) { }

    ngOnInit(): void {

        this.form = this._formBuilder.group({
            customer: [0, [Validators.required]],
            project: [null, [Validators.required]],
            version: [null, [Validators.required, this._specialApha.nameValidator]]
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

        // FormControls valueChange Observable 
        this.form.get('customer').valueChanges.pipe(
            takeUntil(this._unsubscribeAll),
            map(value => {
                this.manageData(value);

            })
        ).subscribe();

        this.manageData();
    }

    private manageData(id?: number) {
        this.page.data = JSON.parse(JSON.stringify(this.page.dataset.customers.find((e: any) => e.id === (id || this.form.value.customer))));


        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    onCreate(): void {
        // check version and project.id is in 'version' FormControl
        if (this.form.invalid) return;

        let dialogRef = this._fuseConfirmationService.open({
            message: 'Are you sure to create?',
            icon: { color: 'primary' },
            actions: { confirm: { label: 'Create', color: 'primary' } }

        });

        dialogRef.afterClosed().subscribe(result => {
            if (result === 'confirmed') {
                this.create();
                this._changeDetectorRef.markForCheck();
            }
        });
    }

    create(): void {

        this.page.project.customer = this.form.get('customer').value;
        this.page.project.name = this.form.get('project').value;
        this.page.project.version = this.form.get('version').value;

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

                    this.selectProject(res);
                }
            },
            error: e => {
                console.log(e)
                let message = JSON.stringify(e.message);
                if (e.error) message = e.error

                this._alert.open({ type: 'warn',message: message });                   
            }
        });
    }

    selectProject(project: any): void {
        this.projectEvent.emit(project);
    }

    onClose(): void {
        this.closeEvent.emit();
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

}
