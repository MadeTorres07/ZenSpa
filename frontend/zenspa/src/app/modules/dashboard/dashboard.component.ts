import { Component, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

interface CitaDia {
  hora: string;
  servicio: string;
  cliente: string;
  sala: string;
  estado: string;
}

interface KpiItem {
  label: string;
  valor: string;
  sub: string;
  icono: 'ingresos' | 'ocupacion' | 'citas' | 'clientes';
}

interface DiaSemana {
  label: string;
  numero: number;
  hoy: boolean;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  private authService = inject(AuthService);

  readonly hoy = new Date();
  readonly fechaFormateada = new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(this.hoy);

  get nombre(): string {
    return this.authService.getSession()?.nombre ?? '';
  }

  readonly saludo = 'Buenos días';

  readonly semana: DiaSemana[] = (() => {
    const inicio = new Date(this.hoy);
    const dia = inicio.getDay();
    const diff = inicio.getDate() - dia + (dia === 0 ? -6 : 1);
    inicio.setDate(diff);
    const labels = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];
    return labels.map((l, i) => {
      const d = new Date(inicio);
      d.setDate(inicio.getDate() + i);
      return {
        label: l,
        numero: d.getDate(),
        hoy: d.toDateString() === this.hoy.toDateString(),
      };
    });
  })();

  readonly citasHoy: CitaDia[] = [
    { hora: '09:00', servicio: 'Masaje Relajante', cliente: 'Pedro Fernández', sala: 'Sala Serenidad', estado: 'confirmada' },
    { hora: '11:30', servicio: 'Limpieza Facial Profunda', cliente: 'Sofía Ramírez', sala: 'Sala Armonía', estado: 'pendiente' },
    { hora: '14:00', servicio: 'Hidroterapia Corporal', cliente: 'Javier Torres', sala: 'Sala Aqua', estado: 'confirmada' },
    { hora: '16:00', servicio: 'Masaje Relajante', cliente: 'Pedro Fernández', sala: 'Sala Serenidad', estado: 'cancelada' },
  ];

  readonly kpis: KpiItem[] = [
    { label: 'Ingresos de hoy', valor: '$ 485,000', sub: '+12% vs ayer', icono: 'ingresos' },
    { label: 'Ocupación de cabinas', valor: '78%', sub: '3 / 4 ocupadas', icono: 'ocupacion' },
    { label: 'Citas de hoy', valor: '4', sub: '1 pendiente', icono: 'citas' },
    { label: 'Nuevos clientes', valor: '4', sub: '+2 vs ayer', icono: 'clientes' },
  ];

  estadoTexto(estado: string): string {
    const mapa: Record<string, string> = {
      confirmada: 'Confirmada',
      pendiente: 'Pendiente',
      cancelada: 'Cancelada',
    };
    return mapa[estado] ?? estado;
  }
}