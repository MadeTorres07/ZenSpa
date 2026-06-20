import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Cita, ReporteServicio, ReporteTerapeuta } from '../models';

@Injectable({ providedIn: 'root' })
export class CitaService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/citas`;

  getAll(): Observable<Cita[]> { return this.http.get<Cita[]>(this.base + '/'); }

  getCitasFiltradas(filtros: any): Observable<Cita[]> {
    let params = new HttpParams();
    Object.entries(filtros).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        params = params.set(k, String(v));
      }
    });
    return this.http.get<Cita[]>(this.base + '/', { params });
  }

  getById(id: number): Observable<Cita> { return this.http.get<Cita>(`${this.base}/${id}`); }
  create(data: any): Observable<Cita> { return this.http.post<Cita>(this.base + '/', data); }
  update(id: number, data: any): Observable<Cita> { return this.http.put<Cita>(`${this.base}/${id}`, data); }
  delete(id: number): Observable<any> { return this.http.delete(`${this.base}/${id}`); }

  getReporteServicios(fecha_inicio?: string, fecha_fin?: string): Observable<ReporteServicio[]> {
    let params = new HttpParams();
    if (fecha_inicio) params = params.set('fecha_inicio', fecha_inicio);
    if (fecha_fin) params = params.set('fecha_fin', fecha_fin);
    return this.http.get<ReporteServicio[]>(`${this.base}/reportes/servicios-populares`, { params });
  }

  getReporteTerapeutas(fecha_inicio?: string, fecha_fin?: string): Observable<ReporteTerapeuta[]> {
    let params = new HttpParams();
    if (fecha_inicio) params = params.set('fecha_inicio', fecha_inicio);
    if (fecha_fin) params = params.set('fecha_fin', fecha_fin);
    return this.http.get<ReporteTerapeuta[]>(`${this.base}/reportes/ingresos-terapeutas`, { params });
  }
}
