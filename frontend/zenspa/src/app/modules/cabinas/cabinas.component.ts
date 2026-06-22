import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { CabinaService } from '../../core/services/cabina.service';
import type { Cabina } from '../../core/models';

@Component({
  selector: 'app-cabinas',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule],
  templateUrl: './cabinas.component.html',
  styleUrl: './cabinas.component.scss',
})
export class CabinasComponent implements OnInit {
  private fb = inject(FormBuilder);
  private cabinaService = inject(CabinaService);

  readonly tiposTratamiento = ['masajes', 'facial', 'hidroterapia', 'aromaterapia', 'multiple'];
  readonly estados = ['disponible', 'ocupada', 'mantenimiento'];

  cabinas = signal<Cabina[]>([]);
  cargando = signal(true);
  searchTerm = signal('');
  cabinaSeleccionada = signal<Cabina | null>(null);
  modalEliminar = signal<Cabina | null>(null);
  modalFormulario = signal<{ abierto: boolean; editando: Cabina | null }>({ abierto: false, editando: null });
  editando = signal(false);
  mensaje = signal('');

  formCabina = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100), Validators.pattern(/^[a-zA-ZÀ-ÿ\u00f1\u00d10-9\s]+$/)]],
    tipo_tratamiento: ['', Validators.required],
    estado: ['disponible', Validators.required],
    equipamiento: [''],
  });

  filtered = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.cabinas();
    return this.cabinas().filter(c =>
      c.nombre.toLowerCase().includes(term) ||
      c.tipo_tratamiento.toLowerCase().includes(term) ||
      c.estado.toLowerCase().includes(term)
    );
  });

  total = computed(() => this.cabinas().length);
  disponibles = computed(() => this.cabinas().filter(c => c.estado === 'disponible').length);
  ocupadas = computed(() => this.cabinas().filter(c => c.estado === 'ocupada').length);
  mantenimiento = computed(() => this.cabinas().filter(c => c.estado === 'mantenimiento').length);

  ngOnInit() {
    this.cabinaService.getAll().subscribe({
      next: (data) => { this.cabinas.set(data); this.cargando.set(false); },
      error: () => this.cargando.set(false),
    });
  }

  seleccionar(c: Cabina) { this.cabinaSeleccionada.set(c); }
  cerrarPanel() { this.cabinaSeleccionada.set(null); }

  confirmarEliminar(c: Cabina) { this.modalEliminar.set(c); }
  cerrarModal() { this.modalEliminar.set(null); this.mensaje.set(''); }

  eliminar() {
    const c = this.modalEliminar();
    if (!c) return;
    this.cabinaService.delete(c.id).subscribe({
      next: () => {
        this.cabinas.update(list => list.filter(x => x.id !== c.id));
        if (this.cabinaSeleccionada()?.id === c.id) this.cerrarPanel();
        this.mensaje.set('Cabina eliminada correctamente');
        this.cerrarModal();
        setTimeout(() => this.mensaje.set(''), 3000);
      },
      error: (err: any) => {
        this.cerrarModal();
        const body = err.error;
        let msg = '';
        if (typeof body === 'string') msg = body;
        else if (body?.detail && typeof body.detail === 'string') msg = body.detail;
        else if (body?.detail && Array.isArray(body.detail)) msg = body.detail.map((e: any) => e.msg?.replace('Value error, ', '') || e).join('. ');
        else if (err.message) msg = err.message;
        else msg = 'Error al eliminar la cabina';
        this.mensaje.set(msg);
        setTimeout(() => this.mensaje.set(''), 3000);
      },
    });
  }

  abrirCrear() {
    this.formCabina.reset({ nombre: '', tipo_tratamiento: '', estado: 'disponible', equipamiento: '' });
    this.modalFormulario.set({ abierto: true, editando: null });
    this.editando.set(false);
    this.mensaje.set('');
  }

  abrirEditar(c: Cabina) {
    this.formCabina.setValue({
      nombre: c.nombre,
      tipo_tratamiento: c.tipo_tratamiento,
      estado: c.estado,
      equipamiento: c.equipamiento || '',
    });
    this.modalFormulario.set({ abierto: true, editando: c });
    this.editando.set(false);
    this.mensaje.set('');
  }

  cerrarModalFormulario() { this.modalFormulario.set({ abierto: false, editando: null }); }

  guardarCabina() {
    if (this.formCabina.invalid) {
      Object.keys(this.formCabina.controls).forEach(k => this.formCabina.get(k)?.markAsTouched());
      return;
    }
    const modal = this.modalFormulario();
    this.editando.set(true);
    this.mensaje.set('');

    const data: Record<string, any> = {
      nombre: this.formCabina.value.nombre?.trim(),
      tipo_tratamiento: this.formCabina.value.tipo_tratamiento,
      estado: this.formCabina.value.estado,
      equipamiento: this.formCabina.value.equipamiento?.trim() || null,
    };

    const request = modal.editando
      ? this.cabinaService.update(modal.editando.id, data)
      : this.cabinaService.create(data);

    request.subscribe({
      next: (res: any) => {
        if (modal.editando) {
          this.cabinas.update(list => list.map(x => x.id === modal.editando!.id ? { ...x, ...res } : x));
          this.cabinaSeleccionada.update(v => v?.id === modal.editando!.id ? { ...v, ...res } : v);
        } else {
          this.cabinas.update(list => [...list, res]);
        }
        this.mensaje.set(modal.editando ? 'Cabina actualizada correctamente' : 'Cabina creada correctamente');
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
          this.mensaje.set('Error al guardar la cabina');
        }
        this.editando.set(false);
      },
    });
  }

  campoError(campo: string): string {
    const control = this.formCabina.get(campo);
    if (!control || !control.touched || control.valid) return '';
    if (control.errors?.['required']) return 'Este campo es obligatorio';
    if (control.errors?.['minlength']) return 'Mínimo 2 caracteres';
    if (control.errors?.['maxlength']) return 'Máximo 100 caracteres';
    if (control.errors?.['pattern']) {
      if (campo === 'nombre') return 'El nombre solo puede contener letras, números y espacios';
    }
    return '';
  }
}
