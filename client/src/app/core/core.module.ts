import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthModule } from './auth/auth.module';
import { IconsModule } from './icons/icons.module';



@NgModule({
    imports: [
        AuthModule,
        IconsModule
    ]
})
export class CoreModule { }
