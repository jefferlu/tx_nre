import { Injectable } from '@angular/core';
import { AppService } from 'app/core/services/app.service';
import { BehaviorSubject, Observable, tap } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class DashboardService {

    private _data: BehaviorSubject<any[] | null> = new BehaviorSubject(null);

    constructor(private _appService: AppService) { }

    get data$(): Observable<any[]> {
        return this._data.asObservable();
    }

    getData(): Observable<any> {
        return this._appService.get('analytics').pipe(
            tap((response: any) => {
                this._data.next(response);
            })
        );
    }
}
