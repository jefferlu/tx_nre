import { Component, ViewEncapsulation, ChangeDetectionStrategy, OnInit, ChangeDetectorRef, ViewChild, Output, EventEmitter } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { NreService } from '../nre.service';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { AlertService } from 'app/layout/common/alert/alert.service';

@Component({
    selector: 'nre-list',
    templateUrl: './nre-list.component.html',
    styleUrls: ['./nre-list.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NreListComponent implements OnInit {
    @Output() projectEvent = new EventEmitter<any>();
    @ViewChild(MatSort) sort: MatSort;

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    form: UntypedFormGroup;

    page: any = {
        dataset: {
            customers: null,
        },
        data: []
    }

    isCreate: boolean = false;
    rowNumber: number = 1;
    dataSource = null;
    displayedColumns: string[] = ['no', 'name', 'version', 'power_ratio', 'man_hrs', 'equip_hrs', 'fees', 'updated_at', 'hide', 'count'];

    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _formBuilder: UntypedFormBuilder,
        private _fuseConfirmationService: FuseConfirmationService,
        private _alert: AlertService,
        private _nreService: NreService,
    ) { }

    ngOnInit(): void {
        this.form = this._formBuilder.group({
            customer: [0, [Validators.required]],
            project: ['']
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

        // reload saved page data
        if (this._nreService.query) {

            this.form.get('customer').setValue(this._nreService.query.customer);
            this.form.get('project').setValue(this._nreService.query.project);
            this.search();
        }
    }

    onSearch(): void {
        if (this.form.invalid) return;
        if (!this.page.dataset.customers) return;
        this.search();
    }

    search(): void {

        let slug: any = { 'customer': this.form.get('customer').value };
        if (this.form.get('project').value) slug['name'] = this.form.get('project').value;
        this._nreService.getProjects(slug).subscribe({
            next: (res) => {
                if (res) {
                    this.page.data = res;


                    // mat-table
                    this.dataSource = new MatTableDataSource(res)
                    this.dataSource.sort = this.sort;

                    this._nreService.query = {
                        customer: this.form.get('customer').value,
                        project: this.form.get('project').value
                    }

                    // 清空project
                    // if (res.length > 0) this.form.get('project').setValue(null);

                    this._changeDetectorRef.markForCheck();
                }
            },
            error: e => {
                console.log(e)
                const dialogRef = this._fuseConfirmationService.open({
                    icon: { color: 'warn' },
                    title: `Error`,
                    message: JSON.stringify(e.message),
                    actions: { confirm: { label: 'Done', color: 'primary' }, cancel: { show: false } }
                });
            }
        });

    }

    onCreate(): void {
        this.isCreate = true;
    }

    onCloseCreate(): void {
        this.isCreate = false;
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
        this._nreService.saveProjects(this.page.data).subscribe({
            next: (res) => {
                if (res) {
                    this.search()
                    this._alert.open({ message: 'The project has been saved.' });
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

    selectProject(project: any): void {
        this.projectEvent.emit(project);
    }

    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }
}
