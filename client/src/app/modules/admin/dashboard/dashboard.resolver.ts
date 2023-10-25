import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { forkJoin } from 'rxjs';
import { DashboardService } from './dashboard.service';

export const dashboardResolver: ResolveFn<any> = (route, state) => {
    return forkJoin([
        inject(DashboardService).getProjects(),
        inject(DashboardService).getData()
    ]);
};
