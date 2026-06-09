import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { tap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();
  const isApiRequest = req.url.startsWith(environment.apiUrl);

  let cloned = req;
  if (token && isApiRequest) {
    cloned = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`),
    });
  }

  return next(cloned).pipe(
    tap({
      error: (err) => {
        if (err.status === 401 && isApiRequest) {
          authService.logout();
        }
      },
    }),
  );
};
