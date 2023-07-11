import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AsyncPipe } from '@angular/common';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

import { SharedModule } from 'app/shared/shared.module';
import { NreComponent } from './nre.component';


@NgModule({
    declarations: [NreComponent],
    imports: [
        RouterModule.forChild([{ path: '', component: NreComponent }]),
        AsyncPipe,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatButtonModule,
        MatSelectModule,
        MatTabsModule,
        MatAutocompleteModule,
        SharedModule
    ]
})
export class NreModule { }
