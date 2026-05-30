from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models.models import Usuario
from app.schemas.schemas import ProductoCreate, ProductoResponse, ProductoUpdate
from app.services import producto_service

router = APIRouter(prefix="/productos", tags=["Productos"])


@router.get("/", response_model=list[ProductoResponse])
def listar_productos(
    stock_bajo: bool | None = Query(None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_roles("admin", "recepcionista")),
):
    return producto_service.get_all(db, stock_bajo=stock_bajo)


@router.get("/{producto_id}", response_model=ProductoResponse)
def obtener_producto(
    producto_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_roles("admin", "recepcionista")),
):
    producto = producto_service.get_by_id(db, producto_id)
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return producto


@router.post("/", response_model=ProductoResponse, status_code=201)
def crear_producto(
    data: ProductoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_roles("admin")),
):
    return producto_service.create(db, data)


@router.put("/{producto_id}", response_model=ProductoResponse)
def actualizar_producto(
    producto_id: int,
    data: ProductoUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_roles("admin")),
):
    resultado = producto_service.update(db, producto_id, data)
    if not resultado:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return resultado


@router.delete("/{producto_id}", response_model=ProductoResponse)
def eliminar_producto(
    producto_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_roles("admin")),
):
    resultado = producto_service.delete(db, producto_id)
    if not resultado:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return resultado
