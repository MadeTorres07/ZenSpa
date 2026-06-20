import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ServicioService } from '../../core/services/servicio.service';
import { CabinaService } from '../../core/services/cabina.service';
import { CitaService } from '../../core/services/cita.service';
import type { Servicio, Cabina, ReporteServicio } from '../../core/models';

@Component({
  selector: 'app-servicios',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './servicios.component.html',
  styleUrl: './servicios.component.scss',
})
export class ServiciosComponent implements OnInit {
  private servicioService = inject(ServicioService);
  private cabinaService = inject(CabinaService);
  private citaService = inject(CitaService);

  readonly currency = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });
  readonly gradientes: Record<string, string> = {
    masajes: 'linear-gradient(135deg, #D9B48F, #C96A2B)',
    facial: 'linear-gradient(135deg, #F0D9C8, #D9A87A)',
    hidroterapia: 'linear-gradient(135deg, #C8D9F0, #7A9FD9)',
    aromaterapia: 'linear-gradient(135deg, #D4C8F0, #9A7AD9)',
  };

  servicios = signal<Servicio[]>([]);
  cabinas = signal<Cabina[]>([]);
  reporte = signal<ReporteServicio[]>([]);
  cargando = signal(true);
  searchTerm = signal('');
  servicioSeleccionado = signal<Servicio | null>(null);
  tabActivo = signal<'info' | 'disponibilidad'>('info');
  modalEliminar = signal<Servicio | null>(null);

  filtered = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.servicios();
    return this.servicios().filter(s =>
      s.nombre.toLowerCase().includes(term) ||
      s.tipo_terapia.toLowerCase().includes(term)
    );
  });

  // KPIs
  total = computed(() => this.servicios().length);
  duracionPromedio = computed(() => {
    const list = this.servicios();
    return list.length ? Math.round(list.reduce((s, s2) => s + s2.duracion_minutos, 0) / list.length) : 0;
  });
  precioPromedio = computed(() => {
    const list = this.servicios();
    return list.length ? list.reduce((s, s2) => s + s2.precio, 0) / list.length : 0;
  });
  masReservado = computed(() => this.reporte().length ? this.reporte()[0].nombre : '—');

  gradiente(tipo: string): string {
    return this.gradientes[tipo.toLowerCase()] || 'linear-gradient(135deg, #D9B48F, #C96A2B)';
  }

  cabinasCompatibles(servicio: Servicio): Cabina[] {
    return this.cabinas().filter(c =>
      c.tipo_tratamiento === 'multiple' ||
      c.tipo_tratamiento === servicio.tipo_terapia
    );
  }

  ngOnInit() {
    this.servicioService.getAll().subscribe({
      next: (data) => { this.servicios.set(data); this.cargando.set(false); },
      error: () => this.cargando.set(false),
    });
    this.cabinaService.getAll().subscribe({
      next: (data) => this.cabinas.set(data),
      error: () => this.cabinas.set([]),
    });
    this.citaService.getReporteServicios().subscribe({
      next: (data) => this.reporte.set(data),
      error: () => this.reporte.set([]),
    });
  }

  seleccionar(s: Servicio) { this.servicioSeleccionado.set(s); this.tabActivo.set('info'); }
  cerrarPanel() { this.servicioSeleccionado.set(null); }

  confirmarEliminar(s: Servicio) { this.modalEliminar.set(s); }
  cerrarModal() { this.modalEliminar.set(null); }

  eliminar() {
    const s = this.modalEliminar();
    if (!s) return;
    this.servicioService.delete(s.id).subscribe({
      next: () => {
        this.servicios.update(list => list.filter(x => x.id !== s.id));
        if (this.servicioSeleccionado()?.id === s.id) this.cerrarPanel();
        this.cerrarModal();
      },
      error: () => this.cerrarModal(),
    });
  }
}
