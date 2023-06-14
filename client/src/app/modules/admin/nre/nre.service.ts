import { Injectable } from '@angular/core';
import { AppService } from 'app/core/services/app.service';
import { BehaviorSubject, Observable, tap } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class NreService {

    private _customers: BehaviorSubject<any[] | null> = new BehaviorSubject(null);

    constructor(private _appService: AppService) { }

    get customers$(): Observable<any[]> {
        return this._customers.asObservable();
    }

    getCustomers(): Observable<any> {
        return this._appService.get('customer').pipe(
            tap((response: any) => {
                this._customers.next(response);
            })
        );
    }    
}
