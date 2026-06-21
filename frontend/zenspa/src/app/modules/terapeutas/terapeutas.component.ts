import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { TerapeutaService } from '../../core/services/terapeuta.service';
import { CitaService } from '../../core/services/cita.service';
import { AuthService } from '../../core/services/auth.service';
import type { Terapeuta, Cita } from '../../core/models';

@Component({
  selector: 'app-terapeutas',
  standalone: true,
  imports: [RouterLink, FormsModule, ReactiveFormsModule],
  templateUrl: './terapeutas.component.html',
  styleUrl: './terapeutas.component.scss',
})
export class TerapeutasComponent implements OnInit {
  private fb = inject(FormBuilder);
  private terapeutaService = inject(TerapeutaService);
  private citaService = inject(CitaService);
  private authService = inject(AuthService);

  readonly TIPOS_TERAPIA = ['masajes', 'facial', 'hidroterapia', 'aromaterapia', 'multiple'] as const;

  readonly hoy = new Date();
  readonly hoyStr = this.hoy.toISOString().split('T')[0];

  terapeutas = signal<Terapeuta[]>([]);
  citasTodas = signal<Cita[]>([]);
  cargando = signal(true);
  searchTerm = signal('');
  terapeutaSeleccionado = signal<Terapeuta | null>(null);
  tabActivo = signal<'info' | 'disponibilidad' | 'rendimiento'>('info');
  modalEliminar = signal<Terapeuta | null>(null);
  modalEditar = signal<Terapeuta | null>(null);
  editando = signal(false);
  mensaje = signal('');

