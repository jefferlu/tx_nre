import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, of, switchMap } from 'rxjs';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { environment } from 'environments/environment';


const endpoint = environment.apiUrl;

@Injectable({
    providedIn: 'root'
})
export class AppService {

    constructor(
        private _httpClient: HttpClient,
        private _fuseConfirmationService: FuseConfirmationService
    ) { }

    get(url): Observable<any> {
        return this._httpClient.get(`${endpoint}/${url}`).pipe(
            switchMap((response: any) => {
                return of(response);
            }),
            catchError((e) => {
                console.log(e)
                console.log(e.error.detail ? e.error.detail : e.message)
                const dialogRef = this._fuseConfirmationService.open({
                    // title: e.statusText,
                    title: `API Error: execute_kw()`,
                    message: e.error.detail ? e.error.detail : e.message,
                    actions: { cancel: { show: false } }
                });

                // Return false

                return of(false)
            })
        );
    }



}
