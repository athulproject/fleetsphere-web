import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Validate authentication against in-memory state or server HttpOnly cookie
  return authService.ensureAuthenticated().pipe(
    map((isAuthenticated) => {
      if (!isAuthenticated) {
        router.navigate(['/']);
        return false;
      }

      const roleParam = route.paramMap.get('role');
      if (roleParam) {
        const userRoles = authService.roles().map((r) => r.toLowerCase());
        const primary = authService.primaryRole().toLowerCase();

        const hasRole = userRoles.includes(roleParam.toLowerCase());
        if (!hasRole && roleParam.toLowerCase() !== primary) {
          const correctedUrl = state.url.replace(`/${roleParam}`, `/${primary}`);
          router.navigateByUrl(correctedUrl);
          return false;
        }
      }

      return true;
    })
  );
};

