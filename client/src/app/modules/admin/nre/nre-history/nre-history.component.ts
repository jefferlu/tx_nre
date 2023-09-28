import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, Input, Output, ViewEncapsulation, ViewChild } from '@angular/core';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { NreService } from '../nre.service';
import { Subject } from 'rxjs';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { AlertService } from 'app/layout/common/alert/alert.service';

@Component({
    selector: 'nre-history',
    templateUrl: './nre-history.component.html',
    styleUrls: ['./nre-history.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NreHistoryComponent implements OnInit, OnDestroy {

    @Input() project: any;
    @Output() closeEvent = new EventEmitter<any>();
    @ViewChild(MatSort) sort: MatSort;

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    dataSource = null;
    displayedColumns: string[] = ['no', 'name', 'version', 'updated_by', 'updated_at', 'action', 'button'];

    page: any = {
        data: []
    }

    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseConfirmationService: FuseConfirmationService,
        private _alert: AlertService,
        private _nreService: NreService,
    ) { }

    ngOnInit(): void {
        console.log(this.project)

        this.search()
    }

    search(version?: any): void {

        let slug: any = { 'project_id': this.project.id };
        this._nreService.getHistorys(slug).subscribe({
            next: (res) => {
                if (res) {
                    this.dataSource = new MatTableDataSource(res)
                    this.dataSource.sort = this.sort;

                    this._changeDetectorRef.markForCheck();
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

    onRestore(history_id: any): void {
        let dialogRef = this._fuseConfirmationService.open({
            message: `Are you sure to restore this project?`,
            icon: { color: 'primary' },
            actions: { confirm: { label: 'Restore', color: 'primary' } }

        });

        dialogRef.afterClosed().subscribe(result => {
            if (result === 'confirmed') {

                this.restore(history_id)
                this._changeDetectorRef.markForCheck();
            }
        });
    }

    restore(id: number): void {
        this._nreService.restoreHistory(id).subscribe({
            next: (res) => {
                if (res) {
                    this._alert.open({ message: 'The project has been restored.' });                    
                    this.closeEvent.emit(true);
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

    onClose(): void {
        this.closeEvent.emit();
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }
}
