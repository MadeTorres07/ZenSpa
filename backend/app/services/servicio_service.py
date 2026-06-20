from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.models import CabinaServicio, CitaServicio, Servicio
from app.schemas.schemas import ServicioCreate, ServicioUpdate


def _servicio_to_dict(servicio: Servicio) -> dict:
    return {
        "id": servicio.id,
        "nombre": servicio.nombre,
        "duracion_minutos": servicio.duracion_minutos,
        "precio": float(servicio.precio),
        "tipo_terapia": servicio.tipo_terapia,
        "descripcion": servicio.descripcion,
        "beneficios": servicio.beneficios,
        "incluye": servicio.incluye,
        "recomendaciones": servicio.recomendaciones,
        "contraindicaciones": servicio.contraindicaciones,
        "cabinas_ids": [cs.cabina_id for cs in servicio.cabina_servicios],
    }


def get_all(db: Session, tipo_terapia: str | None = None) -> list[dict]:
    query = db.query(Servicio)
    if tipo_terapia:
        query = query.filter(Servicio.tipo_terapia == tipo_terapia)
    return [_servicio_to_dict(s) for s in query.all()]


def get_by_id(db: Session, servicio_id: int) -> dict | None:
    servicio = db.query(Servicio).filter(Servicio.id == servicio_id).first()
    if not servicio:
        return None
    return _servicio_to_dict(servicio)


def _nombre_existe(db: Session, nombre: str, exclude_id: int | None = None) -> bool:
    query = db.query(Servicio).filter(Servicio.nombre == nombre.strip())
    if exclude_id is not None:
        query = query.filter(Servicio.id != exclude_id)
    return query.first() is not None


def create(db: Session, data: ServicioCreate) -> dict:
    try:
        if _nombre_existe(db, data.nombre):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ya existe un servicio con ese nombre",
            )
        servicio = Servicio(
            nombre=data.nombre,
            duracion_minutos=data.duracion_minutos,
            precio=data.precio,
            tipo_terapia=data.tipo_terapia,
            descripcion=data.descripcion,
            beneficios=data.beneficios,
            incluye=data.incluye,
            recomendaciones=data.recomendaciones,
            contraindicaciones=data.contraindicaciones,
        )
        db.add(servicio)
        db.flush()

        for cabina_id in data.cabinas_ids:
            db.add(CabinaServicio(cabina_id=cabina_id, servicio_id=servicio.id))

        db.commit()
        db.refresh(servicio)
        return _servicio_to_dict(servicio)
    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise


def update(db: Session, servicio_id: int, data: ServicioUpdate) -> dict | None:
    servicio = db.query(Servicio).filter(Servicio.id == servicio_id).first()
    if not servicio:
        return None

    if data.nombre is not None and _nombre_existe(db, data.nombre, exclude_id=servicio_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un servicio con ese nombre",
        )

    update_data = data.model_dump(exclude_unset=True, exclude={"cabinas_ids"})
    for field, value in update_data.items():
        setattr(servicio, field, value)

    if "cabinas_ids" in data.model_dump(exclude_unset=True):
        db.query(CabinaServicio).filter(
            CabinaServicio.servicio_id == servicio_id
        ).delete(synchronize_session='fetch')
        for cabina_id in data.cabinas_ids or []:
            db.add(CabinaServicio(cabina_id=cabina_id, servicio_id=servicio_id))

    db.commit()
    db.refresh(servicio)
    return _servicio_to_dict(servicio)


def delete(db: Session, servicio_id: int) -> dict | None:
    servicio = db.query(Servicio).filter(Servicio.id == servicio_id).first()
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
    data = _servicio_to_dict(servicio)
    db.query(CabinaServicio).filter(
        CabinaServicio.servicio_id == servicio_id
    ).delete(synchronize_session='fetch')
    db.delete(servicio)
    db.commit()
    return data
