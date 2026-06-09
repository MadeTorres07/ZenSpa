import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { LoginComponent } from './modules/auth/login/login.component';
import { DashboardComponent } from './modules/dashboard/dashboard.component';
import { AgendaComponent } from './modules/agenda/agenda.component';
import { ClientesComponent } from './modules/clientes/clientes.component';
import { TerapeutasComponent } from './modules/terapeutas/terapeutas.component';
import { ServiciosComponent } from './modules/servicios/servicios.component';
import { CabinasComponent } from './modules/cabinas/cabinas.component';
import { InventarioComponent } from './modules/inventario/inventario.component';
import { ReportesComponent } from './modules/reportes/reportes.component';
import { SinPermisoComponent } from './modules/reportes/sin-permiso.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent, canActivate: [roleGuard], data: { roles: ['admin', 'recepcionista'] } },
      { path: 'agenda', component: AgendaComponent, canActivate: [roleGuard], data: { roles: ['admin', 'recepcionista', 'terapeuta'] } },
      { path: 'clientes', component: ClientesComponent, canActivate: [roleGuard], data: { roles: ['admin', 'recepcionista', 'terapeuta'] } },
      { path: 'terapeutas', component: TerapeutasComponent, canActivate: [roleGuard], data: { roles: ['admin'] } },
      { path: 'servicios', component: ServiciosComponent, canActivate: [roleGuard], data: { roles: ['admin'] } },
      { path: 'cabinas', component: CabinasComponent, canActivate: [roleGuard], data: { roles: ['admin', 'recepcionista'] } },
      { path: 'inventario', component: InventarioComponent, canActivate: [roleGuard], data: { roles: ['admin'] } },
      { path: 'reportes', component: ReportesComponent, canActivate: [roleGuard], data: { roles: ['admin'] } },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  { path: 'sin-permiso', component: SinPermisoComponent },
  { path: '**', redirectTo: 'login' },
];
