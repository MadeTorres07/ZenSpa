from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.models import Cabina, CabinaServicio, Cita, Servicio
from app.schemas.schemas import CabinaCreate, CabinaUpdate


def get_all(
    db: Session,
    estado: str | None = None,
    tipo_tratamiento: str | None = None,
) -> list[Cabina]:
    query = db.query(Cabina)
    if estado:
        query = query.filter(Cabina.estado == estado)
    if tipo_tratamiento:
        query = query.filter(Cabina.tipo_tratamiento == tipo_tratamiento)
    return query.all()


def get_by_id(db: Session, cabina_id: int) -> Cabina | None:
    return db.query(Cabina).filter(Cabina.id == cabina_id).first()


def create(db: Session, data: CabinaCreate) -> Cabina:
    cabina = Cabina(
        nombre=data.nombre,
        tipo_tratamiento=data.tipo_tratamiento,
        estado=data.estado,
        equipamiento=data.equipamiento,
    )
    db.add(cabina)
    db.commit()
    db.refresh(cabina)
    return cabina


def update(db: Session, cabina_id: int, data: CabinaUpdate) -> Cabina | None:
    cabina = get_by_id(db, cabina_id)
    if not cabina:
        return None
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(cabina, field, value)
    db.commit()
    db.refresh(cabina)
    return cabina


def delete(db: Session, cabina_id: int) -> Cabina | None:
    cabina = get_by_id(db, cabina_id)
    if not cabina:
        return None
    tiene_citas = db.query(Cita).filter(Cita.cabina_id == cabina_id).first()
    if tiene_citas:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La cabina tiene historial de citas, no se puede eliminar.",
        )
    db.delete(cabina)
    db.commit()
    return cabina


def get_servicios(db: Session, cabina_id: int) -> list[Servicio]:
    cabina = get_by_id(db, cabina_id)
    if not cabina:
        return []
    return [cs.servicio for cs in cabina.cabina_servicios]


def asociar_servicio(db: Session, cabina_id: int, servicio_id: int) -> CabinaServicio:
    cabina = get_by_id(db, cabina_id)
    if not cabina:
        raise HTTPException(status_code=404, detail="Cabina no encontrada")
    servicio = db.query(Servicio).filter(Servicio.id == servicio_id).first()
    if not servicio:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    if cabina.tipo_tratamiento != "multiple" and cabina.tipo_tratamiento != servicio.tipo_terapia:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El servicio no es compatible con el tipo de tratamiento de esta cabina",
        )
    existe = (
        db.query(CabinaServicio)
        .filter(
            CabinaServicio.cabina_id == cabina_id,
            CabinaServicio.servicio_id == servicio_id,
        )
        .first()
    )
    if existe:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El servicio ya está asociado a esta cabina",
        )
    relacion = CabinaServicio(cabina_id=cabina_id, servicio_id=servicio_id)
    db.add(relacion)
    db.commit()
    db.refresh(relacion)
    return relacion


def desasociar_servicio(db: Session, cabina_id: int, servicio_id: int) -> None:
    relacion = (
        db.query(CabinaServicio)
        .filter(
            CabinaServicio.cabina_id == cabina_id,
            CabinaServicio.servicio_id == servicio_id,
        )
        .first()
    )
    if not relacion:
        raise HTTPException(
            status_code=404,
            detail="La relación cabina-servicio no existe",
        )
    db.delete(relacion)
    db.commit()
