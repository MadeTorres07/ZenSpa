import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-sin-permiso',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="error-page">
      <h1>Sin permiso</h1>
      <p>No tienes acceso a esta sección.</p>
      <a routerLink="/dashboard">Volver al inicio</a>
    </div>
  `,
  styles: [`
    .error-page { text-align: center; padding: 4rem 2rem; }
    h1 { font-family: var(--font-heading); font-size: 2rem; margin-bottom: 1rem; }
    a { color: var(--color-primary); text-decoration: none; font-weight: 600; }
    p { color: var(--color-text-secondary); margin-bottom: 1.5rem; }
  `],
})
export class SinPermisoComponent {}
