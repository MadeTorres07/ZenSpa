import re
from datetime import date, datetime, time
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, EmailStr, field_validator


def _validar_nombre_apellido(v: str) -> str:
    v = v.strip()
    if not v:
        raise ValueError("Este campo no puede estar vacío")
    if len(v) < 2 or len(v) > 100:
        raise ValueError("Debe tener entre 2 y 100 caracteres")
    if not re.match(r'^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$', v):
        raise ValueError("Solo se permiten letras y espacios")
    return v.title()


def _validar_password(v: str) -> str:
    if len(v) < 8:
        raise ValueError("Debe tener al menos 8 caracteres")
    if not re.search(r'[A-Z]', v):
        raise ValueError("Debe contener al menos una mayúscula")
    if not re.search(r'\d', v):
        raise ValueError("Debe contener al menos un número")
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
        raise ValueError("Debe contener al menos un carácter especial")
    return v


# ──────────────────────────── Usuario ────────────────────────────
class UsuarioBase(BaseModel):
    nombre: str
    apellido: str
    email: EmailStr
    rol: str
    activo: bool = True


class UsuarioCreate(UsuarioBase):
    password: str

    @field_validator("nombre")
    @classmethod
    def validar_nombre(cls, v: str) -> str:
        return _validar_nombre_apellido(v)

    @field_validator("apellido")
    @classmethod
    def validar_apellido(cls, v: str) -> str:
        return _validar_nombre_apellido(v)

    @field_validator("password")
    @classmethod
    def validar_password(cls, v: str) -> str:
        return _validar_password(v)


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

    @field_validator("nombre")
    @classmethod
    def validar_nombre(cls, v: str) -> str:
        return _validar_nombre_apellido(v)

    @field_validator("apellido")
    @classmethod
    def validar_apellido(cls, v: str) -> str:
        return _validar_nombre_apellido(v)

    @field_validator("password")
    @classmethod
    def validar_password(cls, v: str) -> str:
        return _validar_password(v)

    @field_validator("telefono")
    @classmethod
    def validar_telefono(cls, v: str | None) -> str | None:
        if v is None or v.strip() == "":
            return None
        limpio = v.strip()
        if not re.match(r'^[\d\s\+\-\(\)]{7,20}$', limpio):
            raise ValueError("Formato de teléfono inválido")
        return limpio


class ClienteUpdate(BaseModel):
    nombre: str | None = None
    apellido: str | None = None
    email: EmailStr | None = None
    password: str | None = None
    telefono: str | None = None
    fecha_nacimiento: date | None = None
    historial_salud: str | None = None
    preferencias: str | None = None

    @field_validator("telefono")
    @classmethod
    def validar_telefono(cls, v: str | None) -> str | None:
        if v is None or v.strip() == "":
            return None
        limpio = v.strip()
        if not re.match(r'^[\d\s\+\-\(\)]{7,20}$', limpio):
            raise ValueError("Formato de teléfono inválido")
        return limpio


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

    @field_validator("nombre")
    @classmethod
    def validar_nombre(cls, v: str) -> str:
        return _validar_nombre_apellido(v)

    @field_validator("apellido")
    @classmethod
    def validar_apellido(cls, v: str) -> str:
        return _validar_nombre_apellido(v)

    @field_validator("password")
    @classmethod
    def validar_password(cls, v: str) -> str:
        return _validar_password(v)


class TerapeutaUpdate(BaseModel):
    nombre: str | None = None
    apellido: str | None = None
    email: EmailStr | None = None
    password: str | None = None
    especialidad: str | None = None
    certificaciones: str | None = None

    @field_validator("nombre")
    @classmethod
    def validar_nombre(cls, v: str | None) -> str | None:
        if v is None:
            return None
        return _validar_nombre_apellido(v)

    @field_validator("apellido")
    @classmethod
    def validar_apellido(cls, v: str | None) -> str | None:
        if v is None:
            return None
        return _validar_nombre_apellido(v)


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
    descripcion: str | None = None
    beneficios: str | None = None
    incluye: str | None = None
    recomendaciones: str | None = None
    contraindicaciones: str | None = None


