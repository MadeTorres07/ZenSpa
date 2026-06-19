import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ClienteService } from '../../../core/services/cliente.service';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.scss',
})
export class RegistroComponent {
  private fb = inject(FormBuilder);
  private clienteService = inject(ClienteService);
  private router = inject(Router);

  error = signal('');
  loading = signal(false);
  mostrarPassword = signal(false);
  mostrarConfirmacion = signal(false);

  form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    apellido: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    telefono: ['', [Validators.pattern(/^[\d\s\+\-]{7,15}$/)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmarPassword: ['', [Validators.required]],
  }, { validators: this.passwordsMatch });

  private passwordsMatch(g: any) {
    const p = g.get('password')?.value;
    const c = g.get('confirmarPassword')?.value;
    return p === c ? null : { noCoinciden: true };
  }

  togglePassword() { this.mostrarPassword.update(v => !v); }
  toggleConfirmacion() { this.mostrarConfirmacion.update(v => !v); }

  onSubmit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');

    const data = {
      nombre: this.form.value.nombre,
      apellido: this.form.value.apellido,
      email: this.form.value.email,
      telefono: this.form.value.telefono || null,
      password: this.form.value.password,
    };

    this.clienteService.create(data).subscribe({
      next: () => {
        this.router.navigate(['/login'], {
          queryParams: { registro: 'exitoso' },
        });
      },
      error: (err) => {
        this.loading.set(false);
        if (err.status === 400 && err.error?.detail?.toLowerCase().includes('email')) {
          this.error.set('Este correo ya está registrado');
        } else {
          this.error.set('Error al registrar. Intenta de nuevo.');
        }
      },
    });
  }
}
