import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard = (route: any) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const allowedRoles: string[] = route?.data?.['roles'] || [];

  if (auth.hasRole(...allowedRoles)) {
    return true;
  }

  return router.parseUrl('/sin-permiso');
};
