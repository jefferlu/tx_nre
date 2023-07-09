import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { SettingsService } from '../settings.service';
import { FuseConfirmationService } from '@fuse/services/confirmation';

@Component({
    selector: 'default-items',
    templateUrl: './default-items.component.html',
    styleUrls: ['./default-items.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DefaultItemsComponent implements OnInit {

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    elementPattern = null;
    page = {
        items: null,
        data: null
    }

    /**
     * Constructor
     */
    constructor(
        private _formBuilder: UntypedFormBuilder,
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseConfirmationService: FuseConfirmationService,
        private _settingsService: SettingsService
    ) {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Get the items
        this._settingsService.items$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((res: any) => {
                if (res) {
                    this.page.items = res;

                    this.elementPattern = res[0];
                    this.page.data = JSON.parse(JSON.stringify(res));
                    console.log('init', res)

                    // Mark for check
                    this._changeDetectorRef.markForCheck();
                }
            });
    }

    change(): void {
        // this.page.status = {
        //     label: 'Modified',
        //     color: 'red',
        //     change: true
        // }
    }

    add(): void {
        let newItem = {}
        for (let key in this.elementPattern) {
            if (key !== 'id')
                newItem[key] = null;
        }
        this.page.data.unshift(newItem);
    }

    save(): void {
        console.log(this.page.data)

        this._settingsService.saveItems(this.page.data).subscribe({
            next: (res) => {
                let dialogRef = this._fuseConfirmationService.open({
                    message: `Save completed.`,
                    icon: { color: 'primary' },
                    actions: { confirm: { color: 'primary', label: 'OK' }, cancel: { show: false } }
                });
                console.log('res', res)
                this.page.data = res;

                this._changeDetectorRef.markForCheck();
            },
            error: e => {
                console.log(e)
                console.log(e.error.detail ? e.error.detail : e.message)
                let title = `createProject() error`
                let message = e.error.detail ? e.error.detail : e.message

                if (e.status == 400 && e.error) {
                    title = 'Error';
                    message = e.error
                }

                const dialogRef = this._fuseConfirmationService.open({
                    title: title,
                    message: message,
                    actions: { cancel: { show: false } }
                });

            }
        });
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }
}
