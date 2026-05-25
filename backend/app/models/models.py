from datetime import date, datetime, time

from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    Enum,
    DateTime,
    Date,
    Time,
    Text,
    DECIMAL,
    ForeignKey,
    UniqueConstraint,
    PrimaryKeyConstraint,
    Index,
)
from sqlalchemy.orm import relationship

from app.core.database import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(100), nullable=False)
    apellido = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    rol = Column(
        Enum("admin", "recepcionista", "terapeuta", "cliente"), nullable=False
    )
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    cliente = relationship("Cliente", back_populates="usuario", uselist=False)
    terapeuta = relationship("Terapeuta", back_populates="usuario", uselist=False)


class Cliente(Base):
    __tablename__ = "clientes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    usuario_id = Column(
        Integer, ForeignKey("usuarios.id", ondelete="RESTRICT"), unique=True, nullable=False
    )
    telefono = Column(String(20))
    fecha_nacimiento = Column(Date)
    historial_salud = Column(Text)
    preferencias = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    usuario = relationship("Usuario", back_populates="cliente")
    citas = relationship("Cita", back_populates="cliente")


class Terapeuta(Base):
    __tablename__ = "terapeutas"

    id = Column(Integer, primary_key=True, autoincrement=True)
    usuario_id = Column(
        Integer, ForeignKey("usuarios.id", ondelete="RESTRICT"), unique=True, nullable=False
    )
    especialidad = Column(String(100), nullable=False)
    certificaciones = Column(Text)
    activo = Column(Boolean, default=True)

    usuario = relationship("Usuario", back_populates="terapeuta")
    citas = relationship("Cita", back_populates="terapeuta")


class Cabina(Base):
    __tablename__ = "cabinas"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(100), nullable=False)
    tipo_tratamiento = Column(
        Enum("masajes", "facial", "hidroterapia", "aromaterapia", "multiple"),
        nullable=False,
    )
    estado = Column(
        Enum("disponible", "ocupada", "mantenimiento"), default="disponible"
    )
    equipamiento = Column(Text)

    citas = relationship("Cita", back_populates="cabina")
    cabina_servicios = relationship("CabinaServicio", back_populates="cabina")


class Servicio(Base):
    __tablename__ = "servicios"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(100), nullable=False)
    duracion_minutos = Column(Integer, nullable=False)
    precio = Column(DECIMAL(10, 2), nullable=False)
    tipo_terapia = Column(
        Enum("masajes", "facial", "hidroterapia", "aromaterapia", "multiple"),
        nullable=False,
    )

    cabina_servicios = relationship("CabinaServicio", back_populates="servicio")
    cita_servicios = relationship("CitaServicio", back_populates="servicio")


class CabinaServicio(Base):
    __tablename__ = "cabina_servicios"

    cabina_id = Column(
        Integer, ForeignKey("cabinas.id", ondelete="CASCADE"), nullable=False
    )
    servicio_id = Column(
        Integer, ForeignKey("servicios.id", ondelete="CASCADE"), nullable=False
    )

    __table_args__ = (
        PrimaryKeyConstraint("cabina_id", "servicio_id"),
    )

    cabina = relationship("Cabina", back_populates="cabina_servicios")
    servicio = relationship("Servicio", back_populates="cabina_servicios")


class Producto(Base):
    __tablename__ = "productos"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(100), nullable=False)
    stock = Column(Integer, default=0)
    costo_unitario = Column(DECIMAL(10, 2), nullable=False)
    stock_minimo = Column(Integer, default=5)

    uso_productos = relationship("UsoProducto", back_populates="producto")


class Cita(Base):
    __tablename__ = "citas"

    id = Column(Integer, primary_key=True, autoincrement=True)
    cliente_id = Column(
        Integer, ForeignKey("clientes.id", ondelete="RESTRICT"), nullable=False
    )
    terapeuta_id = Column(
        Integer, ForeignKey("terapeutas.id", ondelete="RESTRICT"), nullable=False
    )
    cabina_id = Column(
        Integer, ForeignKey("cabinas.id", ondelete="RESTRICT"), nullable=False
    )
    fecha = Column(Date, nullable=False)
    hora_inicio = Column(Time, nullable=False)
    hora_fin = Column(Time, nullable=False)
    estado = Column(
        Enum("pendiente", "confirmada", "completada", "cancelada", "cancelada_penalidad"),
        default="pendiente",
    )
    total = Column(DECIMAL(10, 2), default=0.00)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("idx_citas_fecha_hora", "fecha", "hora_inicio"),
        Index("idx_citas_terapeuta", "terapeuta_id"),
        Index("idx_citas_cabina", "cabina_id"),
    )

    cliente = relationship("Cliente", back_populates="citas")
    terapeuta = relationship("Terapeuta", back_populates="citas")
    cabina = relationship("Cabina", back_populates="citas")
    cita_servicios = relationship("CitaServicio", back_populates="cita")
    uso_productos = relationship("UsoProducto", back_populates="cita")


class CitaServicio(Base):
    __tablename__ = "cita_servicios"

    cita_id = Column(
        Integer, ForeignKey("citas.id", ondelete="CASCADE"), nullable=False
    )
    servicio_id = Column(
        Integer, ForeignKey("servicios.id", ondelete="RESTRICT"), nullable=False
    )
    precio_aplicado = Column(DECIMAL(10, 2), nullable=False)

    __table_args__ = (
        PrimaryKeyConstraint("cita_id", "servicio_id"),
    )

    cita = relationship("Cita", back_populates="cita_servicios")
    servicio = relationship("Servicio", back_populates="cita_servicios")


class UsoProducto(Base):
    __tablename__ = "uso_productos"

    id = Column(Integer, primary_key=True, autoincrement=True)
    cita_id = Column(
        Integer, ForeignKey("citas.id", ondelete="RESTRICT"), nullable=False
    )
    producto_id = Column(
        Integer, ForeignKey("productos.id", ondelete="RESTRICT"), nullable=False
    )
    cantidad = Column(Integer, nullable=False)
    costo_aplicado = Column(DECIMAL(10, 2), nullable=False)

    cita = relationship("Cita", back_populates="uso_productos")
    producto = relationship("Producto", back_populates="uso_productos")
