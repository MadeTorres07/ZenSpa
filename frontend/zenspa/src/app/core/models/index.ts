export interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: string;
  activo: boolean;
  created_at?: string;
}

export interface Cliente {
  id: number;
  usuario_id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  fecha_nacimiento: string;
  historial_salud: string | null;
  preferencias: string;
  activo?: boolean;
  created_at?: string;
}

export interface Terapeuta {
  id: number;
  usuario_id: number;
  nombre: string;
  apellido: string;
  email: string;
  especialidad: string;
  certificaciones: string;
  activo: boolean;
}

export interface Cabina {
  id: number;
  nombre: string;
  tipo_tratamiento: string;
  estado: string;
  equipamiento: string;
}

export interface Servicio {
  id: number;
  nombre: string;
  duracion_minutos: number;
  precio: number;
  tipo_terapia: string;
  descripcion?: string;
  beneficios?: string;
  incluye?: string;
  recomendaciones?: string;
  contraindicaciones?: string;
  cabinas_ids?: number[];
}

export interface Producto {
  id: number;
  nombre: string;
  stock: number;
  costo_unitario: number;
  stock_minimo: number;
}

export interface Cita {
  id: number;
  cliente_id: number;
  terapeuta_id: number;
  cabina_id: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  estado: string;
  total: number;
  nombre_cliente: string;
  nombre_terapeuta: string;
  nombre_cabina: string;
  servicios: Servicio[];
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  rol: string;
  nombre: string;
}

export interface ReporteServicio {
  servicio_id: number;
  nombre: string;
  total_reservas: number;
  ingresos_generados: number;
}

export interface ReporteTerapeuta {
  terapeuta_id: number;
  nombre: string;
  apellido: string;
  total_citas_completadas: number;
  ingresos_generados: number;
}
