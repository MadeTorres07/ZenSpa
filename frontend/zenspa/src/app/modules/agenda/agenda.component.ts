import { Component, inject, signal, computed, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, distinctUntilChanged, forkJoin } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ClienteService } from '../../core/services/cliente.service';
import { TerapeutaService } from '../../core/services/terapeuta.service';
import { ServicioService } from '../../core/services/servicio.service';
import { CabinaService } from '../../core/services/cabina.service';
import { CitaService } from '../../core/services/cita.service';
import { AuthService } from '../../core/services/auth.service';
import type { Cliente, Terapeuta, Servicio, Cabina, Cita } from '../../core/models';

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
  mensajeExito = signal('');

  // Agenda view
  modoAgenda = signal(false);
  citasDelDia = signal<Cita[]>([]);
  cargandoCitas = signal(false);

  // Edit modal
  modalEditarCita = signal<Cita | null>(null);
  editEstado = signal<string>('');

  puedeMarcarCompletada = computed(() => {
    const cita = this.modalEditarCita();
    if (!cita) return true;
    return new Date(cita.fecha + 'T' + cita.hora_fin) < new Date();
  });

  filteredClientes = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.clientes();
    return this.clientes().filter(c =>
      `${c.nombre} ${c.apellido}`.toLowerCase().includes(term) ||
      c.email?.toLowerCase().includes(term) ||
      c.telefono?.includes(term)
    );
  });

  serviciosFiltrados = computed(() => {
    const t = this.terapeutaSeleccionado();
    if (!t) return this.servicios();
    return this.servicios().filter(s => s.tipo_terapia === t.especialidad);
  });

  cabinasFiltradas = computed(() => {
    const t = this.terapeutaSeleccionado();
    if (!t) return this.cabinas();
    return this.cabinas().filter(c =>
      c.tipo_tratamiento === t.especialidad || c.tipo_tratamiento === 'multiple'
    );
  });

  horarioOcupado = computed(() => {
    const citas = this.citasDelDia();
    const t = this.terapeutaSeleccionado();
    const c = this.cabinaSeleccionada();
    if (!citas.length) return [];
    return citas
      .filter(cita => cita.estado !== 'cancelada' && cita.estado !== 'cancelada_penalidad')
      .filter(cita =>
        (t && cita.terapeuta_id === t.id) || (c && cita.cabina_id === c.id)
      )
      .map(cita => `${cita.hora_inicio.slice(0, 5)} - ${cita.hora_fin.slice(0, 5)} (${cita.nombre_cliente})`);
  });

  conflictoHorario = computed(() => {
    if (!this.terapeutaSeleccionado() || !this.cabinaSeleccionada()) return null;
    const inicio = this.horaInicio();
    const fin = this.horaFin();
    const citas = this.citasDelDia();
    const tId = this.terapeutaSeleccionado()!.id;
    const cId = this.cabinaSeleccionada()!.id;

    for (const cita of citas) {
      if (cita.estado === 'cancelada' || cita.estado === 'cancelada_penalidad') continue;
      const ci = cita.hora_inicio.slice(0, 5);
      const cf = cita.hora_fin.slice(0, 5);
      const solapa = inicio < cf && fin > ci;
      if (solapa && (cita.terapeuta_id === tId || cita.cabina_id === cId)) {
        return { hayConflicto: true, cita, siguienteDisponible: cf };
      }
    }
    return null;
  });

  mensajeDisponibilidad = computed(() => {
    const c = this.conflictoHorario();
    if (!c) return '';
    return `Hora disponible a partir de las ${c.siguienteDisponible}`;
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
    this.serviciosSeleccionados().length > 0 &&
    !this.conflictoHorario()
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

  private autoCancelarVencidas() {
    const hoy = this.hoyStr;
    const updates: any[] = [];
    for (const cita of this.citasDelDia()) {
      if (cita.estado !== 'pendiente' && cita.estado !== 'confirmada') continue;
      if (cita.fecha < hoy) updates.push(cita.id);
    }
    if (!updates.length) return;
    forkJoin(updates.map(id => this.citaService.update(id, { estado: 'cancelada' }))).subscribe({
      next: () => {
        this.citasDelDia.update(list => list.map(x =>
          updates.includes(x.id) ? { ...x, estado: 'cancelada' } : x
        ));
      },
    });
  }

  private cargarCitasDelDia() {
    const f = this.fecha();
    this.cargandoCitas.set(true);
    this.citaService.getCitasFiltradas({ fecha_inicio: f, fecha_fin: f }).subscribe({
      next: (data) => {
        this.citasDelDia.set(data);
        this.cargandoCitas.set(false);
        this.autoCancelarVencidas();
      },
      error: () => this.cargandoCitas.set(false),
    });
  }

  onSearch(value: string) {
    this.searchSubject.next(value);
  }

  seleccionarCliente(c: Cliente) {
    if (this.clienteSeleccionado()?.id === c.id) {
      this.clienteSeleccionado.set(null);
    } else {
      this.clienteSeleccionado.set(c);
    }
    this.error.set('');
  }

  seleccionarTerapeuta(t: Terapeuta) {
    if (this.terapeutaSeleccionado()?.id === t.id) {
      this.terapeutaSeleccionado.set(null);
    } else {
      this.terapeutaSeleccionado.set(t);
    }
    this.serviciosSeleccionados.set([]);
    this.cabinaSeleccionada.set(null);
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

  servicioDeshabilitado(s: Servicio): boolean {
    const t = this.terapeutaSeleccionado();
    return !!t && s.tipo_terapia !== t.especialidad;
  }

  cabinaDeshabilitada(c: Cabina): boolean {
    const t = this.terapeutaSeleccionado();
    return !!t && c.tipo_tratamiento !== t.especialidad && c.tipo_tratamiento !== 'multiple';
  }

  seleccionarCabina(c: Cabina) {
    if (this.cabinaSeleccionada()?.id === c.id) {
      this.cabinaSeleccionada.set(null);
    } else {
      this.cabinaSeleccionada.set(c);
    }
  }

  cambiarFecha(f: string) {
    this.fecha.set(f);
    this.cargarCitasDelDia();
  }

  toggleAgenda() {
    this.modoAgenda.set(!this.modoAgenda());
    if (this.modoAgenda()) {
      this.cargarCitasDelDia();
    }
  }

  abrirEditarCita(cita: Cita) {
    this.modalEditarCita.set(cita);
    this.editEstado.set(cita.estado);
    this.error.set('');
    this.success.set(false);
    this.fecha.set(cita.fecha);
    this.horaInicio.set(cita.hora_inicio.slice(0, 5));
    const t = this.terapeutas().find(x => x.id === cita.terapeuta_id);
    this.terapeutaSeleccionado.set(t || null);
    const c = this.cabinas().find(x => x.id === cita.cabina_id);
    this.cabinaSeleccionada.set(c || null);
    this.serviciosSeleccionados.set(cita.servicios || []);
    this.observaciones.set(cita.notas || '');
  }

  cerrarEditarCita() {
    this.modalEditarCita.set(null);
    this.error.set('');
  }

  guardarCambiosCita() {
    const cita = this.modalEditarCita();
    if (!cita) return;
    if (this.editEstado() === 'completada' && !this.puedeMarcarCompletada()) {
      this.error.set('No se puede marcar como completada una cita que aún no ha ocurrido');
      return;
    }
    const terapeuta = this.terapeutaSeleccionado();
    const cabina = this.cabinaSeleccionada();
    const payload: any = { estado: this.editEstado() };
    if (terapeuta) payload['terapeuta_id'] = terapeuta.id;
    if (cabina) payload['cabina_id'] = cabina.id;
    if (this.serviciosSeleccionados().length) payload['servicios'] = this.serviciosSeleccionados().map(s => s.id);
    payload['fecha'] = this.fecha();
    payload['hora_inicio'] = this.horaInicio() + ':00';
    payload['hora_fin'] = this.horaFin() + ':00';
    payload['notas'] = this.observaciones();
    this.citaService.update(cita.id, payload).subscribe({
      next: () => {
        this.citasDelDia.update(list => list.map(x => x.id === cita.id ? {
          ...x, ...payload, nombre_cliente: x.nombre_cliente,
          nombre_terapeuta: terapeuta ? `${terapeuta.nombre} ${terapeuta.apellido}` : x.nombre_terapeuta,
          nombre_cabina: cabina ? cabina.nombre : x.nombre_cabina,
          servicios: this.serviciosSeleccionados(),
        } as any : x));
        this.cerrarEditarCita();
        this.mensajeExito.set('Cita actualizada exitosamente');
        this.success.set(true);
        setTimeout(() => this.success.set(false), 3000);
      },
      error: (err) => {
        this.error.set(err.error?.detail || 'Error al actualizar la cita');
      },
    });
  }

  cancelarCita() {
    const cita = this.modalEditarCita();
    if (!cita || !confirm(`¿Cancelar la cita de ${cita.nombre_cliente}?`)) return;
    this.citaService.update(cita.id, { estado: 'cancelada' }).subscribe({
      next: () => {
        this.citasDelDia.update(list => list.map(x => x.id === cita.id ? { ...x, estado: 'cancelada' } : x));
        this.cerrarEditarCita();
        this.mensajeExito.set('Cita cancelada exitosamente');
        this.success.set(true);
        setTimeout(() => this.success.set(false), 3000);
      },
      error: (err) => {
        this.error.set(err.error?.detail || 'Error al cancelar la cita');
      },
    });
  }

  confirmar() {
    const cliente = this.clienteSeleccionado();
    const terapeuta = this.terapeutaSeleccionado();
    const cabina = this.cabinaSeleccionada();
    if (!cliente || !terapeuta || !cabina || this.serviciosSeleccionados().length === 0) return;
    if (this.conflictoHorario()) {
      this.error.set(this.mensajeDisponibilidad());
      return;
    }

    this.error.set('');
    this.success.set(false);

    const payload: any = {
      cliente_id: cliente.id,
      terapeuta_id: terapeuta.id,
      cabina_id: cabina.id,
      fecha: this.fecha(),
      hora_inicio: this.horaInicio() + ':00',
      hora_fin: this.horaFin() + ':00',
      servicios: this.serviciosSeleccionados().map(s => s.id),
      productos: [],
    };
    if (this.observaciones()) payload['notas'] = this.observaciones();

    this.citaService.create(payload).subscribe({
      next: () => {
        this.mensajeExito.set('Cita creada exitosamente');
        this.success.set(true);
        setTimeout(() => this.success.set(false), 3000);
        this.clienteSeleccionado.set(null);
        this.terapeutaSeleccionado.set(null);
        this.serviciosSeleccionados.set([]);
        this.cabinaSeleccionada.set(null);
        this.observaciones.set('');
        this.horaInicio.set('09:00');
        this.cargarCitasDelDia();
      },
      error: (err) => {
        if (err.status === 409) {
          this.error.set('Conflicto de horario. ' + (err.error?.detail || ''));
          this.cargarCitasDelDia();
        } else if (err.status === 400) {
          const detalle = err.error?.detail;
          this.error.set(Array.isArray(detalle) ? detalle.map((e: any) => e.msg?.replace('Value error, ', '') || e).join('. ') : (detalle || 'Error al crear la cita.'));
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

  formatearFecha(f: string | null | undefined): string {
    if (!f) return '—';
    const d = new Date(f + 'T12:00:00');
    return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
  }

  resetSuccess() {
    this.success.set(false);
  }

  estadoBadgeClass(estado: string): string {
    const map: Record<string, string> = {
      pendiente: 'badge-pendiente',
      confirmada: 'badge-confirmada',
      completada: 'badge-completada',
      cancelada: 'badge-cancelada',
      cancelada_penalidad: 'badge-cancelada',
    };
    return map[estado] || 'badge-pendiente';
  }

  estadoLabel(estado: string): string {
    const map: Record<string, string> = {
      pendiente: 'Pendiente',
      confirmada: 'Confirmada',
      completada: 'Completada',
      cancelada: 'Cancelada',
      cancelada_penalidad: 'Cancelada c/penalidad',
    };
    return map[estado] || estado;
  }
}
