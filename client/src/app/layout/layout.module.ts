import { NgModule } from '@angular/core';
import { SharedModule } from 'app/shared/shared/shared.module';
import { LayoutComponent } from './layout.component';
import { RouterModule } from '@angular/router';
import { FuseLoadingBarModule } from '@fuse/components/loading-bar';

@NgModule({
    declarations: [
        LayoutComponent
    ],
    imports: [
        RouterModule,
        FuseLoadingBarModule,
        SharedModule,
    ],
    exports: [
        LayoutComponent,
    ]
})
export class LayoutModule { }
