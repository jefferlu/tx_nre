import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { CookieService } from 'ngx-cookie-service';

import { FuseModule } from '@fuse';
import { CoreModule } from './core/core.module';
import { LayoutModule } from './layout/layout.module';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FuseConfigModule } from '@fuse/services/config';
import { appConfig } from './core/config/app.config';


@NgModule({
    declarations: [
        AppComponent,
    ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        AppRoutingModule,

        FuseModule,
        FuseConfigModule.forRoot(appConfig),

        CoreModule,
        LayoutModule

    ],
    providers: [CookieService],
    bootstrap: [AppComponent]
})
export class AppModule { }
