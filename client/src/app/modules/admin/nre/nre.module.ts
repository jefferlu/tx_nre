import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { SharedModule } from 'src/app/shared/shared/shared.module';
import { NreComponent } from './nre.component';


@NgModule({
    declarations: [NreComponent],
    imports: [
        RouterModule.forChild([{ path: '', component: NreComponent }]),
        SharedModule
    ]
})
export class NreModule { }
