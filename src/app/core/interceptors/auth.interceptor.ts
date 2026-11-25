import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // Always enable withCredentials so the browser automatically transmits
  // and receives secure HttpOnly cookies across origins (e.g. localhost:4200 -> localhost:5000)
  let authReq = req.clone({
    withCredentials: true,
    ...(token && !req.headers.has('Authorization')
      ? { setHeaders: { Authorization: `Bearer ${token}` } }
      : {}),
  });

  return next(authReq).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        // If 401 Unauthorized occurs on an authenticated route, clear session and redirect
        if (!req.url.includes('/auth/login') && !req.url.includes('/auth/me')) {
          console.warn('[authInterceptor] Unauthorized 401 detected, logging out...');
          authService.logout();
        }
      }
      return throwError(() => error);
    })
  );
};
