import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { NgApexchartsModule } from 'ng-apexcharts';

import { SharedModule } from 'app/shared/shared.module';
import { DashboardComponent } from './dashboard.component';
import { SearchBoxPipe } from './search-box.pipe';




@NgModule({
    declarations: [DashboardComponent, SearchBoxPipe],
    imports: [
        RouterModule.forChild([{ path: '', component: DashboardComponent }]),
        MatIconModule,
        MatButtonModule,
        MatMenuModule,
        MatTooltipModule,
        MatFormFieldModule,
        MatInputModule,
        NgApexchartsModule,
        SharedModule
    ]
})
export class DashboardModule { }
