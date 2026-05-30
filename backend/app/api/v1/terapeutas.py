from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models.models import Usuario
from app.schemas.schemas import TerapeutaCreate, TerapeutaUpdate
from app.services import terapeuta_service

router = APIRouter(prefix="/terapeutas", tags=["Terapeutas"])


@router.get("/")
def listar_terapeutas(
    activo: bool | None = Query(None),
    especialidad: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_roles("admin")),
):
    return terapeuta_service.get_all(db, activo=activo, especialidad=especialidad)


@router.get("/{terapeuta_id}")
def obtener_terapeuta(
    terapeuta_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_roles("admin")),
):
    data = terapeuta_service.get_by_id(db, terapeuta_id)
    if not data:
        raise HTTPException(status_code=404, detail="Terapeuta no encontrado")
    return data


@router.post("/", status_code=201)
def crear_terapeuta(
    data: TerapeutaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_roles("admin")),
):
    existe = db.query(Usuario).filter(Usuario.email == data.email).first()
    if existe:
        raise HTTPException(status_code=400, detail="El email ya esta registrado")
    return terapeuta_service.create(db, data)


@router.put("/{terapeuta_id}")
def actualizar_terapeuta(
    terapeuta_id: int,
    data: TerapeutaUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_roles("admin")),
):
    resultado = terapeuta_service.update(db, terapeuta_id, data)
    if not resultado:
        raise HTTPException(status_code=404, detail="Terapeuta no encontrado")
    return resultado


@router.delete("/{terapeuta_id}")
def eliminar_terapeuta(
    terapeuta_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_roles("admin")),
):
    resultado = terapeuta_service.delete(db, terapeuta_id)
    if not resultado:
        raise HTTPException(status_code=404, detail="Terapeuta no encontrado")
    return resultado
