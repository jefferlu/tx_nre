import { Injectable } from '@angular/core';
import {
    HttpRequest,
    HttpHandler,
    HttpEvent,
    HttpInterceptor,
    HttpErrorResponse
} from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { CookieService } from 'ngx-cookie-service';
import { AuthService } from './auth.service';
import { AuthUtils } from './auth.utils';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

    constructor(
        private _cookieService: CookieService,
        private _authService: AuthService) {
    }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        let newReq = req.clone();
        if (this._cookieService.get('access') && !AuthUtils.isTokenExpired(this._cookieService.get('access'))) {

            newReq = req.clone({
                headers: req.headers.set('Authorization', `Bearer ${this._cookieService.get('access')}`)
            });
        }
        
        return next.handle(newReq).pipe(
            catchError((error) => {

                // Catch "401 Unauthorized" responses
                if (error instanceof HttpErrorResponse && error.status === 401) {
                    // Sign out
                    this._authService.signOut();

                    // Reload the app
                    if (!error.url.includes('api/login')) {
                        location.reload();
                    }
                }

                // return throwError(() => new Error(error));
                return throwError(() => error)  // Detail error message
            })
        );
    }
}
