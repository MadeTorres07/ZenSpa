import { inject, Component, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
})
export class LandingComponent {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  menuAbierto = signal(false);
  email = signal('');
  suscribiendo = signal(false);
  suscripcionExito = signal('');
  suscripcionError = signal('');

  toggleMenu(): void {
    this.menuAbierto.update(v => !v);
  }

  scrollTo(id: string): void {
    this.menuAbierto.set(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  suscribir(): void {
    const email = this.email().trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.suscripcionError.set('Ingresa un correo electrónico válido');
      return;
    }

    this.suscripcionError.set('');
    this.suscripcionExito.set('');
    this.suscribiendo.set(true);

    this.http.post<{ detail: string }>(`${this.apiUrl}/newsletter/suscribir`, { email }).subscribe({
      next: (res) => {
        this.suscripcionExito.set(res.detail);
        this.email.set('');
        this.suscribiendo.set(false);
      },
      error: (err) => {
        this.suscripcionError.set(err.error?.detail || 'Error al suscribirte. Intenta de nuevo.');
        this.suscribiendo.set(false);
      },
    });
  }
}
