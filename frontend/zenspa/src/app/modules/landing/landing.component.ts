import { inject, Component, signal, computed, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { ServicioService } from '../../core/services/servicio.service';
import { CitaService } from '../../core/services/cita.service';
import type { Servicio } from '../../core/models';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
})
export class LandingComponent implements OnInit {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;
  private servicioService = inject(ServicioService);
  private citaService = inject(CitaService);

  menuAbierto = signal(false);
  email = signal('');
  suscribiendo = signal(false);
  suscripcionExito = signal('');
  suscripcionError = signal('');
  serviciosLanding = signal<Servicio[]>([]);
  private reporteIds = signal<number[]>([]);

  top5 = computed(() => {
    const servicios = this.serviciosLanding();
    const ids = this.reporteIds();
    if (ids.length) return servicios.filter(s => ids.includes(s.id));
    return servicios.slice(0, 5);
  });

  readonly gradientes: Record<string, string> = {
    masajes: 'linear-gradient(135deg, #D9B48F, #C96A2B)',
    facial: 'linear-gradient(135deg, #F0D9C8, #D9A87A)',
    hidroterapia: 'linear-gradient(135deg, #C8D9F0, #7A9FD9)',
    aromaterapia: 'linear-gradient(135deg, #D4C8F0, #9A7AD9)',
    multiple: 'linear-gradient(135deg, #C8F0D4, #7AD99A)',
  };

  gradiente(tipo: string): string {
    return this.gradientes[tipo.toLowerCase()] || 'linear-gradient(135deg, #D9B48F, #C96A2B)';
  }

  ngOnInit() {
    this.servicioService.getAll().subscribe({
      next: (data) => this.serviciosLanding.set(data),
    });
    this.citaService.getReporteServicios().subscribe({
      next: (reporte) => {
        if (reporte.length) {
          this.reporteIds.set(reporte.slice(0, 5).map(r => r.servicio_id));
        }
      },
    });
  }

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
