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
class ClienteBase(BaseModel):
    telefono: str | None = None
    fecha_nacimiento: date | None = None
    historial_salud: str | None = None
    preferencias: str | None = None


class ClienteCreate(ClienteBase):
    usuario_id: int


class ClienteResponse(ClienteBase):
    id: int
    usuario_id: int
    created_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


# ──────────────────────────── Terapeuta ──────────────────────────
class TerapeutaBase(BaseModel):
    especialidad: str
    certificaciones: str | None = None
    activo: bool = True


class TerapeutaCreate(TerapeutaBase):
    usuario_id: int


class TerapeutaResponse(TerapeutaBase):
    id: int
    usuario_id: int

    model_config = ConfigDict(from_attributes=True)


# ──────────────────────────── Cabina ─────────────────────────────
class CabinaBase(BaseModel):
    nombre: str
    tipo_tratamiento: str
    estado: str = "disponible"
    equipamiento: str | None = None


class CabinaCreate(CabinaBase):
    pass


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
