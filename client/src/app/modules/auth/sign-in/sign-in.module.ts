import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

import { SharedModule } from 'src/app/shared/shared/shared.module';
import { SignInComponent } from './sign-in.component';


@NgModule({
    declarations: [
        SignInComponent
    ],
    imports: [
        RouterModule.forChild([{ path: '', component: SignInComponent }]),
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        SharedModule
    ]
})
export class SignInModule { }
