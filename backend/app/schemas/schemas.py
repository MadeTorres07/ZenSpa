from datetime import date, datetime, time
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, EmailStr


# ──────────────────────────── Usuario ────────────────────────────
class UsuarioBase(BaseModel):
    nombre: str
    apellido: str
    email: EmailStr
    rol: str
    activo: bool = True


class UsuarioCreate(UsuarioBase):
    password: str


class UsuarioResponse(UsuarioBase):
    id: int
    created_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class UsuarioUpdate(BaseModel):
    nombre: str | None = None
    apellido: str | None = None
    email: EmailStr | None = None
    rol: str | None = None
    activo: bool | None = None


# ──────────────────────────── Cliente ────────────────────────────
class ClienteCreate(BaseModel):
    nombre: str
    apellido: str
    email: EmailStr
    password: str
    telefono: str | None = None
    fecha_nacimiento: date | None = None
    historial_salud: str | None = None
    preferencias: str | None = None


class ClienteUpdate(BaseModel):
    nombre: str | None = None
    apellido: str | None = None
    email: EmailStr | None = None
    password: str | None = None
    telefono: str | None = None
    fecha_nacimiento: date | None = None
    historial_salud: str | None = None
    preferencias: str | None = None


class ClienteResponse(BaseModel):
    id: int
    usuario_id: int
    nombre: str
    apellido: str
    email: EmailStr
    telefono: str | None = None
    fecha_nacimiento: date | None = None
    historial_salud: str | None = None
    preferencias: str | None = None
    created_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


# ──────────────────────────── Terapeuta ──────────────────────────
class TerapeutaCreate(BaseModel):
    nombre: str
    apellido: str
    email: EmailStr
    password: str
    especialidad: str
    certificaciones: str | None = None


class TerapeutaUpdate(BaseModel):
    nombre: str | None = None
    apellido: str | None = None
    email: EmailStr | None = None
    password: str | None = None
    especialidad: str | None = None
    certificaciones: str | None = None


class TerapeutaResponse(BaseModel):
    id: int
    usuario_id: int
    nombre: str
    apellido: str
    email: EmailStr
    especialidad: str
    certificaciones: str | None = None
    activo: bool = True

    model_config = ConfigDict(from_attributes=True)


# ──────────────────────────── Cabina ─────────────────────────────
class CabinaBase(BaseModel):
    nombre: str
    tipo_tratamiento: str
    estado: str = "disponible"
    equipamiento: str | None = None


class CabinaCreate(CabinaBase):
    pass


class CabinaUpdate(BaseModel):
    nombre: str | None = None
    tipo_tratamiento: str | None = None
    estado: str | None = None
    equipamiento: str | None = None


class CabinaResponse(CabinaBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# ──────────────────────────── Servicio ───────────────────────────
class ServicioBase(BaseModel):
    nombre: str
    duracion_minutos: int
    precio: Decimal
    tipo_terapia: str


class ServicioCreate(ServicioBase):
    pass


class ServicioUpdate(BaseModel):
    nombre: str | None = None
    duracion_minutos: int | None = None
    precio: Decimal | None = None
    tipo_terapia: str | None = None


class ServicioResponse(ServicioBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# ──────────────────────────── CabinaServicio ─────────────────────
class CabinaServicioBase(BaseModel):
    cabina_id: int
    servicio_id: int


class CabinaServicioCreate(CabinaServicioBase):
    pass


class CabinaServicioResponse(CabinaServicioBase):
    model_config = ConfigDict(from_attributes=True)


# ──────────────────────────── Producto ───────────────────────────
class ProductoBase(BaseModel):
    nombre: str
    stock: int = 0
    costo_unitario: Decimal
    stock_minimo: int = 5


class ProductoCreate(ProductoBase):
    pass


class ProductoUpdate(BaseModel):
    nombre: str | None = None
    stock: int | None = None
    costo_unitario: Decimal | None = None
    stock_minimo: int | None = None


class ProductoResponse(ProductoBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# ──────────────────────────── Cita ───────────────────────────────
class CitaBase(BaseModel):
    cliente_id: int
    terapeuta_id: int
    cabina_id: int
    fecha: date
    hora_inicio: time
    hora_fin: time
    estado: str = "pendiente"
    total: Decimal = Decimal("0.00")


class CitaCreate(CitaBase):
    pass


class CitaResponse(CitaBase):
    id: int
    created_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


# ──────────────────────────── CitaServicio ───────────────────────
class CitaServicioBase(BaseModel):
    cita_id: int
    servicio_id: int
    precio_aplicado: Decimal


class CitaServicioCreate(CitaServicioBase):
    pass


class CitaServicioResponse(CitaServicioBase):
    model_config = ConfigDict(from_attributes=True)


# ──────────────────────────── UsoProducto ────────────────────────
class UsoProductoBase(BaseModel):
    cita_id: int
    producto_id: int
    cantidad: int
    costo_aplicado: Decimal


class UsoProductoCreate(UsoProductoBase):
    pass


class UsoProductoResponse(UsoProductoBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
