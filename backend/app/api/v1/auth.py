from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import (
    create_access_token,
    get_current_user,
    verify_password,
)
from app.models.models import Cliente, Usuario
from app.schemas.schemas import ClienteCreate, UsuarioResponse
from app.services import cliente_service

router = APIRouter(prefix="/auth", tags=["Autenticación"])


@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    usuario = (
        db.query(Usuario).filter(Usuario.email == form_data.username).first()
    )
    if not usuario or not verify_password(form_data.password, usuario.password_hash):
        raise HTTPException(
            status_code=401,
            detail="Credenciales incorrectas",
        )
    if not usuario.activo:
        raise HTTPException(
            status_code=403,
            detail="Usuario inactivo",
        )
    token = create_access_token(
        {
            "sub": str(usuario.id),
            "rol": usuario.rol,
            "nombre": usuario.nombre,
        }
    )
    return {
        "access_token": token,
        "token_type": "bearer",
        "rol": usuario.rol,
        "nombre": usuario.nombre,
    }


@router.post("/registro", status_code=201)
def registrar_cliente(
    data: ClienteCreate,
    db: Session = Depends(get_db),
):
    if db.query(Usuario).filter(Usuario.email == data.email).first():
        raise HTTPException(status_code=400, detail="El email ya esta registrado")
    if data.telefono:
        tel_limpio = data.telefono.strip()
        if db.query(Cliente).filter(Cliente.telefono == tel_limpio).first():
            raise HTTPException(status_code=400, detail="Este número de teléfono ya está registrado")
    return cliente_service.create(db, data)


@router.get("/me", response_model=UsuarioResponse)
def obtener_usuario_actual(
    current_user: Usuario = Depends(get_current_user),
):
    return current_user
