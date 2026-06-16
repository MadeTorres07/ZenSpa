import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });
  loading = false;
  error = '';
  mostrarPassword = signal(false);

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