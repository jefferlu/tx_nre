import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, switchMap, tap } from 'rxjs';

import { AppService } from 'app/core/services/app.service';

@Injectable({
    providedIn: 'root'
})
export class SettingsService {

    private _customers: BehaviorSubject<any[] | null> = new BehaviorSubject(null);
    private _items: BehaviorSubject<any[] | null> = new BehaviorSubject(null);

    constructor(private _appService: AppService) { }

    get customers$(): Observable<any[]> {
        return this._customers.asObservable();
    }

    set customers(values: any[]) {
        this._customers.next(values);
    }

    get items$(): Observable<any[]> {
        return this._items.asObservable();
    }

    set items(values: any[]) {
        this._items.next(values);
    }

    getCustomers(): Observable<any> {
        return this._appService.get('customers').pipe(
            tap((response: any) => {
                this._customers.next(response);
            })
        );
    }

    saveCustomers(request: any): Observable<any> {
        return this._appService.post('customers', request).pipe(
            switchMap((response: any) => {
                return of(response);
            })
        );
    }

    getItems(): Observable<any> {
        return this._appService.get('items').pipe(
            tap((response: any) => {
                this._items.next(response);
            })
        );
    }

    queryItems(slug: any): Observable<any> {
        return this._appService.get('items', slug).pipe(
            switchMap((response: any) => {
                return of(response);
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
