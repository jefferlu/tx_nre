import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

import { SharedModule } from 'app/shared/shared.module';
import { DashboardComponent } from './dashboard.component';




@NgModule({
    declarations: [DashboardComponent],
    imports: [
        RouterModule.forChild([{ path: '', component: DashboardComponent }]),
        MatIconModule,
        MatButtonModule,
        MatMenuModule,
        MatTooltipModule,
        SharedModule
    ]
})
export class DashboardModule { }
