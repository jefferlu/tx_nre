import { NgModule } from '@angular/core';
import { ExtraOptions, PreloadAllModules, RouterModule, Routes } from '@angular/router';

import { LayoutComponent } from './layout/layout/layout.component';
import { authGuard } from './core/auth/guards/auth.guard';

const routerConfig: ExtraOptions = {
    preloadingStrategy: PreloadAllModules,
    scrollPositionRestoration: 'enabled'
};

const routes: Routes = [
    { path: '', pathMatch: 'full', redirectTo: 'nre' },
    { path: 'signed-in-redirect', pathMatch: 'full', redirectTo: 'nre' },

    // Auth routes for guests
    {
        path: '',
        children: [
            { path: 'sign-in', loadChildren: () => import('app/modules/auth/sign-in/sign-in.module').then(m => m.SignInModule) }
        ]
    },

    // Admin routes
    {
        path: '',
        canMatch: [authGuard],
        component: LayoutComponent,
        children: [
            { path: 'nre', loadChildren: () => import('app/modules/admin/nre/nre.module').then(m => m.NreModule) }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forRoot(routes, routerConfig)],
    exports: [RouterModule]
})
export class AppRoutingModule { }
