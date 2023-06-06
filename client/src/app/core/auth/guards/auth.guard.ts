import { inject } from '@angular/core';
import { CanMatchFn, Router, UrlSegment, UrlTree } from '@angular/router';

import { Observable, of, switchMap } from 'rxjs';
import { AuthService } from '../auth.service';


const _check = (segments: UrlSegment[]): Observable<boolean | UrlTree> => {
    
    const _authService = (inject(AuthService))
    const _router = inject(Router)

    return _authService.check().pipe(
        switchMap((authenticated) => {

            // If the user is not authenticated...
            if (!authenticated) {
                // Redirect to the sign-in page with a redirectUrl param
                const redirectURL = `/${segments.join('/')}`;
                const urlTree = _router.parseUrl(`sign-in?redirectURL=${redirectURL}`);

                return of(urlTree);
            }

            // Allow the access
            return of(true);
        })
    );

}

export const authGuard: CanMatchFn = (route, segments) => {
    return _check(segments);
};

