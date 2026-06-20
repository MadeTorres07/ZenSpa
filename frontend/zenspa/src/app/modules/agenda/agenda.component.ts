import { Component, inject, signal, computed, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ClienteService } from '../../core/services/cliente.service';
import { TerapeutaService } from '../../core/services/terapeuta.service';
import { ServicioService } from '../../core/services/servicio.service';
import { CabinaService } from '../../core/services/cabina.service';
import { CitaService } from '../../core/services/cita.service';
import { AuthService } from '../../core/services/auth.service';
import type { Cliente, Terapeuta, Servicio, Cabina } from '../../core/models';

type ServicioSeleccionado = Servicio;

@Component({
  selector: 'app-agenda',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './agenda.component.html',
  styleUrl: './agenda.component.scss',
})
export class AgendaComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private clienteService = inject(ClienteService);
  private terapeutaService = inject(TerapeutaService);
  private servicioService = inject(ServicioService);
  private cabinaService = inject(CabinaService);
  private citaService = inject(CitaService);
  private authService = inject(AuthService);

  readonly hoy = new Date();
  readonly hoyStr = this.hoy.toISOString().split('T')[0];
  readonly currency = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });

  private searchSubject = new Subject<string>();
  searchTerm = signal('');

  clientes = signal<Cliente[]>([]);
  clienteSeleccionado = signal<Cliente | null>(null);
  terapeutas = signal<Terapeuta[]>([]);
  terapeutaSeleccionado = signal<Terapeuta | null>(null);
  servicios = signal<Servicio[]>([]);
  serviciosSeleccionados = signal<Servicio[]>([]);
  cabinas = signal<Cabina[]>([]);
  cabinaSeleccionada = signal<Cabina | null>(null);
  fecha = signal(this.hoyStr);
  horaInicio = signal('09:00');
  observaciones = signal('');

  cargando = signal(true);
  error = signal('');
  success = signal(false);

  filteredClientes = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.clientes();
    return this.clientes().filter(c =>
      `${c.nombre} ${c.apellido}`.toLowerCase().includes(term) ||
      c.email?.toLowerCase().includes(term) ||
      c.telefono?.includes(term)
    );
  });

  totalDuracion = computed(() =>
    this.serviciosSeleccionados().reduce((sum, s) => sum + s.duracion_minutos, 0)
  );

  horaFin = computed(() => {
    const inicio = this.horaInicio();
    const [h, m] = inicio.split(':').map(Number);
    const totalMin = h * 60 + m + this.totalDuracion();
    const hh = Math.floor(totalMin / 60);
    const mm = totalMin % 60;
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  });

  subtotal = computed(() =>
    this.serviciosSeleccionados().reduce((sum, s) => sum + s.precio, 0)
  );

  iva = computed(() => Math.round(this.subtotal() * 0.19));

  total = computed(() => this.subtotal() + this.iva());

  puedeConfirmar = computed(() =>
    !!this.clienteSeleccionado() &&
    !!this.terapeutaSeleccionado() &&
    !!this.cabinaSeleccionada() &&
    this.serviciosSeleccionados().length > 0
  );

  get rol(): string {
    return this.authService.getSession()?.rol ?? '';
  }

  ngOnInit() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(term => this.searchTerm.set(term));

    this.clienteService.getAll().subscribe({
      next: (data) => this.clientes.set(data),
      error: () => this.clientes.set([]),
    });

    this.terapeutaService.getAll().subscribe({
      next: (data) => this.terapeutas.set(data.filter(t => t.activo)),
      error: () => this.terapeutas.set([]),
    });

    this.servicioService.getAll().subscribe({
      next: (data) => this.servicios.set(data),
      error: () => this.servicios.set([]),
    });

    this.cabinaService.getAll().subscribe({
      next: (data) => this.cabinas.set(data.filter(c => c.estado === 'disponible')),
      error: () => this.cabinas.set([]),
    });

    this.cargando.set(false);
  }

  onSearch(value: string) {
    this.searchSubject.next(value);
  }

  seleccionarCliente(c: Cliente) {
    this.clienteSeleccionado.set(c);
    this.error.set('');
  }

  seleccionarTerapeuta(t: Terapeuta) {
    this.terapeutaSeleccionado.set(t);
  }

  toggleServicio(s: Servicio) {
    const actuales = this.serviciosSeleccionados();
    const idx = actuales.findIndex(x => x.id === s.id);
    if (idx >= 0) {
      this.serviciosSeleccionados.set(actuales.filter(x => x.id !== s.id));
    } else {
      this.serviciosSeleccionados.set([...actuales, s]);
    }
  }

  estaSeleccionado(s: Servicio): boolean {
    return this.serviciosSeleccionados().some(x => x.id === s.id);
  }

  seleccionarCabina(c: Cabina) {
    this.cabinaSeleccionada.set(c);
  }

  confirmar() {
    const cliente = this.clienteSeleccionado();
    const terapeuta = this.terapeutaSeleccionado();
    const cabina = this.cabinaSeleccionada();
    if (!cliente || !terapeuta || !cabina || this.serviciosSeleccionados().length === 0) return;

    this.error.set('');
    this.success.set(false);

    const payload = {
      cliente_id: cliente.id,
      terapeuta_id: terapeuta.id,
      cabina_id: cabina.id,
      fecha: this.fecha(),
      hora_inicio: this.horaInicio() + ':00',
      hora_fin: this.horaFin() + ':00',
      servicios: this.serviciosSeleccionados().map(s => s.id),
      productos: [],
    };

    this.citaService.create(payload).subscribe({
      next: () => {
        this.success.set(true);
        this.clienteSeleccionado.set(null);
        this.terapeutaSeleccionado.set(null);
        this.serviciosSeleccionados.set([]);
        this.cabinaSeleccionada.set(null);
        this.observaciones.set('');
        this.horaInicio.set('09:00');
      },
      error: (err) => {
        if (err.status === 409) {
          this.error.set(err.error?.detail || 'Conflicto de horario. El terapeuta o cabina no está disponible.');
        } else {
          this.error.set('Error al crear la cita. Intenta de nuevo.');
        }
      },
    });
  }

  getInitiales(nombre: string): string {
    const partes = nombre.trim().split(/\s+/);
    return partes.map(p => p[0]).join('').toUpperCase().slice(0, 2);
  }

  formatearFecha(fecha: string | null | undefined): string {
    if (!fecha) return '—';
    const d = new Date(fecha);
    return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
  }

  resetSuccess() {
    this.success.set(false);
  }
}
