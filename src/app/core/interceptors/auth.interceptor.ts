import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  let authReq = req;

  // Attach Bearer token if token is available
  if (token && !req.headers.has('Authorization')) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(authReq).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        // If 401 Unauthorized occurs on an authenticated route, clear session and redirect
        if (!req.url.includes('/auth/login')) {
          console.warn('[authInterceptor] Unauthorized 401 detected, logging out...');
          authService.logout();
        }
      }
      return throwError(() => error);
    })
  );
};
