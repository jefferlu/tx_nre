import { Component, ViewEncapsulation, ChangeDetectionStrategy, OnInit, ChangeDetectorRef, ViewChild, Output, EventEmitter } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { NreService } from '../nre.service';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { FuseConfirmationService } from '@fuse/services/confirmation';

@Component({
    selector: 'nre-list',
    templateUrl: './nre-list.component.html',
    styleUrls: ['./nre-list.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NreListComponent implements OnInit {
    @Output() projectEvent = new EventEmitter<number>();
    @ViewChild(MatSort) sort: MatSort;

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    form: UntypedFormGroup;

    page: any = {
        dataset: {
            customers: null,
        },
        data: []
    }

    rowNumber: number = 1;
    displayedColumns: string[] = ['no', 'name', 'version', 'power_ratio', 'man_hrs', 'equip_hrs', 'fees', 'updated_at'];

    ELEMENT_DATA: any[] = [
        { position: 1, name: 'Hydrogen', weight: 1.0079, symbol: 'H' },
        { position: 2, name: 'Helium', weight: 4.0026, symbol: 'He' },
        { position: 3, name: 'Lithium', weight: 6.941, symbol: 'Li' },
        { position: 4, name: 'Beryllium', weight: 9.0122, symbol: 'Be' },
        { position: 5, name: 'Boron', weight: 10.811, symbol: 'B' },
        { position: 6, name: 'Carbon', weight: 12.0107, symbol: 'C' },
        { position: 7, name: 'Nitrogen', weight: 14.0067, symbol: 'N' },
        { position: 8, name: 'Oxygen', weight: 15.9994, symbol: 'O' },
        { position: 9, name: 'Fluorine', weight: 18.9984, symbol: 'F' },
        { position: 10, name: 'Neon', weight: 20.1797, symbol: 'Ne' },
    ];
    // dataSource = new MatTableDataSource(this.ELEMENT_DATA);
    dataSource = null;

    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _formBuilder: UntypedFormBuilder,
        private _fuseConfirmationService: FuseConfirmationService,
        private _nreService: NreService,
    ) { }

    ngOnInit(): void {
        console.log(this.dataSource)
        this.form = this._formBuilder.group({
            customer: [0, [Validators.required]],
            project: ['']
        });

        // Get customers
        this._nreService.customers$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((res: any) => {
                if (res && res.length > 0) {
                    console.log('init')
                    this.page.dataset.customers = res;
                    this.form.get('customer').setValue(res[0].id);
                }
            });
    }

    ngAfterViewInit() { }

    onSearch(): void {
        if (this.form.invalid) return;

        if (!this.page.dataset.customers) return;

        let slug: any = { 'customer': this.form.value.customer };
        if (this.form.value.project) slug['name'] = this.form.value.project;
        this._nreService.getProjects(slug).subscribe({
            next: (res) => {
                if (res) {
                    this.page.data = res;

                    // mat-table
                    this.dataSource = new MatTableDataSource(res)
                    this.dataSource.sort = this.sort;

                    if (res.length > 0) this.form.get('project').setValue(null);
                    this._changeDetectorRef.markForCheck();
                }
            },
            error: e => {
                console.log(e)
                const dialogRef = this._fuseConfirmationService.open({
                    icon: { color: 'warn' },
                    title: `Error`,
                    message: JSON.stringify(e.message),
                    actions: { confirm: { color: 'primary' }, cancel: { show: false } }
                });
            }
        });

    }

    selectProject(project: any): void {
        this.projectEvent.emit(project);
        console.log('list', project)
    }

    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }
}
