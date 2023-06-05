import { CanMatchFn } from '@angular/router';
import { UrlSegment, UrlTree } from '@angular/router';
import { Observable, of, switchMap } from 'rxjs';

const _check = (segments: UrlSegment[]): Observable<boolean | UrlTree> => {
    return of(true);

}

export const ahthGuard: CanMatchFn = (route, segments) => {
    return _check(segments);
};

