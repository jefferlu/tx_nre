import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, switchMap, tap } from 'rxjs';

import { AppService } from 'app/core/services/app.service';

@Injectable({
    providedIn: 'root'
})
export class SettingsService {

    private _items: BehaviorSubject<any[] | null> = new BehaviorSubject(null);

    constructor(private _appService: AppService) { }

    get items$(): Observable<any[]> {
        return this._items.asObservable();
    }

    getItems(): Observable<any> {
        return this._appService.get('items').pipe(
            tap((response: any) => {
                this._items.next(response);
            })
        );
    }

    saveItems(request: any): Observable<any> {
        return this._appService.post('items', request).pipe(
            switchMap((response: any) => {
                return of(response);
            })
        );
    }
}
