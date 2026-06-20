import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { ServicioService } from '../../core/services/servicio.service';
import { CabinaService } from '../../core/services/cabina.service';
import { CitaService } from '../../core/services/cita.service';
import type { Servicio, Cabina, ReporteServicio } from '../../core/models';

@Component({
  selector: 'app-servicios',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule],
  templateUrl: './servicios.component.html',
  styleUrl: './servicios.component.scss',
})
export class ServiciosComponent implements OnInit {
  private fb = inject(FormBuilder);
  private servicioService = inject(ServicioService);
  private cabinaService = inject(CabinaService);
  private citaService = inject(CitaService);

  readonly currency = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });
  readonly tiposTerapia = ['masajes', 'facial', 'hidroterapia', 'aromaterapia', 'multiple'];
  readonly gradientes: Record<string, string> = {
    masajes: 'linear-gradient(135deg, #D9B48F, #C96A2B)',
    facial: 'linear-gradient(135deg, #F0D9C8, #D9A87A)',
    hidroterapia: 'linear-gradient(135deg, #C8D9F0, #7A9FD9)',
    aromaterapia: 'linear-gradient(135deg, #D4C8F0, #9A7AD9)',
    multiple: 'linear-gradient(135deg, #C8F0D4, #7AD99A)',
  };

  servicios = signal<Servicio[]>([]);
  cabinas = signal<Cabina[]>([]);
  reporte = signal<ReporteServicio[]>([]);
  cargando = signal(true);
  searchTerm = signal('');
  servicioSeleccionado = signal<Servicio | null>(null);
  tabActivo = signal<'info' | 'disponibilidad'>('info');
  modalEliminar = signal<Servicio | null>(null);
  modalFormulario = signal<{ abierto: boolean; editando: Servicio | null }>({ abierto: false, editando: null });
  editando = signal(false);
  mensaje = signal('');

  formServicio = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    tipo_terapia: ['', Validators.required],
    duracion_minutos: [60, [Validators.required, Validators.min(30), Validators.max(120)]],
    precio: [10000, [Validators.required, Validators.min(10000)]],
    descripcion: [''],
    beneficios: [''],
    incluye: [''],
    recomendaciones: [''],
    contraindicaciones: [''],
    cabinas_ids: [[] as number[]],
  });

  filtered = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.servicios();
    return this.servicios().filter(s =>
      s.nombre.toLowerCase().includes(term) ||
      s.tipo_terapia.toLowerCase().includes(term)
    );
  });

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
  cerrarModal() { this.modalEliminar.set(null); this.mensaje.set(''); }

  eliminar() {
    const s = this.modalEliminar();
    if (!s) return;
    this.servicioService.delete(s.id).subscribe({
      next: () => {
        this.servicios.update(list => list.filter(x => x.id !== s.id));
        if (this.servicioSeleccionado()?.id === s.id) this.cerrarPanel();
        this.mensaje.set('Servicio eliminado correctamente');
        this.cerrarModal();
        setTimeout(() => this.mensaje.set(''), 3000);
      },
      error: (err: any) => {
        this.cerrarModal();
        const detalle = err.error?.detail;
        this.mensaje.set(typeof detalle === 'string' ? detalle : 'Error al eliminar el servicio');
        setTimeout(() => this.mensaje.set(''), 3000);
      },
    });
  }

  abrirCrear() {
    this.formServicio.reset({
      nombre: '',
      tipo_terapia: '',
      duracion_minutos: 60,
      precio: 0,
      descripcion: '',
      beneficios: '',
      incluye: '',
      recomendaciones: '',
      contraindicaciones: '',
      cabinas_ids: [],
    });
    this.modalFormulario.set({ abierto: true, editando: null });
    this.editando.set(false);
    this.mensaje.set('');
  }

  abrirEditar(s: Servicio) {
    this.formServicio.setValue({
      nombre: s.nombre,
      tipo_terapia: s.tipo_terapia,
      duracion_minutos: s.duracion_minutos,
      precio: s.precio,
      descripcion: s.descripcion || '',
      beneficios: s.beneficios || '',
      incluye: s.incluye || '',
      recomendaciones: s.recomendaciones || '',
      contraindicaciones: s.contraindicaciones || '',
      cabinas_ids: s.cabinas_ids || [],
    });
    this.modalFormulario.set({ abierto: true, editando: s });
    this.editando.set(false);
    this.mensaje.set('');
  }

  cerrarModalFormulario() {
    this.modalFormulario.set({ abierto: false, editando: null });
  }

  toggleCabina(cabinaId: number) {
    const current = this.formServicio.get('cabinas_ids')?.value || [];
    const idx = current.indexOf(cabinaId);
    const updated = idx >= 0 ? current.filter((id: number) => id !== cabinaId) : [...current, cabinaId];
    this.formServicio.get('cabinas_ids')?.setValue(updated);
  }

  guardarServicio() {
    if (this.formServicio.invalid) {
      Object.keys(this.formServicio.controls).forEach(k => this.formServicio.get(k)?.markAsTouched());
      return;
    }
    const modal = this.modalFormulario();
    this.editando.set(true);
    this.mensaje.set('');

    const data: Record<string, any> = {
      nombre: this.formServicio.value.nombre?.trim(),
      tipo_terapia: this.formServicio.value.tipo_terapia,
      duracion_minutos: this.formServicio.value.duracion_minutos,
      precio: this.formServicio.value.precio,
      descripcion: this.formServicio.value.descripcion?.trim() || null,
      beneficios: this.formServicio.value.beneficios?.trim() || null,
      incluye: this.formServicio.value.incluye?.trim() || null,
      recomendaciones: this.formServicio.value.recomendaciones?.trim() || null,
      contraindicaciones: this.formServicio.value.contraindicaciones?.trim() || null,
      cabinas_ids: this.formServicio.value.cabinas_ids || [],
    };

    const request = modal.editando
      ? this.servicioService.update(modal.editando.id, data)
      : this.servicioService.create(data);

    request.subscribe({
      next: (res: any) => {
        if (modal.editando) {
          this.servicios.update(list => list.map(x => x.id === modal.editando!.id ? { ...x, ...res } : x));
          this.servicioSeleccionado.update(v => v?.id === modal.editando!.id ? { ...v, ...res } : v);
        } else {
          this.servicios.update(list => [...list, res]);
        }
        this.mensaje.set(modal.editando ? 'Servicio actualizado correctamente' : 'Servicio creado correctamente');
        this.editando.set(false);
        setTimeout(() => this.cerrarModalFormulario(), 1000);
      },
      error: (err: any) => {
        const detalle = err.error?.detail;
        if (typeof detalle === 'string') {
          this.mensaje.set(detalle);
        } else if (Array.isArray(detalle)) {
          this.mensaje.set(detalle.map((e: any) => e.msg?.replace('Value error, ', '') || e).join('. '));
        } else {
          this.mensaje.set('Error al guardar el servicio');
        }
        this.editando.set(false);
      },
    });
  }

  campoError(campo: string): string {
    const control = this.formServicio.get(campo);
    if (!control || !control.touched || control.valid) return '';
    if (control.errors?.['required']) return 'Este campo es obligatorio';
    if (control.errors?.['min']) {
      if (campo === 'duracion_minutos') return 'Mínimo 30 minutos';
      if (campo === 'precio') return 'Mínimo $10.000';
    }
    if (control.errors?.['max']) return 'Máximo 120 minutos';
    if (control.errors?.['minlength']) return 'Mínimo 2 caracteres';
    if (control.errors?.['maxlength']) return 'Máximo 100 caracteres';
    return '';
  }

  cabinasCompatibles(servicio: Servicio): Cabina[] {
    return this.cabinas().filter(c =>
      c.tipo_tratamiento === 'multiple' ||
      c.tipo_tratamiento === servicio.tipo_terapia
    );
  }
}
