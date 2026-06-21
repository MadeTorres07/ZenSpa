import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CitaService } from '../../core/services/cita.service';
import { CabinaService } from '../../core/services/cabina.service';
import { TerapeutaService } from '../../core/services/terapeuta.service';
import { ProductoService } from '../../core/services/producto.service';
import { UsuarioService } from '../../core/services/usuario.service';
import type { Cita, Terapeuta, Cabina, Producto, ReporteServicio, Usuario } from '../../core/models';

interface DiaSemana {
  label: string;
  numero: number;
  hoy: boolean;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private citaService = inject(CitaService);
  private cabinaService = inject(CabinaService);
  private terapeutaService = inject(TerapeutaService);
  private productoService = inject(ProductoService);
  private usuarioService = inject(UsuarioService);

  readonly hoy = new Date();
  readonly hoyStr = this.hoy.toISOString().split('T')[0];
  readonly fechaFormateada = new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(this.hoy);

  get nombre(): string {
    return this.authService.getSession()?.nombre ?? '';
  }

  get saludo(): string {
    const h = this.hoy.getHours();
    if (h < 12) return 'Buenos días';
    if (h < 18) return 'Buenas tardes';
    return 'Buenas noches';
  }

  readonly mesTexto = new Intl.DateTimeFormat('es-CO', {
    month: 'long',
    year: 'numeric',
  }).format(this.hoy).replace(/^\w/, c => c.toUpperCase());

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

  cargando = signal(true);

  citasHoy = signal<Cita[]>([]);
  proximasCitas = signal<Cita[]>([]);
  terapeutasActivos = signal<Terapeuta[]>([]);
  serviciosPopulares = signal<ReporteServicio[]>([]);
  productosBajoStock = signal<Producto[]>([]);
  cabinas = signal<Cabina[]>([]);
  usuarios = signal<Usuario[]>([]);

  ingresosHoy = computed(() => {
    const completadas = this.citasHoy().filter(c => c.estado === 'completada');
    return completadas.reduce((sum, c) => sum + (c.total ?? 0), 0);
  });

  completadasHoyCount = computed(() =>
    this.citasHoy().filter(c => c.estado === 'completada').length
  );

  ocupacion = computed(() => {
    const total = this.cabinas().length;
    if (total === 0) return 0;
    const idsOcupadas = new Set(
      this.citasHoy()
        .filter(c => !['cancelada', 'cancelada_penalidad'].includes(c.estado))
        .map(c => c.cabina_id)
    );
    return Math.round((idsOcupadas.size / total) * 100);
  });

  citasHoyCount = computed(() => this.citasHoy().length);

  pendientesHoy = computed(() =>
    this.citasHoy().filter(c => c.estado === 'pendiente').length
  );

  nuevosClientes = computed(() => {
    const hoyStr = this.hoyStr;
    return this.usuarios().filter(u => {
      if (!u.created_at) return false;
      return u.created_at.startsWith(hoyStr);
    }).length;
  });

  ngOnInit() {
    this.citaService.getCitasFiltradas({ fecha_inicio: this.hoyStr, fecha_fin: this.hoyStr })
      .subscribe({
        next: (data) => this.citasHoy.set(data),
        error: () => this.citasHoy.set([]),
      });

    this.citaService.getCitasFiltradas({ estado: 'confirmada', fecha_inicio: this.hoyStr })
      .subscribe({
        next: (data) => {
          this.citaService.getCitasFiltradas({ estado: 'pendiente', fecha_inicio: this.hoyStr })
            .subscribe({
              next: (pendientes) => {
                const todas = [...data, ...pendientes];
                todas.sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
                this.proximasCitas.set(todas.slice(0, 5));
              },
              error: () => this.proximasCitas.set(data.slice(0, 5)),
            });
        },
        error: () => this.proximasCitas.set([]),
      });

    this.terapeutaService.getAll().subscribe({
      next: (data) => this.terapeutasActivos.set(data.filter(t => t.activo)),
      error: () => this.terapeutasActivos.set([]),
    });

    this.cabinaService.getAll().subscribe({
      next: (data) => this.cabinas.set(data),
      error: () => this.cabinas.set([]),
    });

    this.productoService.getAll().subscribe({
      next: (data) => this.productosBajoStock.set(data.filter(p => p.stock <= p.stock_minimo)),
      error: () => this.productosBajoStock.set([]),
    });

    this.citaService.getReporteServicios().subscribe({
      next: (data) => this.serviciosPopulares.set(data.slice(0, 4)),
      error: () => this.serviciosPopulares.set([]),
    });

    this.usuarioService.getAll('cliente').subscribe({
      next: (data) => this.usuarios.set(data),
      error: () => this.usuarios.set([]),
    });

    setTimeout(() => this.cargando.set(false), 500);
  }

  getInitiales(nombre: string): string {
    const partes = nombre.trim().split(/\s+/);
    return partes.map(p => p[0]).join('').toUpperCase().slice(0, 2);
  }

  estadoTexto(estado: string): string {
    const mapa: Record<string, string> = {
      confirmada: 'Confirmada',
      pendiente: 'Pendiente',
      completada: 'Completada',
      cancelada: 'Cancelada',
      cancelada_penalidad: 'Cancelada',
    };
    return mapa[estado] ?? estado;
  }

  formatHora(hora: string): string {
    return hora.slice(0, 5);
  }

  formatFecha(fecha: string): string {
    const d = new Date(fecha + 'T12:00:00');
    return new Intl.DateTimeFormat('es-CO', { weekday: 'short', day: 'numeric', month: 'short' }).format(d);
  }

  servicioNombre(cita: Cita): string {
    if (!cita.servicios || cita.servicios.length === 0) return '—';
    return cita.servicios.map(s => s.nombre).join(', ');
  }

  esConfirmada(e: string): boolean { return e === 'confirmada' || e === 'completada'; }
  esPendiente(e: string): boolean { return e === 'pendiente'; }
  esCancelada(e: string): boolean { return e === 'cancelada' || e === 'cancelada_penalidad'; }
  esCompletada(e: string): boolean { return e === 'completada'; }

  pluralReservas(n: number): string { return n !== 1 ? 's' : ''; }
  pluralStock(n: number): string { return n !== 1 ? 'es' : ''; }
}
