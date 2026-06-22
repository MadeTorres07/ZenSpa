import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProductoService } from '../../core/services/producto.service';
import type { Producto } from '../../core/models';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './inventario.component.html',
  styleUrl: './inventario.component.scss',
})
export class InventarioComponent implements OnInit {
  private productoService = inject(ProductoService);

  readonly currency = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });

  productos = signal<Producto[]>([]);
  cargando = signal(true);
  searchTerm = signal('');
  filtroEstado = signal<string>('todos');
  productoSeleccionado = signal<Producto | null>(null);
  tabActivo = signal<'info' | 'stock'>('info');
  modalEliminar = signal<Producto | null>(null);
  modalAjuste = signal<Producto | null>(null);
  ajusteCantidad = signal<number>(0);
  ajusteTipo = signal<'entrada' | 'salida'>('entrada');
  ajusteCargando = signal(false);
  mensaje = signal('');
  mensajeError = signal(false);
  modalFormulario = signal<{ abierto: boolean; editando: boolean; producto: Producto | null }>({ abierto: false, editando: false, producto: null });
  formData = signal<Partial<Producto>>({});
  guardando = signal(false);

  // Filtros
  filtered = computed(() => {
    let list = this.productos();
    const term = this.searchTerm().toLowerCase().trim();
    if (term) list = list.filter(p => p.nombre.toLowerCase().includes(term));
    const estado = this.filtroEstado();
    if (estado !== 'todos') {
      list = list.filter(p => this.estadoProducto(p) === estado);
    }
    return list;
  });

  // KPIs
  total = computed(() => this.productos().length);
  stockTotal = computed(() => this.productos().reduce((s, p) => s + p.stock, 0));
  bajoStock = computed(() => this.productos().filter(p => p.stock <= p.stock_minimo).length);
  valorInventario = computed(() => this.productos().reduce((s, p) => s + p.stock * p.costo_unitario, 0));

  estadoProducto(p: Producto): string {
    if (p.stock === 0) return 'critico';
    if (p.stock <= p.stock_minimo) return 'bajo';
    return 'ok';
  }

  private readonly TEXT_PATTERN = /^[a-zA-ZÀ-ÿ\u00f1\u00d10-9\s]+$/;

  campoError(campo: string): string | null {
    const fd = this.formData();
    const val = (fd as any)[campo];
    if (campo === 'nombre') {
      if (!val || String(val).trim() === '') return 'El nombre del producto es obligatorio';
      const v = String(val).trim();
      if (v.length < 2) return 'El nombre debe tener al menos 2 caracteres';
      if (v.length > 100) return 'El nombre debe tener máximo 100 caracteres';
      if (!this.TEXT_PATTERN.test(v)) return 'El nombre solo puede contener letras, números y espacios';
    }
    if (campo === 'proveedor') {
      if (val && String(val).trim().length > 0) {
        const v = String(val).trim();
        if (!this.TEXT_PATTERN.test(v)) return 'El proveedor solo puede contener letras, números y espacios';
        if (v.length > 100) return 'El proveedor debe tener máximo 100 caracteres';
      }
    }
    if (campo === 'costo_unitario') {
      if (val === undefined || val === null || val === '') return 'El costo unitario es obligatorio';
      const n = Number(val);
      if (isNaN(n) || !isFinite(n)) return 'Ingresa un número válido para el costo unitario';
      if (n < 5000) return 'El costo unitario mínimo es $5.000';
      if (n > 5000000) return 'El costo unitario no puede superar los $5.000.000';
    }
    if (campo === 'stock' && val !== undefined && val !== null && val !== '') {
      const n = Number(val);
      if (!isFinite(n)) return 'El valor ingresado es demasiado grande';
      if (isNaN(n) || n < 0) return 'El stock no puede ser negativo';
      if (n % 1 !== 0) return 'El stock debe ser un número entero, sin decimales';
    }
    if (campo === 'stock_minimo' && val !== undefined && val !== null && val !== '') {
      const n = Number(val);
      if (!isFinite(n)) return 'El valor ingresado es demasiado grande';
      if (isNaN(n) || n < 0) return 'El stock mínimo no puede ser negativo';
      if (n % 1 !== 0) return 'El stock mínimo debe ser un número entero, sin decimales';
    }
    return null;
  }

  ngOnInit() {
    this.cargarProductos();
  }

  cargarProductos() {
    this.productoService.getAll().subscribe({
      next: (data) => { this.productos.set(data); this.cargando.set(false); },
      error: () => this.cargando.set(false),
    });
  }

  seleccionar(p: Producto) { this.productoSeleccionado.set(p); this.tabActivo.set('info'); }
  cerrarPanel() { this.productoSeleccionado.set(null); }

  abrirCrear() {
    this.formData.set({ nombre: '', stock: 0, costo_unitario: null as any, stock_minimo: 5, descripcion: '', presentacion: '', uso_recomendado: '', fecha_vencimiento: '', proveedor: '' });
    this.mensaje.set(''); this.mensajeError.set(false);
    this.modalFormulario.set({ abierto: true, editando: false, producto: null });
  }

  abrirEditar(p: Producto) {
    this.formData.set({ ...p });
    this.mensaje.set(''); this.mensajeError.set(false);
    this.modalFormulario.set({ abierto: true, editando: true, producto: p });
  }

  updateFormField(field: string, value: any) {
    this.formData.update(fd => ({ ...fd, [field]: value }));
  }

  cerrarFormulario() {
    this.modalFormulario.set({ abierto: false, editando: false, producto: null });
    this.mensaje.set(''); this.mensajeError.set(false);
  }

  _extraerMensajeError(err: any): string {
    const detalle = err.error?.detail;
    if (typeof detalle === 'string') {
      if (detalle.includes('Decimal input')) return 'El costo unitario no es válido';
      if (detalle.includes('Input should be a valid integer')) return 'Este campo debe ser un número entero, sin decimales';
      if (detalle.includes('exceeded maximum size')) return 'El valor ingresado es demasiado grande';
      if (detalle.includes('too large')) return 'El valor ingresado es demasiado grande';
      return detalle;
    }
    if (Array.isArray(detalle)) {
      const traducidos = detalle.map((e: any) => {
        let msg = e.msg?.replace('Value error, ', '') || e;
        if (typeof msg === 'string' && msg.includes('Decimal input')) return 'El costo unitario no es válido';
        if (typeof msg === 'string' && msg.includes('Input should be a valid integer')) return 'Este campo debe ser un número entero, sin decimales';
        if (typeof msg === 'string' && msg.includes('exceeded maximum size')) return 'El valor ingresado es demasiado grande';
        if (typeof msg === 'string' && msg.includes('too large')) return 'El valor ingresado es demasiado grande';
        return msg;
      });
      return traducidos.join('. ');
    }
    return 'Error al guardar el producto. Verifica los campos.';
  }

  guardarProducto() {
    const fd = this.formData();
    const errorNombre = this.campoError('nombre');
    const errorCosto = this.campoError('costo_unitario');
    const errorProv = this.campoError('proveedor');
    const errorStock = this.campoError('stock');
    const errorStockMin = this.campoError('stock_minimo');
    if (errorNombre || errorCosto || errorProv || errorStock || errorStockMin) {
      this.mensajeError.set(true);
      this.mensaje.set(errorNombre || errorCosto || errorProv || errorStock || errorStockMin || 'Completa los campos requeridos');
      setTimeout(() => { this.mensaje.set(''); this.mensajeError.set(false); }, 4000);
      return;
    }
    this.guardando.set(true);
    this.mensaje.set(''); this.mensajeError.set(false);
    const m = this.modalFormulario();
    const payload: any = {
      nombre: String(fd.nombre ?? '').trim(),
      costo_unitario: Number(fd.costo_unitario) || 0,
      stock: Number(fd.stock) || 0,
      stock_minimo: Number(fd.stock_minimo) || 5,
      descripcion: fd.descripcion || null,
      presentacion: fd.presentacion || null,
      uso_recomendado: fd.uso_recomendado || null,
      fecha_vencimiento: fd.fecha_vencimiento || null,
      proveedor: fd.proveedor || null,
    };

    if (m.editando && m.producto) {
      this.productoService.update(m.producto.id, payload).subscribe({
        next: (res: any) => {
          this.productos.update(list => list.map(x => x.id === m.producto!.id ? { ...x, ...res } : x));
          this.productoSeleccionado.update(v => v?.id === m.producto!.id ? { ...v, ...res } : v);
          this.mensaje.set('Producto actualizado correctamente'); this.mensajeError.set(false);
          setTimeout(() => { this.mensaje.set(''); this.mensajeError.set(false); }, 3000);
          this.guardando.set(false);
          this.cerrarFormulario();
        },
        error: (err) => {
          this.guardando.set(false);
          this.mensaje.set(this._extraerMensajeError(err)); this.mensajeError.set(true);
          setTimeout(() => { this.mensaje.set(''); this.mensajeError.set(false); }, 4000);
        },
      });
    } else {
      this.productoService.create(payload).subscribe({
        next: (res: any) => {
          this.productos.update(list => [...list, res]);
          this.mensaje.set('Producto creado correctamente'); this.mensajeError.set(false);
          setTimeout(() => { this.mensaje.set(''); this.mensajeError.set(false); }, 3000);
          this.guardando.set(false);
          this.cerrarFormulario();
        },
        error: (err) => {
          this.guardando.set(false);
          this.mensaje.set(this._extraerMensajeError(err)); this.mensajeError.set(true);
          setTimeout(() => { this.mensaje.set(''); this.mensajeError.set(false); }, 4000);
        },
      });
    }
  }

  confirmarEliminar(p: Producto) {
    this.mensaje.set(''); this.mensajeError.set(false);
    this.modalEliminar.set(p);
  }
  cerrarModalEliminar() {
    this.modalEliminar.set(null);
    this.mensaje.set(''); this.mensajeError.set(false);
  }

  eliminar() {
    const p = this.modalEliminar();
    if (!p) return;
    this.productoService.delete(p.id).subscribe({
      next: () => {
        this.productos.update(list => list.filter(x => x.id !== p.id));
        if (this.productoSeleccionado()?.id === p.id) this.cerrarPanel();
        this.cerrarModalEliminar();
        this.mensaje.set('Producto eliminado correctamente'); this.mensajeError.set(false);
        setTimeout(() => { this.mensaje.set(''); this.mensajeError.set(false); }, 3000);
      },
      error: (err) => {
        const detalle = err.error?.detail;
        this.mensaje.set(detalle || 'Error al eliminar el producto'); this.mensajeError.set(true);
        setTimeout(() => { this.mensaje.set(''); this.mensajeError.set(false); }, 3000);
        this.cerrarModalEliminar();
      },
    });
  }

  abrirAjuste(p: Producto) {
    this.modalAjuste.set(p);
    this.ajusteCantidad.set(0);
    this.ajusteTipo.set('entrada');
  }
  cerrarAjuste() { this.modalAjuste.set(null); }

  ajustarStock() {
    const p = this.modalAjuste();
    if (!p || this.ajusteCantidad() <= 0) return;
    this.ajusteCargando.set(true);
    const delta = this.ajusteTipo() === 'entrada' ? this.ajusteCantidad() : -this.ajusteCantidad();
    const nuevoStock = Math.max(0, p.stock + delta);
    this.productoService.update(p.id, { stock: nuevoStock }).subscribe({
      next: (res: any) => {
        this.productos.update(list => list.map(x => x.id === p.id ? { ...x, stock: res.stock ?? nuevoStock } : x));
        this.productoSeleccionado.update(v => v?.id === p.id ? { ...v, stock: res.stock ?? nuevoStock } : v);
        this.ajusteCargando.set(false);
        this.cerrarAjuste();
      },
      error: () => this.ajusteCargando.set(false),
    });
  }
}
