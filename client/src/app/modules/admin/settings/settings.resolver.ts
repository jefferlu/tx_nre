import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { forkJoin } from 'rxjs';

import { SettingsService } from './settings.service';
import { NreService } from '../nre/nre.service';


export const settingsResolver: ResolveFn<any> = (route, state) => {
    return forkJoin([
        inject(SettingsService).getItems(),
        inject(NreService).getCustomers()
    ]);
};
