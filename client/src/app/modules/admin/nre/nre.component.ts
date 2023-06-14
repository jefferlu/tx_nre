import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';

import { AppService } from 'app/core/services/app.service';
import { NreService } from './nre.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'app-nre',
    templateUrl: './nre.component.html',
    styleUrls: ['./nre.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NreComponent implements OnInit {

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    customers: any;
    selectedCustomer: any;
    cust: any;

    data: any;
    searchInputControl: UntypedFormControl = new UntypedFormControl();

    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _nreService: NreService
    ) { }

    ngOnInit(): void {
        // Get the categories
        this._nreService.customers$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((res: any) => {
                this.customers = res.results;
                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        let request = {
            email: 'demo@example.com',
            password: 'demo'
        }

        // this._appService.execute_kw(request).subscribe({
        //     next: (data) => {
        //         this.data = data;
        //     }
        // })
    }

    search(): void {
        this.cust = this.customers[this.selectedCustomer];

        console.log(this.cust);
    }

    save(): void {

    }
}
