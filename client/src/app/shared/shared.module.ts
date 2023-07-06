import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { NumericOnlyDirective, NumericTwoDigitDirective } from 'app/core/directives/numeric.directive';

@NgModule({
    declarations: [
        NumericOnlyDirective,
        NumericTwoDigitDirective
    ],
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule
    ],
    exports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        NumericOnlyDirective,
        NumericTwoDigitDirective
    ]
})
export class SharedModule { }
