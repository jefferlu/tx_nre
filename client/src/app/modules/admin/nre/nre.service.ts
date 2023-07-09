import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap, switchMap, of } from 'rxjs';

import { AppService } from 'app/core/services/app.service';

@Injectable({
    providedIn: 'root'
})
export class NreService {

    private _customers: BehaviorSubject<any[] | null> = new BehaviorSubject(null);
    private _page: any;

    constructor(private _appService: AppService) { }

    get customers$(): Observable<any[]> {
        return this._customers.asObservable();
    }

    set page(data: any) {
        this._page = data;
    }

    get page() {
        return this._page;
    }

    getCustomers(): Observable<any> {
        return this._appService.get('customers').pipe(
            tap((response: any) => {
                this._customers.next(response);
            })
        );
    }

    getProject(name: string, kwargs?: any): Observable<any> {
        return this._appService.get(`projects/${name}`, kwargs).pipe(
            switchMap((response: any) => {
                return of(response);
            })
        );
    }

    createProject(request: any): Observable<any> {
        return this._appService.post('projects', request).pipe(
            switchMap((response: any) => {
                return of(response);
            })
        );
    }

    updateProject(name: string, kwargs: any, request: any): Observable<any> {
        return this._appService.put(`projects/${name}`, kwargs, request).pipe(
            switchMap((response: any) => {
                return of(response);
            })
        );
    }
}
