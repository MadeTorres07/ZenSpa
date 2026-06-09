import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = environment.apiUrl;

  login(email: string, password: string): Observable<AuthResponse> {
    const body = new URLSearchParams();
    body.set('grant_type', 'password');
    body.set('username', email);
    body.set('password', password);

    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, body.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }).pipe(
      tap((res) => {
        localStorage.setItem('zenspa_token', res.access_token);
        localStorage.setItem('zenspa_session', JSON.stringify({ rol: res.rol, nombre: res.nombre }));
        this.navigateByRole(res.rol);
      }),
    );
  }

  private navigateByRole(rol: string): void {
    const routes: Record<string, string> = {
      admin: '/dashboard',
      recepcionista: '/dashboard',
      terapeuta: '/agenda',
      cliente: '/mis-citas',
    };
    this.router.navigate([routes[rol] || '/dashboard']);
  }

  logout(): void {
    localStorage.removeItem('zenspa_token');
    localStorage.removeItem('zenspa_session');
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('zenspa_token');
  }

  getSession(): { rol: string; nombre: string } | null {
    const raw = localStorage.getItem('zenspa_session');
    return raw ? JSON.parse(raw) : null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  hasRole(...roles: string[]): boolean {
    const session = this.getSession();
    return session ? roles.includes(session.rol) : false;
  }
}
