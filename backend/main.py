from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import router as v1_router
from app.core.config import settings
from app.core.database import check_db_connection


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Servidor ZenSpa Bienestar corriendo")
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
