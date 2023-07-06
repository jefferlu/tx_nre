import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { SettingsService } from '../settings.service';

@Component({
    selector: 'default-items',
    templateUrl: './default-items.component.html',
    styleUrls: ['./default-items.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DefaultItemsComponent implements OnInit {

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    page = {
        items: null
    }

    /**
     * Constructor
     */
    constructor(
        private _formBuilder: UntypedFormBuilder,
        private _changeDetectorRef: ChangeDetectorRef,
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
                this.page.items = res;

                console.log(res)

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });
    }

    change(): void {
        // this.page.status = {
        //     label: 'Modified',
        //     color: 'red',
        //     change: true
        // }
    }
    
    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }
}
