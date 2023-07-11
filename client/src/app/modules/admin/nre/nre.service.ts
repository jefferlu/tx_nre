import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap, switchMap, of } from 'rxjs';

import { AppService } from 'app/core/services/app.service';

@Injectable({
    providedIn: 'root'
})
export class NreService {

    private _projects: BehaviorSubject<any[] | null> = new BehaviorSubject(null);
    private _customers: BehaviorSubject<any[] | null> = new BehaviorSubject(null);
    private _versions: BehaviorSubject<any[] | null> = new BehaviorSubject(null);
    private _page: any;

    constructor(private _appService: AppService) { }

    get projects$(): Observable<any[]> {
        return this._projects.asObservable();
    }

    get versions$(): Observable<any[]> {
        return this._versions.asObservable();
    }

    get customers$(): Observable<any[]> {
        return this._customers.asObservable();
    }

    set page(data: any) {
        this._page = data;
    }

    get page() {
        return this._page;
    }

    getProjects(slug?: any): Observable<any> {
        console.log('getProjects')
        return this._appService.get('projects', slug).pipe(
            tap((response: any) => {
                this._projects.next(response);
            })
        );
    }

    getVersions(slug?: any): Observable<any> {

        return this._appService.get('project-versions', slug).pipe(
            tap((response: any) => {
                this._versions.next(response);
            })
        );
    }

    getCustomers(): Observable<any> {
        return this._appService.get('customers').pipe(
            tap((response: any) => {
                this._customers.next(response);
            })
        );
    }

    getProject(name: string, kwargs?: any): Observable<any> {
        return this._appService.get(`project/${name}`, kwargs).pipe(
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

    updateProject(name: string, kwargs: any, request: any): Observable<any> {
        return this._appService.put(`project/${name}`, kwargs, request).pipe(
            switchMap((response: any) => {
                return of(response);
            })
        );
    }
}
