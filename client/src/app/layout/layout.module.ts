import { NgModule } from '@angular/core';
import { SharedModule } from 'app/shared/shared.module';
import { LayoutComponent } from './layout.component';
import { EmptyLayoutModule } from './layouts/empty/empty.module';
import { ModernLayoutModule } from './layouts/horizontal/modern/modern.module';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

const layoutModules = [
    // Empty
    EmptyLayoutModule,

    // Horizontal navigation
    ModernLayoutModule,

];

@NgModule({
    declarations: [
        LayoutComponent
    ],
    imports: [
        MatSnackBarModule,
        SharedModule,
        ...layoutModules
    ],
    exports: [
        LayoutComponent,
        ...layoutModules
    ],
    providers: [MatSnackBar]
})
export class LayoutModule { }
