from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models.models import Usuario, Cliente
from app.schemas.schemas import UsuarioCreate, UsuarioResponse, UsuarioUpdate
from app.services.usuario_service import (
    create_usuario,
    deactivate_usuario,
    get_usuario_by_email,
    get_usuario_by_id,
    update_usuario,
)

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])


@router.get("/", response_model=list[UsuarioResponse])
def listar_usuarios(
    rol: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_roles("admin")),
):
    query = db.query(Usuario)
    if rol:
        query = query.filter(Usuario.rol == rol)
    return query.all()


@router.get("/{usuario_id}", response_model=UsuarioResponse)
def obtener_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    if current_user.rol != "admin" and current_user.id != usuario_id:
        raise HTTPException(
            status_code=403,
            detail="No tienes permiso para esta acción",
        )
    usuario = get_usuario_by_id(db, usuario_id)
    if not usuario:
        raise HTTPException(
            status_code=404,
            detail="Usuario no encontrado",
        )
    return usuario


@router.post("/", response_model=UsuarioResponse, status_code=201)
def crear_usuario(
    data: UsuarioCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_roles("admin")),
):
    if get_usuario_by_email(db, data.email):
        raise HTTPException(
            status_code=400,
            detail="El email ya está registrado",
        )
    if data.telefono:
        tel_limpio = data.telefono.strip()
        if db.query(Cliente).filter(Cliente.telefono == tel_limpio).first():
            raise HTTPException(
                status_code=400,
                detail="Este número de teléfono ya está registrado",
            )
    return create_usuario(db, data)


@router.put("/{usuario_id}", response_model=UsuarioResponse)
def actualizar_usuario(
    usuario_id: int,
    data: UsuarioUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_roles("admin")),
):
    usuario = update_usuario(db, usuario_id, data)
    if not usuario:
        raise HTTPException(
            status_code=404,
            detail="Usuario no encontrado",
        )
    return usuario


@router.delete("/{usuario_id}", response_model=UsuarioResponse)
def eliminar_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_roles("admin")),
):
    usuario = deactivate_usuario(db, usuario_id, current_user.id)
    if not usuario:
        raise HTTPException(
            status_code=404,
            detail="Usuario no encontrado",
        )
    return usuario
