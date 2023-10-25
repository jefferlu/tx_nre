import { Injectable } from '@angular/core';
import { AppService } from 'app/core/services/app.service';
import { BehaviorSubject, Observable, tap } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class DashboardService {

    private _projects: BehaviorSubject<any[] | null> = new BehaviorSubject(null);
    private _data: BehaviorSubject<any[] | null> = new BehaviorSubject(null);

    constructor(private _appService: AppService) { }

    get projects$(): Observable<any[]> {
        return this._projects.asObservable();
    }

    get data$(): Observable<any[]> {
        return this._data.asObservable();
    }

    getProjects(slug?: any): Observable<any> {
        return this._appService.get('projects', { 'type': 'analytics' }).pipe(
            tap((response: any) => {
                this._projects.next(response);
            })
        );
    }

    getData(): Observable<any> {
        return this._appService.get('analytics').pipe(
            tap((response: any) => {
                this._data.next(response);
            })
        );
    }
}
