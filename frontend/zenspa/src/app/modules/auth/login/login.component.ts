import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });
  loading = false;
  error = '';
  registroExitoso = signal(false);
  redirectMsg = signal('');
  mostrarPassword = signal(false);

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['registro'] === 'exitoso') {
        this.registroExitoso.set(true);
      }
      if (params['redirect'] === 'servicios') {
        this.redirectMsg.set('Inicia sesión para ver los servicios disponibles');
        setTimeout(() => this.redirectMsg.set(''), 6000);
      }
    });
  }

  togglePassword(): void {
    this.mostrarPassword.update((v) => !v);
  }

  prevenirDefault(e: Event): void {
    e.preventDefault();
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';

    const { email, password } = this.form.getRawValue();
    this.authService.login(email, password).subscribe({
      next: () => (this.loading = false),
      error: (err) => {
        this.loading = false;
        this.error =
          err instanceof HttpErrorResponse && err.status === 401
            ? 'Credenciales incorrectas'
            : 'Error de conexión con el servidor';
      },
    });
  }
}