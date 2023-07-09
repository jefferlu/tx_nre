import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { NreService } from '../../nre/nre.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'test-fee',
    templateUrl: './test-fee.component.html',
    styleUrls: ['./test-fee.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TestFeeComponent implements OnInit {

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    page = {
        customers: null,
        customer: null,
        data: null
    }

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _nreService: NreService
    ) {
    }

    ngOnInit(): void {

        // Get the customers
        this._nreService.customers$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((res: any) => {
                if (res) {
                    this.page.customers = res;
                    // this.form.get('customer').setValue(res[0].id)
                    this.page.customer = res[0].id

                    this.page.data = JSON.parse(JSON.stringify(res[0]));

                    console.log(res)
                    // Mark for check
                    this._changeDetectorRef.markForCheck();
                }
            });
    }

    onSelectionChange(value): void {
        this.page.data = JSON.parse(JSON.stringify(this.page.customers.find((e: any) => e.id === value)));
    }

    change():void{

    }
    
    add(): void { }

    save(): void { }

    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }
}
