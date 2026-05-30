from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models.models import Usuario
from app.schemas.schemas import (
    CabinaCreate,
    CabinaResponse,
    CabinaServicioResponse,
    CabinaUpdate,
    ServicioResponse,
)
from app.services import cabina_service

router = APIRouter(prefix="/cabinas", tags=["Cabinas"])


@router.get("/", response_model=list[CabinaResponse])
def listar_cabinas(
    estado: str | None = Query(None),
    tipo_tratamiento: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    return cabina_service.get_all(db, estado=estado, tipo_tratamiento=tipo_tratamiento)


@router.get("/{cabina_id}", response_model=CabinaResponse)
def obtener_cabina(
    cabina_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    cabina = cabina_service.get_by_id(db, cabina_id)
    if not cabina:
        raise HTTPException(status_code=404, detail="Cabina no encontrada")
    return cabina


@router.get("/{cabina_id}/servicios", response_model=list[ServicioResponse])
def listar_servicios_cabina(
    cabina_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    cabina = cabina_service.get_by_id(db, cabina_id)
    if not cabina:
        raise HTTPException(status_code=404, detail="Cabina no encontrada")
    return cabina_service.get_servicios(db, cabina_id)


@router.post("/", response_model=CabinaResponse, status_code=201)
def crear_cabina(
    data: CabinaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_roles("admin")),
):
    return cabina_service.create(db, data)


@router.put("/{cabina_id}", response_model=CabinaResponse)
def actualizar_cabina(
    cabina_id: int,
    data: CabinaUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_roles("admin")),
):
    resultado = cabina_service.update(db, cabina_id, data)
    if not resultado:
        raise HTTPException(status_code=404, detail="Cabina no encontrada")
    return resultado


@router.delete("/{cabina_id}", response_model=CabinaResponse)
def eliminar_cabina(
    cabina_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_roles("admin")),
):
    resultado = cabina_service.delete(db, cabina_id)
    if not resultado:
        raise HTTPException(status_code=404, detail="Cabina no encontrada")
    return resultado


@router.post("/{cabina_id}/servicios/{servicio_id}", response_model=CabinaServicioResponse)
def asociar_servicio(
    cabina_id: int,
    servicio_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_roles("admin")),
):
    return cabina_service.asociar_servicio(db, cabina_id, servicio_id)


@router.delete("/{cabina_id}/servicios/{servicio_id}")
def desasociar_servicio(
    cabina_id: int,
    servicio_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_roles("admin")),
):
    cabina_service.desasociar_servicio(db, cabina_id, servicio_id)
    return {"detail": "Servicio desasociado correctamente"}
