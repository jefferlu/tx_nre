import { ChangeDetectionStrategy, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';

import { AppService } from 'app/core/services/app.service';

@Component({
    selector: 'app-nre',
    templateUrl: './nre.component.html',
    styleUrls: ['./nre.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NreComponent implements OnInit {

    data: any;
    searchInputControl: UntypedFormControl = new UntypedFormControl();

    constructor(private _appService: AppService) { }

    ngOnInit(): void {
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

    save(): void {

    }
}