class ServicioCreate(ServicioBase):
    cabinas_ids: list[int] = []

    @field_validator("nombre")
    @classmethod
    def validar_nombre(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("El nombre no puede estar vacío")
        if len(v) < 2 or len(v) > 100:
            raise ValueError("El nombre debe tener entre 2 y 100 caracteres")
        return v

    @field_validator("duracion_minutos")
    @classmethod
    def validar_duracion(cls, v: int) -> int:
        if v < 30 or v > 120:
            raise ValueError("La duración debe estar entre 30 y 120 minutos")
        return v

    @field_validator("precio")
    @classmethod
    def validar_precio(cls, v: Decimal) -> Decimal:
        if v < 10000:
            raise ValueError("El precio mínimo es $10.000")
        return v


class ServicioUpdate(BaseModel):
    nombre: str | None = None
    duracion_minutos: int | None = None
    precio: Decimal | None = None
    tipo_terapia: str | None = None
    descripcion: str | None = None
    beneficios: str | None = None
    incluye: str | None = None
    recomendaciones: str | None = None
    contraindicaciones: str | None = None
    cabinas_ids: list[int] | None = None

    @field_validator("nombre")
    @classmethod
    def validar_nombre(cls, v: str | None) -> str | None:
        if v is None:
            return None
        v = v.strip()
        if not v:
            raise ValueError("El nombre no puede estar vacío")
        if len(v) < 2 or len(v) > 100:
            raise ValueError("El nombre debe tener entre 2 y 100 caracteres")
        return v

    @field_validator("duracion_minutos")
    @classmethod
    def validar_duracion(cls, v: int | None) -> int | None:
        if v is None:
            return None
        if v < 30 or v > 120:
            raise ValueError("La duración debe estar entre 30 y 120 minutos")
        return v

    @field_validator("precio")
    @classmethod
    def validar_precio(cls, v: Decimal | None) -> Decimal | None:
        if v is None:
            return None
        if v < 10000:
            raise ValueError("El precio mínimo es $10.000")
        return v


class ServicioResponse(ServicioBase):
    id: int
    cabinas_ids: list[int] = []

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
class ProductoUso(BaseModel):
    producto_id: int
    cantidad: int

    @field_validator("cantidad")
    @classmethod
    def cantidad_mayor_que_cero(cls, v: int) -> int:
        if v < 1:
            raise ValueError("La cantidad debe ser mayor o igual a 1")
        return v


class ClienteResumen(BaseModel):
    total_visitas: int
    gasto_total: float
    ultima_visita: date | None = None


class CitaCreate(BaseModel):
    cliente_id: int
    terapeuta_id: int
    cabina_id: int
    fecha: date
    hora_inicio: time
    hora_fin: time
    servicios: list[int]
    productos: list[ProductoUso] = []


class CitaUpdate(BaseModel):
    estado: str | None = None
    terapeuta_id: int | None = None
    cabina_id: int | None = None
    hora_inicio: time | None = None
    hora_fin: time | None = None


class CitaResponse(BaseModel):
    id: int
    cliente_id: int
    terapeuta_id: int
    cabina_id: int
    fecha: date
    hora_inicio: time
    hora_fin: time
    estado: str
    total: Decimal
    created_at: datetime | None = None
    nombre_cliente: str
    nombre_terapeuta: str
    nombre_cabina: str
    servicios: list[ServicioResponse]

    model_config = ConfigDict(from_attributes=True)


class ReporteCitasFilter(BaseModel):
    terapeuta_id: int | None = None
    tipo_terapia: str | None = None
    fecha_inicio: date | None = None
    fecha_fin: date | None = None
    estado: str | None = None


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
