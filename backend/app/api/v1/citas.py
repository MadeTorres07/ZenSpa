from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models.models import Usuario
from app.schemas.schemas import CitaCreate, CitaUpdate, ReporteCitasFilter
from app.services import cita_service

router = APIRouter(prefix="/citas", tags=["Citas"])


@router.get("/reportes/servicios-populares")
def reporte_servicios_populares(
    fecha_inicio: date | None = Query(None),
    fecha_fin: date | None = Query(None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_roles("admin")),
):
    return cita_service.get_reporte_servicios_populares(db, fecha_inicio, fecha_fin)


@router.get("/reportes/ingresos-terapeutas")
def reporte_ingresos_terapeutas(
    fecha_inicio: date | None = Query(None),
    fecha_fin: date | None = Query(None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_roles("admin")),
):
    return cita_service.get_reporte_ingresos_terapeuta(db, fecha_inicio, fecha_fin)


@router.get("/")
def listar_citas(
    terapeuta_id: int | None = Query(None),
    tipo_terapia: str | None = Query(None),
    fecha_inicio: date | None = Query(None),
    fecha_fin: date | None = Query(None),
    estado: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    if current_user.rol not in ("admin", "recepcionista", "terapeuta", "cliente"):
        raise HTTPException(status_code=403, detail="No tienes permiso para esta accion")
    filtros = ReporteCitasFilter(
        terapeuta_id=terapeuta_id,
        tipo_terapia=tipo_terapia,
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin,
        estado=estado,
    )
    return cita_service.get_citas_filtradas(db, filtros, usuario_actual=current_user)


@router.get("/{cita_id}")
def obtener_cita(
    cita_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    if current_user.rol not in ("admin", "recepcionista", "terapeuta", "cliente"):
        raise HTTPException(status_code=403, detail="No tienes permiso para esta accion")
    cita = cita_service.get_by_id(db, cita_id)
    if not cita:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    if current_user.rol == "cliente":
        cliente = current_user.cliente
        if not cliente or cita["cliente_id"] != cliente.id:
            raise HTTPException(status_code=403, detail="No tienes permiso para ver esta cita")
    if current_user.rol == "terapeuta":
        terapeuta = current_user.terapeuta
        if not terapeuta or cita["terapeuta_id"] != terapeuta.id:
            raise HTTPException(status_code=403, detail="No tienes permiso para ver esta cita")
    return cita


@router.post("/", status_code=201)
def crear_cita(
    data: CitaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_roles("admin", "recepcionista")),
):
    return cita_service.create(db, data)


@router.put("/{cita_id}")
def actualizar_cita(
    cita_id: int,
    data: CitaUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_roles("admin", "recepcionista", "terapeuta", "cliente")),
):
    return cita_service.update_estado(db, cita_id, data, current_user)
