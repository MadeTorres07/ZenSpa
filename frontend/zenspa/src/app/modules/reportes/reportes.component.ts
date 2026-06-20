import { Component, inject, signal, computed, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import Chart from 'chart.js/auto';
import { CitaService } from '../../core/services/cita.service';
import type { ReporteServicio, ReporteTerapeuta } from '../../core/models';

@Component({
  selector: 'app-reportes',
  standalone: true,
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.scss',
})
export class ReportesComponent implements OnInit, AfterViewInit, OnDestroy {
  private citaService = inject(CitaService);

  readonly currency = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });

  @ViewChild('barChartServicios') barChartServicios!: ElementRef<HTMLCanvasElement>;
  @ViewChild('barChartTerapeutas') barChartTerapeutas!: ElementRef<HTMLCanvasElement>;

  periodo = signal<'semana' | 'mes' | 'ano'>('mes');
  serviciosPopulares = signal<ReporteServicio[]>([]);
  ingresosTerapeutas = signal<ReporteTerapeuta[]>([]);
  cargando = signal(true);
  ultimaActualizacion = signal('');

  private chartServicios: Chart | null = null;
  private chartTerapeutas: Chart | null = null;
  private pollingTimer: ReturnType<typeof setInterval> | null = null;

  totalIngresos = computed(() =>
    this.ingresosTerapeutas().reduce((s, t) => s + t.ingresos_generados, 0)
  );
  citaPopular = computed(() => {
    const list = this.serviciosPopulares();
    return list.length ? list.reduce((a, b) => a.total_reservas > b.total_reservas ? a : b).nombre : '—';
  });
  terapeutaTop = computed(() => {
    const list = this.ingresosTerapeutas();
    return list.length
      ? list.reduce((a, b) => a.ingresos_generados > b.ingresos_generados ? a : b)
      : null;
  });
  terapeutaTopNombre = computed(() => {
    const t = this.terapeutaTop();
    return t ? `${t.nombre} ${t.apellido}` : '—';
  });

  private getDateRange(): { inicio: string; fin: string } {
    const hoy = new Date();
    const fin = hoy.toISOString().split('T')[0];
    let inicio: Date;
    switch (this.periodo()) {
      case 'semana':
        inicio = new Date(hoy);
        inicio.setDate(hoy.getDate() - hoy.getDay());
        break;
      case 'mes':
        inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        break;
      case 'ano':
        inicio = new Date(hoy.getFullYear(), 0, 1);
        break;
    }
    return { inicio: inicio.toISOString().split('T')[0], fin };
  }

  ngOnInit() {
    this.cargarReportes();
    this.pollingTimer = setInterval(() => this.cargarReportes(), 30000);
  }

  ngAfterViewInit() {
    setTimeout(() => this.renderCharts(), 100);
  }

  private cargarReportes() {
    const { inicio, fin } = this.getDateRange();
    this.cargando.set(true);
    this.citaService.getReporteServicios(inicio, fin).subscribe({
      next: (data) => {
        this.serviciosPopulares.set(data);
        this.ultimaActualizacion.set(new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        this.renderCharts();
      },
      error: () => this.cargando.set(false),
    });
    this.citaService.getReporteTerapeutas(inicio, fin).subscribe({
      next: (data) => {
        this.ingresosTerapeutas.set(data);
        this.ultimaActualizacion.set(new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        this.renderCharts();
      },
      error: () => {},
    });
  }

  private renderCharts() {
    if (typeof document === 'undefined') return;
    this.destroyCharts();

    const primary = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim() || '#C96A2B';

    const sv = this.serviciosPopulares();
    if (this.barChartServicios?.nativeElement && sv.length) {
      this.chartServicios = new Chart(this.barChartServicios.nativeElement, {
        type: 'bar',
        data: {
          labels: sv.map(s => s.nombre),
          datasets: [{
            label: 'Reservas',
            data: sv.map(s => s.total_reservas),
            backgroundColor: sv.map((_, i) => `rgba(201, 106, 43, ${0.3 + (i / sv.length) * 0.5})`),
            borderColor: primary,
            borderWidth: 1,
            borderRadius: 4,
          }],
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { beginAtZero: true, ticks: { stepSize: 1 } },
            y: { ticks: { font: { size: 11 } } },
          },
        },
      });
    }

    const tp = this.ingresosTerapeutas();
    if (this.barChartTerapeutas?.nativeElement && tp.length) {
      this.chartTerapeutas = new Chart(this.barChartTerapeutas.nativeElement, {
        type: 'bar',
        data: {
          labels: tp.map(t => `${t.nombre} ${t.apellido}`),
          datasets: [{
            label: 'Ingresos',
            data: tp.map(t => t.ingresos_generados),
            backgroundColor: tp.map((_, i) => `rgba(201, 106, 43, ${0.3 + (i / tp.length) * 0.5})`),
            borderColor: primary,
            borderWidth: 1,
            borderRadius: 4,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { callback: (v) => this.currency.format(Number(v)) },
            },
          },
        },
      });
    }

    this.cargando.set(false);
  }

  cambiarPeriodo(p: 'semana' | 'mes' | 'ano') {
    this.periodo.set(p);
    this.cargando.set(true);
    this.cargarReportes();
  }

  private destroyCharts() {
    this.chartServicios?.destroy();
    this.chartTerapeutas?.destroy();
    this.chartServicios = null;
    this.chartTerapeutas = null;
  }

  ngOnDestroy() {
    this.destroyCharts();
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
  }
}
