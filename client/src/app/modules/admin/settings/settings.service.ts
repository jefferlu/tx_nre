import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, concat, of, switchMap, tap } from 'rxjs';

import { AppService } from 'app/core/services/app.service';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { AuthService } from 'app/core/auth/auth.service';
import { Router } from '@angular/router';

@Injectable({
    providedIn: 'root'
})
export class SettingsService {

    private _users: BehaviorSubject<any[] | null> = new BehaviorSubject(null);
    private _customers: BehaviorSubject<any[] | null> = new BehaviorSubject(null);
    private _items: BehaviorSubject<any[] | null> = new BehaviorSubject(null);

    constructor(
        private _router: Router,
        private _fuseConfirmationService: FuseConfirmationService,
        private _authService: AuthService,
        private _appService: AppService
    ) { }

    get users$(): Observable<any[]> {
        return this._users.asObservable();
    }

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

    getUsers(): Observable<any> {
        return this._appService.get('users').pipe(
            tap((response: any) => {
                this._users.next(response);
            }),
            catchError((e) => {
                console.log(e)
                console.log(e.error.detail ? e.error.detail : e.message)
                const dialogRef = this._fuseConfirmationService.open({
                    // title: e.statusText,
                    title: `Alert`,
                    message: e.error.detail ? e.error.detail : e.message,
                    actions: { cancel: { show: false } }
                });
                
                dialogRef.afterClosed().subscribe(result => {
                    if (result === 'confirmed' && e.status === 403) {
                        this._authService.signOut();
                        this._router.navigate(['/sign-in']);
                    }
                });

                // Return false
                return of(false)
            })
        );
    }

    createUser(request: any): Observable<any> {
        return this._appService.post('users', request).pipe(
            tap((response: any) => {
                this.getUsers().subscribe();
            })
        )
    }

    updateUser(request: any): Observable<any> {

        return this._appService.put(`users/${request.id}`, null, request).pipe(
            tap((response: any) => {
                this.getUsers().subscribe();
            })
        )
    }

    deleteUser(pk: number): Observable<any> {
        return this._appService.delete('users', pk).pipe(
            tap((response: any) => {
                this.getUsers().subscribe();
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
