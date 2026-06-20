from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import router as v1_router
from app.core.config import settings
from sqlalchemy import inspect, text

from app.core.database import check_db_connection, engine
from app.core.seed_passwords import seed_passwords


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Servidor ZenSpa Bienestar corriendo")
    try:
        inspector = inspect(engine)
        columns = [c["name"] for c in inspector.get_columns("servicios")]
        nuevos = [("descripcion", "TEXT"), ("beneficios", "TEXT"), ("incluye", "TEXT"),
                  ("recomendaciones", "TEXT"), ("contraindicaciones", "TEXT")]
        for nombre, tipo in nuevos:
            if nombre not in columns:
                with engine.connect() as conn:
                    conn.execute(text(f"ALTER TABLE servicios ADD COLUMN {nombre} {tipo} NULL"))
                    conn.commit()
                print(f"Columna '{nombre}' agregada a tabla servicios")
    except Exception as e:
        print(f"Migración automática de servicios: {e}")
    seed_passwords()
    yield


app = FastAPI(
    title="ZenSpa Bienestar API",
    version="1.0.0",
    docs_url="/api/docs",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(v1_router)


@app.get("/health")
def health():
    check_db_connection()
    return {"status": "ok", "database": "connected"}
