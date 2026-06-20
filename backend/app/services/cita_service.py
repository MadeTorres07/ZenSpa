from datetime import date, datetime, time, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy import case, func, and_
from sqlalchemy.orm import Session

from app.models.models import (
    Cabina,
    CabinaServicio,
    Cita,
    CitaServicio,
    Cliente,
    Producto,
    Servicio,
    Terapeuta,
    UsoProducto,
    Usuario,
)
from app.schemas.schemas import (
    CitaCreate,
    CitaUpdate,
    ReporteCitasFilter,
    ServicioResponse,
)


def _cita_to_dict(cita: Cita) -> dict:
    servicios = [
        ServicioResponse(
            id=cs.servicio.id,
            nombre=cs.servicio.nombre,
            duracion_minutos=cs.servicio.duracion_minutos,
            precio=cs.servicio.precio,
            tipo_terapia=cs.servicio.tipo_terapia,
        ).model_dump()
        for cs in cita.cita_servicios
    ]
    return {
        "id": cita.id,
        "cliente_id": cita.cliente_id,
        "terapeuta_id": cita.terapeuta_id,
        "cabina_id": cita.cabina_id,
        "fecha": cita.fecha,
        "hora_inicio": cita.hora_inicio,
        "hora_fin": cita.hora_fin,
        "estado": cita.estado,
        "total": cita.total,
        "created_at": cita.created_at,
        "nombre_cliente": f"{cita.cliente.usuario.nombre} {cita.cliente.usuario.apellido}",
        "nombre_terapeuta": f"{cita.terapeuta.usuario.nombre} {cita.terapeuta.usuario.apellido}",
        "nombre_cabina": cita.cabina.nombre,
        "servicios": servicios,
    }


# ──────────────────────────────── CREATE ───────────────────────────────


def create(db: Session, data: CitaCreate) -> dict:
    if data.hora_fin <= data.hora_inicio:
        raise HTTPException(
            status_code=400,
            detail="La hora de fin debe ser posterior a la hora de inicio",
        )

    servicios = []
    for sid in data.servicios:
        s = db.query(Servicio).filter(Servicio.id == sid).first()
        if not s:
            raise HTTPException(status_code=404, detail=f"Servicio {sid} no encontrado")
        servicios.append(s)

    cabina = db.query(Cabina).filter(Cabina.id == data.cabina_id).first()
    if not cabina:
        raise HTTPException(status_code=404, detail="Cabina no encontrada")
    if cabina.estado != "disponible":
        raise HTTPException(
            status_code=400,
            detail="La cabina no está disponible",
        )

    for s in servicios:
        if cabina.tipo_tratamiento != "multiple" and cabina.tipo_tratamiento != s.tipo_terapia:
            raise HTTPException(
                status_code=400,
                detail=f"El servicio {s.nombre} no es compatible con esta cabina",
            )

    terapeuta_conflicto = (
        db.query(Cita)
        .filter(
            Cita.terapeuta_id == data.terapeuta_id,
            Cita.fecha == data.fecha,
            Cita.estado.notin_(["cancelada", "cancelada_penalidad"]),
            Cita.hora_inicio < data.hora_fin,
            Cita.hora_fin > data.hora_inicio,
        )
        .first()
    )
    if terapeuta_conflicto:
        raise HTTPException(
            status_code=409,
            detail="El terapeuta no está disponible en ese horario",
        )

    cabina_conflicto = (
        db.query(Cita)
        .filter(
            Cita.cabina_id == data.cabina_id,
            Cita.fecha == data.fecha,
            Cita.estado.notin_(["cancelada", "cancelada_penalidad"]),
            Cita.hora_inicio < data.hora_fin,
            Cita.hora_fin > data.hora_inicio,
        )
        .first()
    )
    if cabina_conflicto:
        raise HTTPException(
            status_code=409,
            detail="La cabina no está disponible en ese horario",
        )

    productos_bd = []
    for pu in data.productos:
        p = db.query(Producto).filter(Producto.id == pu.producto_id).first()
        if not p:
            raise HTTPException(
                status_code=404,
                detail=f"Producto {pu.producto_id} no encontrado",
            )
        if p.stock < pu.cantidad:
            raise HTTPException(
                status_code=400,
                detail=f"Stock insuficiente para {p.nombre}",
            )
        productos_bd.append((p, pu.cantidad))

    try:
        total = sum(s.precio for s in servicios)

        cita = Cita(
            cliente_id=data.cliente_id,
            terapeuta_id=data.terapeuta_id,
            cabina_id=data.cabina_id,
            fecha=data.fecha,
            hora_inicio=data.hora_inicio,
            hora_fin=data.hora_fin,
            estado="pendiente",
            total=total,
        )
        db.add(cita)
        db.flush()

        for s in servicios:
            cs = CitaServicio(
                cita_id=cita.id,
                servicio_id=s.id,
                precio_aplicado=s.precio,
            )
            db.add(cs)

        for p, cantidad in productos_bd:
            up = UsoProducto(
                cita_id=cita.id,
                producto_id=p.id,
                cantidad=cantidad,
                costo_aplicado=p.costo_unitario,
            )
            db.add(up)
            p.stock -= cantidad

        db.commit()
        db.refresh(cita)
        return _cita_to_dict(cita)
    except Exception:
        db.rollback()
        raise


