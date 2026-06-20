from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.models import Producto, UsoProducto
from app.schemas.schemas import ProductoCreate, ProductoUpdate


def _producto_to_dict(p: Producto) -> dict:
    return {
        "id": p.id,
        "nombre": p.nombre,
        "stock": p.stock,
        "costo_unitario": float(p.costo_unitario),
        "stock_minimo": p.stock_minimo,
        "descripcion": p.descripcion,
        "presentacion": p.presentacion,
        "uso_recomendado": p.uso_recomendado,
        "fecha_vencimiento": str(p.fecha_vencimiento) if p.fecha_vencimiento else None,
        "proveedor": p.proveedor,
    }


def get_all(db: Session, stock_bajo: bool | None = None) -> list[dict]:
    query = db.query(Producto)
    if stock_bajo:
        query = query.filter(Producto.stock <= Producto.stock_minimo)
    return [_producto_to_dict(p) for p in query.all()]


def get_by_id(db: Session, producto_id: int) -> dict | None:
    p = db.query(Producto).filter(Producto.id == producto_id).first()
    if not p:
        return None
    return _producto_to_dict(p)


def _get_model(db: Session, producto_id: int) -> Producto | None:
    return db.query(Producto).filter(Producto.id == producto_id).first()


def create(db: Session, data: ProductoCreate) -> dict:
    existe = db.query(Producto).filter(Producto.nombre == data.nombre).first()
    if existe:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un producto con ese nombre",
        )
    producto = Producto(
        nombre=data.nombre,
        stock=data.stock,
        costo_unitario=data.costo_unitario,
        stock_minimo=data.stock_minimo,
        descripcion=data.descripcion,
        presentacion=data.presentacion,
        uso_recomendado=data.uso_recomendado,
        fecha_vencimiento=data.fecha_vencimiento,
        proveedor=data.proveedor,
    )
    db.add(producto)
    db.commit()
    db.refresh(producto)
    return _producto_to_dict(producto)


def update(db: Session, producto_id: int, data: ProductoUpdate) -> dict | None:
    producto = _get_model(db, producto_id)
    if not producto:
        return None
    update_data = data.model_dump(exclude_unset=True)
    if "nombre" in update_data:
        existe = (
            db.query(Producto)
            .filter(Producto.nombre == update_data["nombre"], Producto.id != producto_id)
            .first()
        )
        if existe:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ya existe un producto con ese nombre",
            )
    for field, value in update_data.items():
        setattr(producto, field, value)
    db.commit()
    db.refresh(producto)
    return _producto_to_dict(producto)


def delete(db: Session, producto_id: int) -> dict | None:
    producto = _get_model(db, producto_id)
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
    result = _producto_to_dict(producto)
    db.delete(producto)
    db.commit()
    return result
