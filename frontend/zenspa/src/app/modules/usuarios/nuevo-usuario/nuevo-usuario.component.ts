import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsuarioService } from '../../../core/services/usuario.service';

@Component({
  selector: 'app-nuevo-usuario',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './nuevo-usuario.component.html',
  styleUrl: './nuevo-usuario.component.scss',
})
export class NuevoUsuarioComponent {
  private fb = inject(FormBuilder);
  private usuarioService = inject(UsuarioService);
  private router = inject(Router);
  private location = inject(Location);

  error = signal('');
  loading = signal(false);
  mostrarPassword = signal(false);
  mostrarConfirmacion = signal(false);

  form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    apellido: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    telefono: [''],
    rol: ['', Validators.required],
    activo: [true],
    password: ['', [
      Validators.required,
      Validators.minLength(8),
      Validators.pattern(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).+$/),
    ]],
    confirmarPassword: ['', Validators.required],
  }, { validators: this.passwordsMatch });

  private passwordsMatch(g: any) {
    const p = g.get('password')?.value;
    const c = g.get('confirmarPassword')?.value;
    return p === c ? null : { noCoinciden: true };
  }

  togglePassword() { this.mostrarPassword.update(v => !v); }
  toggleConfirmacion() { this.mostrarConfirmacion.update(v => !v); }

  get passwordErrors() {
    const ctrl = this.form.get('password');
    if (!ctrl || !ctrl.dirty) return null;
    return {
      length: ctrl.value.length >= 8,
      mayuscula: /[A-Z]/.test(ctrl.value),
      numero: /\d/.test(ctrl.value),
      especial: /[!@#$%^&*(),.?":{}|<>]/.test(ctrl.value),
    };
  }

  cancelar() {
    this.location.back();
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');

    const data = {
      nombre: this.form.value.nombre,
      apellido: this.form.value.apellido,
      email: this.form.value.email,
      password: this.form.value.password,
      rol: this.form.value.rol,
      activo: this.form.value.activo,
    };

    this.usuarioService.create(data).subscribe({
      next: () => {
        this.router.navigate(['/usuarios']);
      },
      error: (err) => {
        this.loading.set(false);
        if (err.status === 400) {
          this.error.set(err.error?.detail || 'Error al crear el usuario');
        } else {
          this.error.set('Error del servidor. Intenta de nuevo.');
        }
      },
    });
  }
}