# ──────────────────────────────── UPDATE ESTADO ─────────────────────────


def update_estado(db: Session, cita_id: int, data: CitaUpdate, usuario_actual) -> dict:
    cita = db.query(Cita).filter(Cita.id == cita_id).first()
    if not cita:
        raise HTTPException(status_code=404, detail="Cita no encontrada")

    if data.estado is not None:
        if data.estado in ("cancelada", "cancelada_penalidad"):
            cita_datetime = datetime.combine(cita.fecha, cita.hora_inicio, tzinfo=timezone.utc)
            if datetime.now(timezone.utc) >= cita_datetime - timedelta(hours=2):
                data.estado = "cancelada_penalidad"

    nuevo_terapeuta = data.terapeuta_id if data.terapeuta_id is not None else cita.terapeuta_id
    nueva_cabina = data.cabina_id if data.cabina_id is not None else cita.cabina_id
    nuevo_inicio = data.hora_inicio if data.hora_inicio is not None else cita.hora_inicio
    nuevo_fin = data.hora_fin if data.hora_fin is not None else cita.hora_fin

    if (
        data.terapeuta_id is not None
        or data.cabina_id is not None
        or data.hora_inicio is not None
        or data.hora_fin is not None
    ):
        conflicto_terapeuta = (
            db.query(Cita)
            .filter(
                Cita.id != cita_id,
                Cita.terapeuta_id == nuevo_terapeuta,
                Cita.fecha == cita.fecha,
                Cita.estado.notin_(["cancelada", "cancelada_penalidad"]),
                Cita.hora_inicio < nuevo_fin,
                Cita.hora_fin > nuevo_inicio,
            )
            .first()
        )
        if conflicto_terapeuta:
            raise HTTPException(
                status_code=409,
                detail="El terapeuta no está disponible en ese horario",
            )
        conflicto_cabina = (
            db.query(Cita)
            .filter(
                Cita.id != cita_id,
                Cita.cabina_id == nueva_cabina,
                Cita.fecha == cita.fecha,
                Cita.estado.notin_(["cancelada", "cancelada_penalidad"]),
                Cita.hora_inicio < nuevo_fin,
                Cita.hora_fin > nuevo_inicio,
            )
            .first()
        )
        if conflicto_cabina:
            raise HTTPException(
                status_code=409,
                detail="La cabina no está disponible en ese horario",
            )

    try:
        estado_anterior = cita.estado

        if data.estado is not None:
            cita.estado = data.estado
        if data.terapeuta_id is not None:
            cita.terapeuta_id = data.terapeuta_id
        if data.cabina_id is not None:
            cita.cabina_id = data.cabina_id
        if data.hora_inicio is not None:
            cita.hora_inicio = data.hora_inicio
        if data.hora_fin is not None:
            cita.hora_fin = data.hora_fin

        estados_cancelacion = ("cancelada", "cancelada_penalidad")
        if cita.estado in estados_cancelacion and estado_anterior not in estados_cancelacion:
            for up in cita.uso_productos:
                up.producto.stock += up.cantidad

        db.commit()
        db.refresh(cita)
        return _cita_to_dict(cita)
    except Exception:
        db.rollback()
        raise


# ──────────────────────────────── LISTAR FILTRADO ──────────────────────


