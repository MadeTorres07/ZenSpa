from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models.models import Usuario
from app.schemas.schemas import ServicioCreate, ServicioResponse, ServicioUpdate
from app.services import servicio_service

router = APIRouter(prefix="/servicios", tags=["Servicios"])


@router.get("/")
def listar_servicios(
    tipo_terapia: str | None = Query(None),
    db: Session = Depends(get_db),
):
    return servicio_service.get_all(db, tipo_terapia=tipo_terapia)


@router.get("/{servicio_id}")
def obtener_servicio(
    servicio_id: int,
    db: Session = Depends(get_db),
):
    servicio = servicio_service.get_by_id(db, servicio_id)
    if not servicio:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    return servicio


@router.post("/", status_code=201)
def crear_servicio(
    data: ServicioCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_roles("admin")),
):
    return servicio_service.create(db, data)


@router.put("/{servicio_id}")
def actualizar_servicio(
    servicio_id: int,
    data: ServicioUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_roles("admin")),
):
    resultado = servicio_service.update(db, servicio_id, data)
    if not resultado:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    return resultado


@router.delete("/{servicio_id}")
def eliminar_servicio(
    servicio_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_roles("admin")),
):
    resultado = servicio_service.delete(db, servicio_id)
    if not resultado:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    return resultado
