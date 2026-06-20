import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
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
  success = signal(false);
  loading = signal(false);
  mostrarPassword = signal(false);
  mostrarConfirmacion = signal(false);

  form = this.fb.nonNullable.group({
    nombre: ['', [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(100),
      Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/),
    ]],
    apellido: ['', [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(100),
      Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/),
    ]],
    email: ['', [Validators.required, Validators.email]],
    telefono: ['', [Validators.pattern(/^[\d\s\+\-\(\)]{7,20}$/)]],
    rol: ['', Validators.required],
    activo: [true],
    password: ['', [
      Validators.required,
      Validators.minLength(8),
      Validators.pattern(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).+$/),
    ]],
    confirmarPassword: ['', Validators.required],
  }, { validators: this.passwordsMatch });

  private passwordsMatch(g: AbstractControl): ValidationErrors | null {
    const p = g.get('password')?.value;
    const c = g.get('confirmarPassword')?.value;
    return p === c ? null : { noCoinciden: true };
  }

  campo(t: string) { return this.form.get(t)!; }
  togglePassword() { this.mostrarPassword.update(v => !v); }
  toggleConfirmacion() { this.mostrarConfirmacion.update(v => !v); }

  get passwordErrors() {
    const ctrl = this.campo('password');
    if (!ctrl.dirty && !ctrl.touched) return null;
    return {
      length: ctrl.value.length >= 8,
      mayuscula: /[A-Z]/.test(ctrl.value),
      numero: /\d/.test(ctrl.value),
      especial: /[!@#$%^&*(),.?":{}|<>]/.test(ctrl.value),
    };
  }

  mensajeError(campo: string): string {
    const c = this.campo(campo);
    if (!c.errors || (!c.dirty && !c.touched)) return '';
    if (c.errors['required']) return 'Este campo es obligatorio';
    if (c.errors['pattern']) {
      if (campo === 'nombre' || campo === 'apellido') return 'Solo se permiten letras y espacios';
      if (campo === 'telefono') return 'Formato de teléfono inválido';
      if (campo === 'password') return 'Debe contener mayúscula, número y carácter especial';
    }
    if (c.errors['minlength']) return `Mínimo ${c.errors['minlength'].requiredLength} caracteres`;
    if (c.errors['maxlength']) return `Máximo ${c.errors['maxlength'].requiredLength} caracteres`;
    if (c.errors['email']) return 'Correo electrónico inválido';
    return 'Campo inválido';
  }

  cancelar() {
    this.location.back();
  }

  onSubmit() {
    if (this.form.invalid) {
      Object.keys(this.form.controls).forEach(k => this.campo(k).markAsTouched());
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.success.set(false);

    const data = {
      nombre: (this.form.value.nombre ?? '').trim(),
      apellido: (this.form.value.apellido ?? '').trim(),
      email: (this.form.value.email ?? '').trim(),
      password: this.form.value.password,
      rol: this.form.value.rol,
      activo: this.form.value.activo,
    };

    this.usuarioService.create(data).subscribe({
      next: () => {
        this.success.set(true);
        this.loading.set(false);
        setTimeout(() => this.router.navigate(['/dashboard']), 1500);
      },
      error: (err) => {
        this.loading.set(false);
        if (err.status === 400) {
          const msg = err.error?.detail || 'Error al crear el usuario';
          this.error.set(msg.toLowerCase().includes('email') ? 'Este correo ya está registrado' : msg);
        } else if (err.status === 422 && err.error?.detail) {
          const msg = err.error.detail[0]?.msg?.replace('Value error, ', '') || 'Datos inválidos';
          this.error.set(msg);
        } else {
          this.error.set('Error del servidor. Intenta de nuevo.');
        }
      },
    });
  }
}
