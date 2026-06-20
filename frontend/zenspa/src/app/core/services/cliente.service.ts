import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Cliente } from '../models';

export interface ClienteResumen {
  total_visitas: number;
  gasto_total: number;
  ultima_visita: string | null;
}

@Injectable({ providedIn: 'root' })
export class ClienteService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/clientes`;

  getAll(): Observable<Cliente[]> { return this.http.get<Cliente[]>(this.base + '/'); }
  getById(id: number): Observable<Cliente> { return this.http.get<Cliente>(`${this.base}/${id}`); }
  create(data: any): Observable<Cliente> { return this.http.post<Cliente>(this.base + '/', data); }
  update(id: number, data: any): Observable<Cliente> { return this.http.put<Cliente>(`${this.base}/${id}`, data); }
  delete(id: number): Observable<any> { return this.http.delete(`${this.base}/${id}`); }
  getResumen(id: number): Observable<ClienteResumen> {
    return this.http.get<ClienteResumen>(`${this.base}/${id}/resumen`);
  }
}
