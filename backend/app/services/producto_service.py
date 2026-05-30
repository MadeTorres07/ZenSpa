from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.models import Producto, UsoProducto
from app.schemas.schemas import ProductoCreate, ProductoUpdate


def get_all(db: Session, stock_bajo: bool | None = None) -> list[Producto]:
    query = db.query(Producto)
    if stock_bajo:
        query = query.filter(Producto.stock <= Producto.stock_minimo)
    return query.all()


def get_by_id(db: Session, producto_id: int) -> Producto | None:
    return db.query(Producto).filter(Producto.id == producto_id).first()


def create(db: Session, data: ProductoCreate) -> Producto:
    producto = Producto(
        nombre=data.nombre,
        stock=data.stock,
        costo_unitario=data.costo_unitario,
        stock_minimo=data.stock_minimo,
    )
    db.add(producto)
    db.commit()
    db.refresh(producto)
    return producto


def update(db: Session, producto_id: int, data: ProductoUpdate) -> Producto | None:
    producto = get_by_id(db, producto_id)
    if not producto:
        return None
    update_data = data.model_dump(exclude_unset=True)
    if "stock" in update_data:
        nuevo_stock = update_data["stock"]
        if nuevo_stock < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El stock no puede ser negativo",
            )
    for field, value in update_data.items():
        setattr(producto, field, value)
    db.commit()
    db.refresh(producto)
    return producto


def delete(db: Session, producto_id: int) -> Producto | None:
    producto = get_by_id(db, producto_id)
    if not producto:
        return None
    tiene_historial = (
        db.query(UsoProducto)
        .filter(UsoProducto.producto_id == producto_id)
        .first()
    )
    if tiene_historial:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El producto tiene historial de uso, no se puede eliminar",
        )
    db.delete(producto)
    db.commit()
    return producto
