import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Cabina } from '../models';

@Injectable({ providedIn: 'root' })
export class CabinaService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/cabinas`;

  getAll(): Observable<Cabina[]> { return this.http.get<Cabina[]>(this.base + '/'); }
  getById(id: number): Observable<Cabina> { return this.http.get<Cabina>(`${this.base}/${id}`); }
  create(data: any): Observable<Cabina> { return this.http.post<Cabina>(this.base + '/', data); }
  update(id: number, data: any): Observable<Cabina> { return this.http.put<Cabina>(`${this.base}/${id}`, data); }
  delete(id: number): Observable<any> { return this.http.delete(`${this.base}/${id}`); }
}
