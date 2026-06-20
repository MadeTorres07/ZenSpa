import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductoService } from '../../core/services/producto.service';
import type { Producto } from '../../core/models';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [RouterLink, FormsModule],
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
  tabActivo = signal<'info' | 'stock' | 'proveedores'>('info');
  modalEliminar = signal<Producto | null>(null);
  modalAjuste = signal<Producto | null>(null);
  ajusteCantidad = signal<number>(0);
  ajusteTipo = signal<'entrada' | 'salida'>('entrada');
  ajusteCargando = signal(false);

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

  ngOnInit() {
    this.productoService.getAll().subscribe({
      next: (data) => { this.productos.set(data); this.cargando.set(false); },
      error: () => this.cargando.set(false),
    });
  }

  seleccionar(p: Producto) { this.productoSeleccionado.set(p); this.tabActivo.set('info'); }
  cerrarPanel() { this.productoSeleccionado.set(null); }

  confirmarEliminar(p: Producto) { this.modalEliminar.set(p); }
  cerrarModal() { this.modalEliminar.set(null); }

  eliminar() {
    const p = this.modalEliminar();
    if (!p) return;
    this.productoService.delete(p.id).subscribe({
      next: () => {
        this.productos.update(list => list.filter(x => x.id !== p.id));
        if (this.productoSeleccionado()?.id === p.id) this.cerrarPanel();
        this.cerrarModal();
      },
      error: () => this.cerrarModal(),
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
