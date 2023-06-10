import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { FuseLoadingBarModule } from '@fuse/components/loading-bar/loading-bar.module';
import { SharedModule } from 'app/shared/shared.module';
import { SignInComponent } from './sign-in.component';
import { FuseAlertModule } from '@fuse/components/alert';



@NgModule({
    declarations: [
        SignInComponent
    ],
    imports: [
        RouterModule.forChild([{ path: '', component: SignInComponent }]),
        FuseLoadingBarModule,
        FuseAlertModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        SharedModule
    ]
})
export class SignInModule { }
