import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthModule } from './auth/auth.module';
import { IconsModule } from './icons/icons.module';
import { FuseLoadingModule } from '@fuse/services/loading';



@NgModule({
    imports: [
        AuthModule,
        FuseLoadingModule,
        IconsModule
    ]
})
export class CoreModule { }
