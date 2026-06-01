import sys

import bcrypt
from sqlalchemy import create_engine, text

from app.core.config import settings


def seed_passwords():
    engine = create_engine(
        f"mysql+pymysql://{settings.DB_USER}:{settings.DB_PASSWORD}"
        f"@{settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}"
    )
    password = "ZenSpa2024!"
    hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    with engine.connect() as conn:
        conn.execute(text("UPDATE usuarios SET password_hash = :hash"), {"hash": hash})
        conn.commit()

    print("✅ Contraseñas de seed regeneradas correctamente.", flush=True)
