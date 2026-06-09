import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Terapeuta } from '../models';

@Injectable({ providedIn: 'root' })
export class TerapeutaService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/terapeutas`;

  getAll(): Observable<Terapeuta[]> { return this.http.get<Terapeuta[]>(this.base + '/'); }
  getById(id: number): Observable<Terapeuta> { return this.http.get<Terapeuta>(`${this.base}/${id}`); }
  create(data: any): Observable<Terapeuta> { return this.http.post<Terapeuta>(this.base + '/', data); }
  update(id: number, data: any): Observable<Terapeuta> { return this.http.put<Terapeuta>(`${this.base}/${id}`, data); }
  delete(id: number): Observable<any> { return this.http.delete(`${this.base}/${id}`); }
}
