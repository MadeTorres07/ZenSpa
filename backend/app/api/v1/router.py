from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.usuarios import router as usuarios_router
from app.api.v1.clientes import router as clientes_router
from app.api.v1.terapeutas import router as terapeutas_router
from app.api.v1.cabinas import router as cabinas_router
from app.api.v1.servicios import router as servicios_router
from app.api.v1.productos import router as productos_router

router = APIRouter(prefix="/api/v1")

router.include_router(auth_router)
router.include_router(usuarios_router)
router.include_router(clientes_router)
router.include_router(terapeutas_router)
router.include_router(cabinas_router)
router.include_router(servicios_router)
router.include_router(productos_router)
