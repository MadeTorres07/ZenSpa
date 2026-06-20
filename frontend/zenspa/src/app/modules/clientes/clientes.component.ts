import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClienteService, ClienteResumen } from '../../core/services/cliente.service';
import { CitaService } from '../../core/services/cita.service';
import { AuthService } from '../../core/services/auth.service';
import type { Cliente, Cita } from '../../core/models';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './clientes.component.html',
  styleUrl: './clientes.component.scss',
})
export class ClientesComponent implements OnInit {
  private clienteService = inject(ClienteService);
  private citaService = inject(CitaService);
  private authService = inject(AuthService);

  readonly currency = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });

  clientes = signal<Cliente[]>([]);
  resumenes = signal<Record<number, ClienteResumen>>({});
  historialCitas = signal<Cita[]>([]);
  cargando = signal(true);
  searchTerm = signal('');
  clienteSeleccionado = signal<Cliente | null>(null);
  tabActivo = signal<'info' | 'historial' | 'preferencias' | 'notas'>('info');
  paginaActual = signal(1);
  porPagina = signal(8);
  modalEliminar = signal<Cliente | null>(null);
  cargandoHistorial = signal(false);

  get rol(): string {
    return this.authService.getSession()?.rol ?? '';
  }

  filteredClientes = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.clientes();
    return this.clientes().filter(c =>
      `${c.nombre} ${c.apellido}`.toLowerCase().includes(term) ||
      c.email?.toLowerCase().includes(term) ||
      c.telefono?.includes(term)
    );
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.filteredClientes().length / this.porPagina())));
  paginatedClientes = computed(() => {
    const start = (this.paginaActual() - 1) * this.porPagina();
    return this.filteredClientes().slice(start, start + this.porPagina());
  });

  // KPIs
  totalClientes = computed(() => this.clientes().length);
  nuevosEsteMes = computed(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    return this.clientes().filter(c => c.created_at && c.created_at >= monthStart).length;
  });
  clientesFrecuentes = computed(() =>
    this.clientes().filter(c => {
      const r = this.resumenes()[c.id];
      return r && r.total_visitas >= 3;
    }).length
  );
  valorPromedio = computed(() => {
    const conGasto = this.clientes().filter(c => {
      const r = this.resumenes()[c.id];
      return r && r.gasto_total > 0;
    });
    if (conGasto.length === 0) return 0;
    const total = conGasto.reduce((s, c) => s + (this.resumenes()[c.id]?.gasto_total ?? 0), 0);
    return total / conGasto.length;
  });

  ngOnInit() {
    this.clienteService.getAll().subscribe({
      next: (data) => {
        this.clientes.set(data);
        data.forEach(c => this.cargarResumen(c.id));
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  private cargarResumen(clienteId: number) {
    this.clienteService.getResumen(clienteId).subscribe({
      next: (r) => this.resumenes.update(m => ({ ...m, [clienteId]: r })),
      error: () => {},
    });
  }

  seleccionarCliente(c: Cliente) {
    this.clienteSeleccionado.set(c);
    this.tabActivo.set('info');
    this.cargarHistorial(c.id);
  }

  cerrarPanel() {
    this.clienteSeleccionado.set(null);
  }

  private cargarHistorial(clienteId: number) {
    this.cargandoHistorial.set(true);
    this.historialCitas.set([]);
    this.citaService.getAll().subscribe({
      next: (citas) => {
        this.historialCitas.set(citas.filter(c => c.cliente_id === clienteId));
        this.cargandoHistorial.set(false);
      },
      error: () => this.cargandoHistorial.set(false),
    });
  }

  cambiarPagina(p: number) {
    if (p >= 1 && p <= this.totalPages()) this.paginaActual.set(p);
  }

  confirmarEliminar(c: Cliente) {
    this.modalEliminar.set(c);
  }

  cerrarModal() {
    this.modalEliminar.set(null);
  }

  eliminarCliente() {
    const c = this.modalEliminar();
    if (!c) return;
    this.clienteService.delete(c.id).subscribe({
      next: () => {
        this.clientes.update(list => list.filter(x => x.id !== c.id));
        if (this.clienteSeleccionado()?.id === c.id) this.cerrarPanel();
        this.cerrarModal();
      },
      error: () => this.cerrarModal(),
    });
  }

  readonly Math = Math;

  rangoPaginacion = computed(() => {
    const total = this.totalPages();
    const actual = this.paginaActual();
    const pages: number[] = [];
    const start = Math.max(1, actual - 2);
    const end = Math.min(total, actual + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  });

  desde = computed(() => ((this.paginaActual() - 1) * this.porPagina()) + 1);
  hasta = computed(() => Math.min(this.paginaActual() * this.porPagina(), this.filteredClientes().length));

  getInitiales(nombre: string): string {
    const partes = nombre.trim().split(/\s+/);
    return partes.map(p => p[0]).join('').toUpperCase().slice(0, 2);
  }

  formatearFecha(f: string | null | undefined): string {
    if (!f) return '—';
    return new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(f));
  }

  formatearFechaLarga(f: string | null | undefined): string {
    if (!f) return '—';
    return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(f));
  }

  estadoBadge(activo: boolean): string {
    return activo ? 'Activo' : 'Inactivo';
  }
}
