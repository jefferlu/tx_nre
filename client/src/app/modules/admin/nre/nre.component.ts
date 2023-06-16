import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';


import { AppService } from 'app/core/services/app.service';
import { NreService } from './nre.service';
import { Subject, takeUntil } from 'rxjs';
import { SpecialAlpha } from 'app/core/validators/special-alpha';

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

    data: any;


    constructor(
        private _formBuilder: UntypedFormBuilder,
        private _changeDetectorRef: ChangeDetectorRef,
        private _specialApha: SpecialAlpha,
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
                // this._changeDetectorRef.markForCheck();
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
        this.data = this.customers[this.form.value.customer];
        const power_ratio = this.form.get('power_ratio');

        this._nreService.getProject(this.form.value.project).subscribe({
            next: (res) => {
                if (res) {

                    power_ratio.setValue(+res.power_ratio);
                    console.log(res.records, this.data)
                    // this._changeDetectorRef.markForCheck();

                }
            }
        });
    }

    save(): void {
        console.log(this.form.value)

    }

    private concatData(data) {

        return data;
    }
}
