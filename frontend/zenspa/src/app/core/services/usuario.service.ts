import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Usuario } from '../models';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/usuarios`;

  getAll(rol?: string): Observable<Usuario[]> {
    let params = new HttpParams();
    if (rol) { params = params.set('rol', rol); }
    return this.http.get<Usuario[]>(this.base + '/', { params });
  }
}
