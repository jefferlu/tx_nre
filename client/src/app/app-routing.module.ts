import { NgModule } from '@angular/core';
import { ExtraOptions, PreloadAllModules, RouterModule, Routes } from '@angular/router';

import { authGuard } from './core/auth/guards/auth.guard';
import { LayoutComponent } from './layout/layout.component';
import { nreResolver } from './modules/admin/nre/nre.resolver';
import { settingsResolver } from './modules/admin/settings/settings.resolver';

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
        component: LayoutComponent,
        data: {
            layout: 'empty'
        },
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
            { path: 'nre', resolve: { data: nreResolver }, loadChildren: () => import('app/modules/admin/nre/nre.module').then(m => m.NreModule) },
            // Profile
            { path: 'profile', loadChildren: () => import('app/modules/admin/profile/profile.module').then(m => m.ProfileModule) },

            // Settings
            { path: 'settings', resolve: { data: settingsResolver }, loadChildren: () => import('app/modules/admin/settings/settings.module').then(m => m.SettingsModule) },

            // 404 & Catch all
            { path: '404', pathMatch: 'full', loadChildren: () => import('app/modules/auth/error-404/error-404.module').then(m => m.Error404Module) },
            { path: '**', redirectTo: '404' }
        ]
    },


];

@NgModule({
    imports: [RouterModule.forRoot(routes, routerConfig)],
    exports: [RouterModule]
})
export class AppRoutingModule { }
