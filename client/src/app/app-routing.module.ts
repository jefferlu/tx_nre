import { NgModule } from '@angular/core';
import { ExtraOptions, PreloadAllModules, RouterModule, Routes } from '@angular/router';

import { LayoutComponent } from './layout/layout/layout.component';

const routerConfig: ExtraOptions = {
    preloadingStrategy: PreloadAllModules,
    scrollPositionRestoration: 'enabled'
};

const routes: Routes = [
    { path: '', pathMatch: 'full', redirectTo: 'nre' },

    // Auth routes for guests
    {
        path: '',                
        children: [
            { path: 'sign-in', loadChildren: () => import('src/app/modules/auth/sign-in/sign-in.module').then(m => m.SignInModule) }
        ]
    },

];

@NgModule({
    imports: [RouterModule.forRoot(routes, routerConfig)],
    exports: [RouterModule]
})
export class AppRoutingModule { }