  formEditar = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)]],
    apellido: ['', [Validators.required, Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)]],
    email: ['', [Validators.required, Validators.email]],
    especialidad: ['', [Validators.required, (c: any) => c.value && !this.TIPOS_TERAPIA.includes(c.value) ? { invalida: true } : null]],
    certificaciones: [''],
  });

  filteredTerapeutas = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.terapeutas();
    return this.terapeutas().filter(t =>
      `${t.nombre} ${t.apellido}`.toLowerCase().includes(term) ||
      t.email?.toLowerCase().includes(term) ||
      t.especialidad?.toLowerCase().includes(term)
    );
  });

  totalTerapeutas = computed(() => this.terapeutas().length);
  activos = computed(() => this.terapeutas().filter(t => t.activo).length);
  citasHoy = computed(() =>
    this.citasTodas().filter(c => c.fecha === this.hoyStr).length
  );

  completadasHoy = computed(() =>
    this.citasTodas().filter(c => c.fecha === this.hoyStr && c.estado === 'completada').length
  );

  private inicioSemana = (() => {
    const d = new Date(this.hoy);
    const dia = d.getDay();
    const diff = d.getDate() - dia + (dia === 0 ? -6 : 1);
    d.setDate(diff);
    return d.toISOString().split('T')[0];
  })();

  private finSemana = (() => {
    const d = new Date(this.inicioSemana);
    d.setDate(d.getDate() + 6);
    return d.toISOString().split('T')[0];
  })();

  citasSemana = computed(() =>
    this.citasTodas().filter(c => c.fecha >= this.inicioSemana && c.fecha <= this.finSemana)
  );

  citasPorTerapeuta(tId: number): number {
    return this.citasSemana().filter(c => c.terapeuta_id === tId).length;
  }

  progresoBarra(citas: number): string {
    const pct = Math.min((citas / 16) * 100, 100);
    return pct + '%';
  }

  clientesAtendidos(tId: number): number {
    return new Set(this.citasTodas().filter(c => c.terapeuta_id === tId).map(c => c.cliente_id)).size;
  }

  ngOnInit() {
    this.terapeutaService.getAll().subscribe({
      next: (data) => { this.terapeutas.set(data); this.cargando.set(false); },
      error: () => this.cargando.set(false),
    });
    this.citaService.getAll().subscribe({
      next: (data) => this.citasTodas.set(data),
      error: () => this.citasTodas.set([]),
    });
  }

  seleccionarTerapeuta(t: Terapeuta) {
    this.terapeutaSeleccionado.set(t);
    this.tabActivo.set('info');
  }

  cerrarPanel() { this.terapeutaSeleccionado.set(null); }

  confirmarEliminar(t: Terapeuta) { this.modalEliminar.set(t); }
  cerrarModal() { this.modalEliminar.set(null); this.mensaje.set(''); }

  eliminarTerapeuta() {
    const t = this.modalEliminar();
    if (!t) return;
    this.terapeutaService.delete(t.id).subscribe({
      next: () => {
        this.terapeutas.update(list => list.filter(x => x.id !== t.id));
        if (this.terapeutaSeleccionado()?.id === t.id) this.cerrarPanel();
        this.mensaje.set('Terapeuta eliminado correctamente');
        this.cerrarModal();
        setTimeout(() => this.mensaje.set(''), 3000);
      },
      error: (err: any) => {
        this.cerrarModal();
        const detalle = err.error?.detail;
        this.mensaje.set(typeof detalle === 'string' ? detalle : 'Error al eliminar el terapeuta');
        setTimeout(() => this.mensaje.set(''), 3000);
      },
    });
  }

  editarTerapeuta(t: Terapeuta) {
    this.formEditar.setValue({
      nombre: t.nombre,
      apellido: t.apellido,
      email: t.email,
      especialidad: t.especialidad,
      certificaciones: t.certificaciones || '',
    });
    this.modalEditar.set(t);
    this.editando.set(false);
    this.mensaje.set('');
  }

  cerrarModalEditar() {
    this.modalEditar.set(null);
  }

  guardarEdicion() {
    if (this.formEditar.invalid) return;
    const t = this.modalEditar();
    if (!t) return;
    this.editando.set(true);
    this.mensaje.set('');
    const data: Record<string, any> = {
      nombre: this.formEditar.value.nombre?.trim(),
      apellido: this.formEditar.value.apellido?.trim(),
      email: this.formEditar.value.email?.trim(),
      especialidad: this.formEditar.value.especialidad?.trim(),
      certificaciones: this.formEditar.value.certificaciones?.trim() || null,
    };
    this.terapeutaService.update(t.id, data).subscribe({
      next: (res: any) => {
        this.terapeutas.update(list => list.map(x => x.id === t.id ? { ...x, ...res } : x));
        this.terapeutaSeleccionado.update(v => v?.id === t.id ? { ...v, ...res } : v);
        this.mensaje.set('Terapeuta actualizado correctamente');
        this.editando.set(false);
        setTimeout(() => this.cerrarModalEditar(), 1000);
      },
      error: (err: any) => {
        const detalle = err.error?.detail;
        if (typeof detalle === 'string') {
          this.mensaje.set(detalle);
        } else if (Array.isArray(detalle)) {
          this.mensaje.set(detalle.map((e: any) => e.msg).join('. '));
        } else {
          this.mensaje.set('Error al actualizar el terapeuta');
        }
        this.editando.set(false);
      },
    });
  }

  campoError(campo: string): string {
    const control = this.formEditar.get(campo);
    if (!control || !control.touched || control.valid) return '';
    if (control.errors?.['required']) return 'Este campo es obligatorio';
    if (control.errors?.['pattern']) return 'Solo se permiten letras y espacios';
    if (control.errors?.['email']) return 'Correo electrónico inválido';
    if (control.errors?.['invalida']) return 'Selecciona una especialidad válida';
    return '';
  }

  getInitiales(nombre: string): string {
    const partes = nombre.trim().split(/\s+/);
    return partes.map(p => p[0]).join('').toUpperCase().slice(0, 2);
  }

  certificacionesLista(certs: string): string[] {
    return certs?.split(/[.\n]+/).filter(c => c.trim()).map(c => c.trim()) || [];
  }
}
