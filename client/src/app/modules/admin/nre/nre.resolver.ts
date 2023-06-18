import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { NreService } from './nre.service';

export const nreResolver: ResolveFn<boolean> = (route, state) => {    
    return inject(NreService).getCustomers();
};