def get_citas_filtradas(
    db: Session,
    filtros: ReporteCitasFilter,
    usuario_actual=None,
) -> list[dict]:
    query = db.query(Cita)

    if usuario_actual:
        if usuario_actual.rol == "cliente":
            cliente = (
                db.query(Cliente)
                .filter(Cliente.usuario_id == usuario_actual.id)
                .first()
            )
            if cliente:
                query = query.filter(Cita.cliente_id == cliente.id)
            else:
                return []
        elif usuario_actual.rol == "terapeuta":
            terapeuta = (
                db.query(Terapeuta)
                .filter(Terapeuta.usuario_id == usuario_actual.id)
                .first()
            )
            if terapeuta:
                query = query.filter(Cita.terapeuta_id == terapeuta.id)
            else:
                return []

    if filtros.terapeuta_id is not None:
        query = query.filter(Cita.terapeuta_id == filtros.terapeuta_id)
    if filtros.fecha_inicio is not None:
        query = query.filter(Cita.fecha >= filtros.fecha_inicio)
    if filtros.fecha_fin is not None:
        query = query.filter(Cita.fecha <= filtros.fecha_fin)
    if filtros.estado is not None:
        query = query.filter(Cita.estado == filtros.estado)
    if filtros.tipo_terapia is not None:
        subq = (
            db.query(CitaServicio.cita_id)
            .join(CitaServicio.servicio)
            .filter(Servicio.tipo_terapia == filtros.tipo_terapia)
        ).subquery()
        query = query.filter(Cita.id.in_(subq))

    citas = query.all()
    return [_cita_to_dict(c) for c in citas]


# ──────────────────────────────── GET BY ID ────────────────────────────


def get_by_id(db: Session, cita_id: int) -> dict | None:
    cita = db.query(Cita).filter(Cita.id == cita_id).first()
    if not cita:
        return None
    return _cita_to_dict(cita)


# ──────────────────────────────── REPORTES ─────────────────────────────


def _condiciones_cita_completada(fecha_inicio: date | None, fecha_fin: date | None):
    """Construye condiciones para LEFT JOIN con citas completadas + rango de fechas."""
    condiciones = [Cita.estado == "completada"]
    if fecha_inicio:
        condiciones.append(Cita.fecha >= fecha_inicio)
    if fecha_fin:
        condiciones.append(Cita.fecha <= fecha_fin)
    return and_(*condiciones)


def get_reporte_servicios_populares(
    db: Session,
    fecha_inicio: date | None = None,
    fecha_fin: date | None = None,
) -> list[dict]:
    """Ranking de servicios por cantidad de reservas (solo citas completadas).
    Usa LEFT JOIN para incluir servicios sin reservas (total=0, ingresos=0).
    Usa case() para que SUM solo considere cita_servicios de citas completadas."""
    condiciones = _condiciones_cita_completada(fecha_inicio, fecha_fin)
    resultados = (
        db.query(
            Servicio.id.label("servicio_id"),
            Servicio.nombre,
            func.count(Cita.id).label("total_reservas"),
            func.coalesce(
                func.sum(
                    case((Cita.id.isnot(None), CitaServicio.precio_aplicado), else_=0)
                ), 0
            ).label("ingresos_generados"),
        )
        .select_from(Servicio)
        .outerjoin(CitaServicio, Servicio.id == CitaServicio.servicio_id)
        .outerjoin(Cita, and_(Cita.id == CitaServicio.cita_id, condiciones))
        .group_by(Servicio.id, Servicio.nombre)
        .order_by(func.count(Cita.id).desc())
        .all()
    )
    return [
        {
            "servicio_id": r.servicio_id,
            "nombre": r.nombre,
            "total_reservas": r.total_reservas,
            "ingresos_generados": float(r.ingresos_generados),
        }
        for r in resultados
    ]


def get_reporte_ingresos_terapeuta(
    db: Session,
    fecha_inicio: date | None = None,
    fecha_fin: date | None = None,
) -> list[dict]:
    """Ingresos generados por cada terapeuta (solo citas completadas).
    Usa LEFT JOIN para incluir terapeutas sin ingresos ($0)."""
    condiciones = _condiciones_cita_completada(fecha_inicio, fecha_fin)
    resultados = (
        db.query(
            Terapeuta.id.label("terapeuta_id"),
            Usuario.nombre,
            Usuario.apellido,
            func.count(Cita.id).label("total_citas_completadas"),
            func.coalesce(func.sum(Cita.total), 0).label("ingresos_generados"),
        )
        .select_from(Terapeuta)
        .join(Usuario, Terapeuta.usuario_id == Usuario.id)
        .outerjoin(Cita, and_(Cita.terapeuta_id == Terapeuta.id, condiciones))
        .group_by(Terapeuta.id, Usuario.nombre, Usuario.apellido)
        .order_by(func.coalesce(func.sum(Cita.total), 0).desc())
        .all()
    )
    return [
        {
            "terapeuta_id": r.terapeuta_id,
            "nombre": r.nombre,
            "apellido": r.apellido,
            "total_citas_completadas": r.total_citas_completadas,
            "ingresos_generados": float(r.ingresos_generados),
        }
        for r in resultados
    ]
