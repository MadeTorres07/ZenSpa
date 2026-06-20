import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TerapeutaService } from '../../core/services/terapeuta.service';
import { CitaService } from '../../core/services/cita.service';
import { AuthService } from '../../core/services/auth.service';
import type { Terapeuta, Cita } from '../../core/models';

@Component({
  selector: 'app-terapeutas',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './terapeutas.component.html',
  styleUrl: './terapeutas.component.scss',
})
export class TerapeutasComponent implements OnInit {
  private terapeutaService = inject(TerapeutaService);
  private citaService = inject(CitaService);
  private authService = inject(AuthService);

  readonly hoy = new Date();
  readonly hoyStr = this.hoy.toISOString().split('T')[0];

  terapeutas = signal<Terapeuta[]>([]);
  citasTodas = signal<Cita[]>([]);
  cargando = signal(true);
  searchTerm = signal('');
  terapeutaSeleccionado = signal<Terapeuta | null>(null);
  tabActivo = signal<'info' | 'disponibilidad' | 'rendimiento' | 'documentos'>('info');
  modalDesactivar = signal<Terapeuta | null>(null);

  filteredTerapeutas = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.terapeutas();
    return this.terapeutas().filter(t =>
      `${t.nombre} ${t.apellido}`.toLowerCase().includes(term) ||
      t.email?.toLowerCase().includes(term) ||
      t.especialidad?.toLowerCase().includes(term)
    );
  });

  // KPIs
  totalTerapeutas = computed(() => this.terapeutas().length);
  activos = computed(() => this.terapeutas().filter(t => t.activo).length);
  citasHoy = computed(() =>
    this.citasTodas().filter(c => c.fecha === this.hoyStr).length
  );

  // Week calculation
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

  confirmarDesactivar(t: Terapeuta) { this.modalDesactivar.set(t); }
  cerrarModal() { this.modalDesactivar.set(null); }

  desactivarTerapeuta() {
    const t = this.modalDesactivar();
    if (!t) return;
    this.terapeutaService.delete(t.id).subscribe({
      next: () => {
        this.terapeutas.update(list => list.map(x => x.id === t.id ? { ...x, activo: false } : x));
        if (this.terapeutaSeleccionado()?.id === t.id) this.terapeutaSeleccionado.set({ ...t, activo: false });
        this.cerrarModal();
      },
      error: () => this.cerrarModal(),
    });
  }

  getInitiales(nombre: string): string {
    const partes = nombre.trim().split(/\s+/);
    return partes.map(p => p[0]).join('').toUpperCase().slice(0, 2);
  }

  certificacionesLista(certs: string): string[] {
    return certs?.split(/[.\n]+/).filter(c => c.trim()).map(c => c.trim()) || [];
  }
}
