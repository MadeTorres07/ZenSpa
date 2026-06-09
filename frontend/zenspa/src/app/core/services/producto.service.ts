import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Producto } from '../models';

@Injectable({ providedIn: 'root' })
export class ProductoService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/productos`;

  getAll(): Observable<Producto[]> { return this.http.get<Producto[]>(this.base + '/'); }
  getById(id: number): Observable<Producto> { return this.http.get<Producto>(`${this.base}/${id}`); }
  create(data: any): Observable<Producto> { return this.http.post<Producto>(this.base + '/', data); }
  update(id: number, data: any): Observable<Producto> { return this.http.put<Producto>(`${this.base}/${id}`, data); }
  delete(id: number): Observable<any> { return this.http.delete(`${this.base}/${id}`); }
}
