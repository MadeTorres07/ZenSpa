from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.models import CitaServicio, Servicio
from app.schemas.schemas import ServicioCreate, ServicioUpdate


def get_all(db: Session, tipo_terapia: str | None = None) -> list[Servicio]:
    query = db.query(Servicio)
    if tipo_terapia:
        query = query.filter(Servicio.tipo_terapia == tipo_terapia)
    return query.all()


def get_by_id(db: Session, servicio_id: int) -> Servicio | None:
    return db.query(Servicio).filter(Servicio.id == servicio_id).first()


def create(db: Session, data: ServicioCreate) -> Servicio:
    servicio = Servicio(
        nombre=data.nombre,
        duracion_minutos=data.duracion_minutos,
        precio=data.precio,
        tipo_terapia=data.tipo_terapia,
    )
    db.add(servicio)
    db.commit()
    db.refresh(servicio)
    return servicio


def update(db: Session, servicio_id: int, data: ServicioUpdate) -> Servicio | None:
    servicio = get_by_id(db, servicio_id)
    if not servicio:
        return None
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(servicio, field, value)
    db.commit()
    db.refresh(servicio)
    return servicio


def delete(db: Session, servicio_id: int) -> Servicio | None:
    servicio = get_by_id(db, servicio_id)
    if not servicio:
        return None
    tiene_historial = (
        db.query(CitaServicio)
        .filter(CitaServicio.servicio_id == servicio_id)
        .first()
    )
    if tiene_historial:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El servicio tiene historial de citas, no se puede eliminar",
        )
    db.delete(servicio)
    db.commit()
    return servicio
