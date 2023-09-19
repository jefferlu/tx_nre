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
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';


import { SharedModule } from 'app/shared/shared.module';
import { NreComponent } from './nre.component';
import { NreListComponent } from './nre-list/nre-list.component';
import { NreDetailComponent } from './nre-detail/nre-detail.component';
import { NreCreateComponent } from './nre-create/nre-create.component';


@NgModule({
    declarations: [NreComponent, NreListComponent, NreDetailComponent, NreCreateComponent],
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
        MatMenuModule,
        MatTooltipModule,
        MatTableModule,
        MatSortModule,
        MatSidenavModule,
        MatListModule,
        SharedModule
    ]
})
export class NreModule { }
