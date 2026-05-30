from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.models import Terapeuta, Usuario
from app.schemas.schemas import TerapeutaCreate, TerapeutaUpdate


def get_all(
    db: Session,
    activo: bool | None = None,
    especialidad: str | None = None,
) -> list[dict]:
    query = db.query(Terapeuta)
    if activo is not None:
        query = query.filter(Terapeuta.activo == activo)
    if especialidad:
        query = query.filter(Terapeuta.especialidad == especialidad)
    terapeutas = query.all()
    return [_terapeuta_to_dict(t) for t in terapeutas]


def get_by_id(db: Session, terapeuta_id: int) -> dict | None:
    terapeuta = db.query(Terapeuta).filter(Terapeuta.id == terapeuta_id).first()
    if not terapeuta:
        return None
    return _terapeuta_to_dict(terapeuta)


def _terapeuta_to_dict(terapeuta: Terapeuta) -> dict:
    return {
        "id": terapeuta.id,
        "usuario_id": terapeuta.usuario_id,
        "nombre": terapeuta.usuario.nombre,
        "apellido": terapeuta.usuario.apellido,
        "email": terapeuta.usuario.email,
        "especialidad": terapeuta.especialidad,
        "certificaciones": terapeuta.certificaciones,
        "activo": terapeuta.activo,
    }


def create(db: Session, data: TerapeutaCreate) -> dict:
    usuario = Usuario(
        nombre=data.nombre,
        apellido=data.apellido,
        email=data.email,
        password_hash=hash_password(data.password),
        rol="terapeuta",
        activo=True,
    )
    db.add(usuario)
    db.flush()

    terapeuta = Terapeuta(
        usuario_id=usuario.id,
        especialidad=data.especialidad,
        certificaciones=data.certificaciones,
    )
    db.add(terapeuta)
    db.commit()
    db.refresh(terapeuta)
    return _terapeuta_to_dict(terapeuta)


def update(db: Session, terapeuta_id: int, data: TerapeutaUpdate) -> dict | None:
    terapeuta = db.query(Terapeuta).filter(Terapeuta.id == terapeuta_id).first()
    if not terapeuta:
        return None
    usuario = terapeuta.usuario

    if data.nombre is not None:
        usuario.nombre = data.nombre
    if data.apellido is not None:
        usuario.apellido = data.apellido
    if data.email is not None:
        usuario.email = data.email
    if data.password is not None:
        usuario.password_hash = hash_password(data.password)
    if data.especialidad is not None:
        terapeuta.especialidad = data.especialidad
    if data.certificaciones is not None:
        terapeuta.certificaciones = data.certificaciones

    db.commit()
    db.refresh(terapeuta)
    return _terapeuta_to_dict(terapeuta)


def delete(db: Session, terapeuta_id: int) -> dict | None:
    terapeuta = db.query(Terapeuta).filter(Terapeuta.id == terapeuta_id).first()
    if not terapeuta:
        return None
    usuario = terapeuta.usuario
    usuario.activo = False
    terapeuta.activo = False
    db.commit()
    db.refresh(terapeuta)
    return _terapeuta_to_dict(terapeuta)
