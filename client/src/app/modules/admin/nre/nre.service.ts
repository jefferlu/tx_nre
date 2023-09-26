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
    private _chambers: BehaviorSubject<any[] | null> = new BehaviorSubject(null);

    private _query: any;
    private _page: any;


    constructor(private _appService: AppService) { }

    set page(data: any) {
        this._page = data;
    }

    get page() {
        return this._page;
    }

    set query(data: any) {
        this._query = data;
    }

    get query() {
        return this._query;
    }

    get projects$(): Observable<any[]> {
        return this._projects.asObservable();
    }

    get versions$(): Observable<any[]> {
        return this._versions.asObservable();
    }

    set versions(value: any) {
        this._versions.next(value);
    }

    get customers$(): Observable<any[]> {
        return this._customers.asObservable();
    }

    get chambers$(): Observable<any[]> {
        return this._chambers.asObservable();
    }

    getChambers(): Observable<any> {
        return this._appService.get('chambers').pipe(
            tap((response: any) => {
                this._chambers.next(response);
            })
        );
    }

    getProjects(slug?: any): Observable<any> {
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

    getProject(id: number, kwargs?: any): Observable<any> {
        return this._appService.get(`project/${id}`, kwargs).pipe(
            switchMap((response: any) => {
                return of(response);
            })
        );
    }

    // getProject(name: string, kwargs?: any): Observable<any> {
    //     return this._appService.get(`project/${name}`, kwargs).pipe(
    //         switchMap((response: any) => {
    //             return of(response);
    //         })
    //     );
    // }

    saveProject(request: any): Observable<any> {
        return this._appService.post('project', request).pipe(
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

    deleteProject(pk: number): Observable<any> {
        return this._appService.delete('project_delete', pk).pipe(
            tap((response: any) => {

            })
        );
    }
}
