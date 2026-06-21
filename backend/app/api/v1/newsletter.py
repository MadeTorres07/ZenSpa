from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import NewsletterSuscripcion

router = APIRouter(prefix="/newsletter", tags=["Newsletter"])


class SuscripcionRequest(BaseModel):
    email: EmailStr


@router.post("/suscribir", status_code=201)
def suscribir(
    data: SuscripcionRequest,
    db: Session = Depends(get_db),
):
    existe = (
        db.query(NewsletterSuscripcion)
        .filter(NewsletterSuscripcion.email == data.email)
        .first()
    )
    if existe:
        if not existe.activo:
            existe.activo = True
            db.commit()
            return {"detail": "Suscripción reactivada exitosamente"}
        raise HTTPException(
            status_code=400,
            detail="Este correo ya está suscrito",
        )
    suscripcion = NewsletterSuscripcion(email=data.email)
    db.add(suscripcion)
    db.commit()
    return {"detail": "¡Gracias por suscribirte! Recibirás nuestras novedades."}
