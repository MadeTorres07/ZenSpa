import { Component, signal, inject, computed } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

interface NavItem {
  label: string;
  route: string;
  roles: string[];
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  menuAbierto = signal(false);
  mobileMenuAbierto = signal(false);
  notificacionesCount = signal(0);

  private navItems: NavItem[] = [
    { label: 'Inicio', route: '/dashboard', roles: ['admin', 'recepcionista'] },
    { label: 'Agenda', route: '/agenda', roles: ['admin', 'recepcionista', 'terapeuta'] },
    { label: 'Clientes', route: '/clientes', roles: ['admin', 'recepcionista', 'terapeuta'] },
    { label: 'Terapeutas', route: '/terapeutas', roles: ['admin'] },
    { label: 'Servicios', route: '/servicios', roles: ['admin'] },
    { label: 'Inventario', route: '/inventario', roles: ['admin'] },
    { label: 'Reportes', route: '/reportes', roles: ['admin'] },
  ];

  itemsVisibles = computed(() =>
    this.navItems.filter((item) => this.authService.hasRole(...item.roles)),
  );

  get nombreUsuario(): string {
    return this.authService.getSession()?.nombre ?? '';
  }

  get rolUsuario(): string {
    const rol = this.authService.getSession()?.rol ?? '';
    return rol.charAt(0).toUpperCase() + rol.slice(1);
  }

  get iniciales(): string {
    return this.nombreUsuario.charAt(0).toUpperCase();
  }

  toggleMenu(): void {
    this.menuAbierto.update((v) => !v);
  }

  toggleMobileMenu(): void {
    this.mobileMenuAbierto.update((v) => !v);
  }

  logout(): void {
    this.menuAbierto.set(false);
    this.authService.logout();
  }
}