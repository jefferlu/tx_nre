import { Injectable } from '@angular/core';
import { AppService } from 'app/core/services/app.service';
import { BehaviorSubject, Observable, tap, switchMap, of } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class NreService {

    private _customers: BehaviorSubject<any[] | null> = new BehaviorSubject(null);
    private _project: any;

    constructor(private _appService: AppService) { }

    get customers$(): Observable<any[]> {
        return this._customers.asObservable();
    }


    set project(data: any) {
        this._project = data;
    }

    get project() {
        return this._project;
    }

    getCustomers(): Observable<any> {
        return this._appService.get('customer').pipe(
            tap((response: any) => {
                this._customers.next(response);
            })
        );
    }

    getProject(name: string): Observable<any> {
        return this._appService.get('project', name).pipe(
            switchMap((response: any) => {
                return of(response);
            })
        );
    }

    createProject(request: any): Observable<any> {
        return this._appService.post('project', request).pipe(
            switchMap((response: any) => {
                return of(response);
            })
        );
    }

    updateProject(slug: string, request: any): Observable<any> {
        return this._appService.put('project', slug, request).pipe(
            switchMap((response: any) => {
                return of(response);
            })
        );
    }
}
