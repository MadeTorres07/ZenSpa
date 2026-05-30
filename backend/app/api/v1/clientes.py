from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models.models import Usuario
from app.schemas.schemas import ClienteCreate, ClienteUpdate
from app.services import cliente_service

router = APIRouter(prefix="/clientes", tags=["Clientes"])


@router.get("/")
def listar_clientes(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    include_historial = current_user.rol in ("admin", "terapeuta")
    if current_user.rol == "cliente":
        cliente = current_user.cliente
        if not cliente:
            return []
        data = cliente_service.get_by_id(db, cliente.id, include_historial=False)
        return [data] if data else []
    if current_user.rol not in ("admin", "recepcionista", "terapeuta"):
        raise HTTPException(status_code=403, detail="No tienes permiso para esta accion")
    return cliente_service.get_all(db, include_historial=include_historial)


@router.get("/{cliente_id}")
def obtener_cliente(
    cliente_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    if current_user.rol == "cliente":
        if not current_user.cliente or current_user.cliente.id != cliente_id:
            raise HTTPException(status_code=403, detail="No tienes permiso para esta accion")
        data = cliente_service.get_by_id(db, cliente_id, include_historial=False)
    else:
        include_historial = current_user.rol in ("admin", "terapeuta")
        data = cliente_service.get_by_id(db, cliente_id, include_historial=include_historial)
    if not data:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return data


@router.post("/", status_code=201)
def crear_cliente(
    data: ClienteCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_roles("admin", "recepcionista")),
):
    existe = db.query(Usuario).filter(Usuario.email == data.email).first()
    if existe:
        raise HTTPException(status_code=400, detail="El email ya esta registrado")
    return cliente_service.create(db, data)


@router.put("/{cliente_id}")
def actualizar_cliente(
    cliente_id: int,
    data: ClienteUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    if current_user.rol == "cliente":
        if not current_user.cliente or current_user.cliente.id != cliente_id:
            raise HTTPException(status_code=403, detail="No tienes permiso para esta accion")
        cliente = cliente_service.get_by_id(db, cliente_id)
        if not cliente:
            raise HTTPException(status_code=404, detail="Cliente no encontrado")
        data_limpia = data.model_dump(exclude_unset=True)
        data_limpia.pop("historial_salud", None)
        data_limpia.pop("email", None)
        data_limpia.pop("rol", None)
        data_limpia.pop("activo", None)
        cliente_actualizado = cliente_service.update(db, cliente_id, ClienteUpdate(**data_limpia))
        if not cliente_actualizado:
            raise HTTPException(status_code=404, detail="Cliente no encontrado")
        return cliente_actualizado
    if current_user.rol not in ("admin", "recepcionista", "terapeuta"):
        raise HTTPException(status_code=403, detail="No tienes permiso para esta accion")
    resultado = cliente_service.update(db, cliente_id, data)
    if not resultado:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return resultado


@router.delete("/{cliente_id}")
def eliminar_cliente(
    cliente_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_roles("admin")),
):
    resultado = cliente_service.delete(db, cliente_id)
    if not resultado:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return resultado
