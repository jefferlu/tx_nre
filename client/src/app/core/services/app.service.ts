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

    get(method, slug?): Observable<any> {

        let url = slug ? `${endpoint}/${method}/${slug}` : `${endpoint}/${method}`;

        return this._httpClient.get(url).pipe(
            switchMap((response: any) => {
                return of(response);
            }),
            // catchError((e) => {

            //     console.log(e.error.detail ? e.error.detail : e.message)
            //     const dialogRef = this._fuseConfirmationService.open({
            //         // title: e.statusText,
            //         title: `API Error: get()`,
            //         message: e.error.detail ? e.error.detail : e.message,
            //         actions: { cancel: { show: false } }
            //     });

            //     // Return false
            //     return of(false)
            // })
        );
    }

    post(method: string, request: any): Observable<any> {

        return this._httpClient.post(`${endpoint}/${method}`, request).pipe(
            switchMap((response: any) => {
                return of(response);
            }),
            catchError((e) => {
                console.log(e)
                console.log(e.error.detail ? e.error.detail : e.message)
                const dialogRef = this._fuseConfirmationService.open({
                    // title: e.statusText,
                    title: `API Error: post()`,
                    message: e.error.detail ? e.error.detail : e.message,
                    actions: { cancel: { show: false } }
                });

                // Return false
                return of(false)
            })
        );
    }

    put(method: string, slug: string, request: any): Observable<any> {

        return this._httpClient.put(`${endpoint}/${method}/${slug}`, request).pipe(
            switchMap((response: any) => {
                return of(response);
            }),
            catchError((e) => {
                console.log(e)
                console.log(e.error.detail ? e.error.detail : e.message)
                const dialogRef = this._fuseConfirmationService.open({
                    // title: e.statusText,
                    title: `API put() Error: ${method} `,
                    message: e.error.detail ? e.error.detail : e.message,
                    actions: { cancel: { show: false } }
                });

                // Return false
                return of(false)
            })
        );
    }

}
