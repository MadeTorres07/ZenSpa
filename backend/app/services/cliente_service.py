from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.models import Cliente, Usuario, Cita
from app.schemas.schemas import ClienteCreate, ClienteUpdate


def get_all(
    db: Session,
    include_historial: bool = True,
) -> list[dict]:
    clientes = db.query(Cliente).all()
    resultado = []
    for c in clientes:
        data = _cliente_to_dict(c, include_historial)
        resultado.append(data)
    return resultado


def get_by_id(
    db: Session,
    cliente_id: int,
    include_historial: bool = True,
) -> dict | None:
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not cliente:
        return None
    return _cliente_to_dict(cliente, include_historial)


def _cliente_to_dict(cliente: Cliente, include_historial: bool = True) -> dict:
    historial = cliente.historial_salud if include_historial else None
    return {
        "id": cliente.id,
        "usuario_id": cliente.usuario_id,
        "nombre": cliente.usuario.nombre,
        "apellido": cliente.usuario.apellido,
        "email": cliente.usuario.email,
        "telefono": cliente.telefono,
        "fecha_nacimiento": cliente.fecha_nacimiento,
        "historial_salud": historial,
        "preferencias": cliente.preferencias,
        "activo": cliente.usuario.activo,
        "created_at": cliente.created_at,
    }


def create(db: Session, data: ClienteCreate) -> dict:
    try:
        usuario = Usuario(
            nombre=data.nombre,
            apellido=data.apellido,
            email=data.email,
            password_hash=hash_password(data.password),
            rol="cliente",
            activo=True,
        )
        db.add(usuario)
        db.flush()

        cliente = Cliente(
            usuario_id=usuario.id,
            telefono=data.telefono,
            fecha_nacimiento=data.fecha_nacimiento,
            historial_salud=data.historial_salud,
            preferencias=data.preferencias,
        )
        db.add(cliente)
        db.commit()
        db.refresh(cliente)
        return _cliente_to_dict(cliente)
    except Exception:
        db.rollback()
        raise


def update(db: Session, cliente_id: int, data: ClienteUpdate) -> dict | None:
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not cliente:
        return None
    usuario = cliente.usuario

    if data.nombre is not None:
        usuario.nombre = data.nombre
    if data.apellido is not None:
        usuario.apellido = data.apellido
    if data.email is not None:
        usuario.email = data.email
    if data.password is not None:
        usuario.password_hash = hash_password(data.password)
    if data.telefono is not None:
        cliente.telefono = data.telefono
    if data.fecha_nacimiento is not None:
        cliente.fecha_nacimiento = data.fecha_nacimiento
    if data.historial_salud is not None:
        cliente.historial_salud = data.historial_salud
    if data.preferencias is not None:
        cliente.preferencias = data.preferencias

    db.commit()
    db.refresh(cliente)
    return _cliente_to_dict(cliente)


def delete(db: Session, cliente_id: int) -> dict | None:
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not cliente:
        return None
    tiene_citas = db.query(Cita).filter(Cita.cliente_id == cliente_id).first()
    if tiene_citas:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El cliente tiene historial de citas, no se puede eliminar.",
        )
    data = _cliente_to_dict(cliente)
    db.delete(cliente)
    db.delete(cliente.usuario)
    db.commit()
    return data


def get_resumen(db: Session, cliente_id: int) -> dict:
    citas = db.query(Cita).filter(Cita.cliente_id == cliente_id).all()
    completadas = [c for c in citas if c.estado == "completada"]
    total_visitas = len(citas)
    gasto_total = sum(float(c.total) for c in completadas)
    ultima_visita = max((c.fecha for c in completadas), default=None)
    return {
        "total_visitas": total_visitas,
        "gasto_total": gasto_total,
        "ultima_visita": ultima_visita,
    }
