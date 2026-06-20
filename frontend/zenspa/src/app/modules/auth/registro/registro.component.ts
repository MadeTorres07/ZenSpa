import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.scss',
})
export class RegistroComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

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
    telefono: ['', []],
    password: ['', [
      Validators.required,
      Validators.minLength(8),
      Validators.pattern(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).+$/),
    ]],
    confirmarPassword: ['', [Validators.required]],
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
    if (c.errors['required']) {
      if (campo === 'telefono') return 'El número de teléfono es obligatorio';
      return 'Este campo es obligatorio';
    }
    if (c.errors['pattern']) {
      if (campo === 'nombre' || campo === 'apellido') return 'Solo se permiten letras y espacios';
      if (campo === 'password') return 'Debe contener mayúscula, número y carácter especial';
    }
    if (c.errors['minlength']) return `Mínimo ${c.errors['minlength'].requiredLength} caracteres`;
    if (c.errors['maxlength']) return `Máximo ${c.errors['maxlength'].requiredLength} caracteres`;
    if (c.errors['email']) return 'Correo electrónico inválido';
    return 'Campo inválido';
  }

  mensajeTelefono(): string {
    const c = this.campo('telefono');
    if (!c.dirty && !c.touched) return '';
    const val = c.value ?? '';
    if (val.length === 0) return '';
    if (/[a-zA-Z]/.test(val)) return 'Solo se permiten números';
    const soloNumeros = val.replace(/\D/g, '');
    if (soloNumeros.length > 0 && soloNumeros.length < 7) return 'El número telefónico debe tener al menos 7 dígitos';
    if (soloNumeros.length > 20) return 'El número telefónico no puede tener más de 20 dígitos';
    return '';
  }

  onSubmit() {
    if (this.form.invalid) {
      Object.keys(this.form.controls).forEach(k => this.campo(k).markAsTouched());
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.success.set(false);

    const raw = this.form.getRawValue();
    const data: any = {
      nombre: raw.nombre.trim(),
      apellido: raw.apellido.trim(),
      email: raw.email.trim(),
      password: raw.password,
    };
    const tel = raw.telefono?.trim();
    if (tel) data.telefono = tel;

    this.authService.registro(data).subscribe({
      next: () => {
        this.success.set(true);
        this.loading.set(false);
        setTimeout(() => {
          this.router.navigate(['/login'], { queryParams: { registro: 'exitoso' } });
        }, 1500);
      },
      error: (err) => {
        this.loading.set(false);
        if (err.status === 400 && err.error?.detail?.toLowerCase().includes('email')) {
          this.error.set('Este correo ya está registrado');
        } else if (err.status === 422 && err.error?.detail) {
          const msg = err.error.detail[0]?.msg?.replace('Value error, ', '') || 'Datos inválidos';
          this.error.set(msg);
        } else if (err.status === 401 || err.status === 403) {
          this.error.set('Error de autenticación. Intenta recargar la página.');
        } else {
          this.error.set('Error al registrar. Intenta de nuevo.');
        }
      },
    });
  }
}
