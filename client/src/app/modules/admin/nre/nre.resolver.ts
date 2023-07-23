import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { forkJoin } from 'rxjs';

import { NreService } from './nre.service';

export const nreResolver: ResolveFn<any> = (route, state) => {
    return forkJoin([
        inject(NreService).getChambers(),
        inject(NreService).getCustomers()
    ]);
};
