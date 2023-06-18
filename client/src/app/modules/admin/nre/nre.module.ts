import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';

import { SharedModule } from 'app/shared/shared.module';
import { NreComponent } from './nre.component';
import { NumericOnlyDirective, NumericTwoDigitDirective } from 'app/core/directives/numeric.directive';


@NgModule({
    declarations: [NreComponent, NumericOnlyDirective, NumericTwoDigitDirective],
    imports: [
        RouterModule.forChild([{ path: '', component: NreComponent }]),
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatButtonModule,
        MatSelectModule,
        MatTabsModule,
        SharedModule
    ]
})
export class NreModule { }
