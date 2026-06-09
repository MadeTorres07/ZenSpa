import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Servicio } from '../models';

@Injectable({ providedIn: 'root' })
export class ServicioService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/servicios`;

  getAll(): Observable<Servicio[]> { return this.http.get<Servicio[]>(this.base + '/'); }
  getById(id: number): Observable<Servicio> { return this.http.get<Servicio>(`${this.base}/${id}`); }
  create(data: any): Observable<Servicio> { return this.http.post<Servicio>(this.base + '/', data); }
  update(id: number, data: any): Observable<Servicio> { return this.http.put<Servicio>(`${this.base}/${id}`, data); }
  delete(id: number): Observable<any> { return this.http.delete(`${this.base}/${id}`); }
}
