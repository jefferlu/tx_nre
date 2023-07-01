import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { NreService } from './nre.service';
import { Observable, forkJoin } from 'rxjs';

export const nreResolver: ResolveFn<any> = (route, state) => {

    return forkJoin([
        inject(NreService).getChoices(),
        inject(NreService).getCustomers()
    ]);
};
