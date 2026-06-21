from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.models import Usuario, Terapeuta, Cliente
from app.schemas.schemas import UsuarioCreate, UsuarioUpdate


def get_usuario_by_id(db: Session, usuario_id: int) -> Usuario | None:
    return db.query(Usuario).filter(Usuario.id == usuario_id).first()


def get_usuario_by_email(db: Session, email: str) -> Usuario | None:
    return db.query(Usuario).filter(Usuario.email == email).first()


def create_usuario(db: Session, data: UsuarioCreate) -> Usuario:
    usuario = Usuario(
        nombre=data.nombre,
        apellido=data.apellido,
        email=data.email,
        password_hash=hash_password(data.password),
        rol=data.rol,
        activo=data.activo,
    )
    db.add(usuario)
    db.flush()

    if data.rol == "terapeuta":
        terapeuta = Terapeuta(
            usuario_id=usuario.id,
            especialidad="general",
            certificaciones="",
            activo=True,
        )
        db.add(terapeuta)
    elif data.rol == "cliente":
        cliente = Cliente(
            usuario_id=usuario.id,
            telefono=data.telefono,
        )
        db.add(cliente)

    db.commit()
    db.refresh(usuario)
    return usuario


def update_usuario(db: Session, usuario_id: int, data: UsuarioUpdate) -> Usuario | None:
    usuario = get_usuario_by_id(db, usuario_id)
    if not usuario:
        return None
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(usuario, field, value)
    db.commit()
    db.refresh(usuario)
    return usuario


def deactivate_usuario(
    db: Session, usuario_id: int, requesting_user_id: int
) -> Usuario | None:
    usuario = get_usuario_by_id(db, usuario_id)
    if not usuario:
        return None
    if usuario.id == requesting_user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes desactivarte a ti mismo",
        )
    usuario.activo = False
    db.commit()
    db.refresh(usuario)
    return usuario
