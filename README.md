# ZenSpa Bienestar

Sistema de gestión de citas y servicios para un spa. Desarrollado con **FastAPI** (backend) y **Angular** (frontend — próximamente).

---

## Estado del proyecto — Fase 1 (Backend) ✅

| Componente | Estado |
|---|---|
| Modelo Entidad-Relación (MER) | ✅ Diagrama Mermaid en `backend/database/mer_diagrama.md` |
| Schema SQL (10 tablas, 3NF) | ✅ `backend/database/schema.sql` |
| Seed data (pruebas) | ✅ `backend/database/seed.sql` |
| Triggers (solapamiento citas) | ✅ `backend/database/triggers.sql` |
| FastAPI + SQLAlchemy + Pydantic | ✅ |
| Autenticación JWT (bcrypt + HS256) | ✅ Login, /me, roles |
| CRUD Usuarios | ✅ Listar, crear, actualizar, desactivar (solo admin) |
| CRUD Clientes/Terapeutas/Cabinas/Servicios/Productos/Citas | 🔜 Pendiente |
| Docker | ✅ `Dockerfile` + `docker-compose.yml` con charset utf8mb4 |
| Alembic | ✅ Configurado, migración inicial generada y aplicada |
| Endpoints REST | ✅ 8 endpoints operativos |

---

## Base de datos — Modelo

### Diagrama MER

![MER](backend/database/mer_diagrama.md)
*(Ábrelo en VSCode con extensión Mermaid o en GitHub para ver el diagrama)*

### 10 tablas en 3FN

```
usuarios ──┬── clientes    (extensión de perfil)
           └── terapeutas  (extensión de perfil)
cabinas        (con tipo de tratamiento y estado)
servicios     (con precio histórico snapshot en cita_servicios)
cabina_servicios  (M:N cabinas ↔ servicios)
productos     (con stock y alerta por stock_minimo)
citas         (con validación de solapamiento por trigger)
cita_servicios   (M:N citas ↔ servicios con precio_aplicado)
uso_productos    (productos consumidos en citas completadas)
```

### Validaciones (Triggers)
- No permitir agendar un terapeuta en dos citas simultáneas
- No permitir agendar una cabina en dos citas simultáneas

### Seed data
- 9 usuarios: Madeleine Torres (admin), Carlos López (recepcionista), 3 terapeutas, 4 clientes
- 4 cabinas (Serenidad, Armonía, Aqua, Aroma)
- 6 servicios, 8 citas en distintos estados
- Productos con stock bajo para probar alertas
- Contraseña común de prueba: `ZenSpa2024!`

---

## Cómo ejecutar

### Opción 1: Docker (recomendado)

```powershell
# Requisito: Docker Desktop instalado y abierto
docker compose up --build
```

Esto levanta:
- **MySQL 8.0** con charset utf8mb4, schema + seed + triggers cargados automáticamente
- **API** en `http://localhost:8000`

### Opción 2: Local (desarrollo)

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Crear `.env` desde `.env.example`:
```powershell
copy .env.example .env
# Editar: DB_HOST, DB_USER, DB_PASSWORD, SECRET_KEY
# Generar SECRET_KEY: python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Asegurar MySQL corriendo con base `zenspa_db` creada y datos cargados:
```powershell
mysql -u root -p
CREATE DATABASE IF NOT EXISTS zenspa_db;
USE zenspa_db;
SOURCE backend/database/schema.sql;
SOURCE backend/database/seed.sql;
SOURCE backend/database/triggers.sql;
```

Arrancar:
```powershell
uvicorn main:app --reload --port 8000
```

---

## Autenticación

### Login

`POST /api/v1/auth/login`

Envía credenciales vía form-data (`grant_type=password`, `username`, `password`). El `username` es el email.

Respuesta:
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "rol": "admin",
  "nombre": "Madeleine"
}
```

### Token JWT

El payload incluye:
- `sub`: ID del usuario
- `rol`: rol del usuario
- `nombre`: nombre del usuario

Duración: configurable via `ACCESS_TOKEN_EXPIRE_MINUTES` (default 480 min = 8 hrs).

### Uso en Swagger

1. `POST /api/v1/auth/login` → copiar `access_token`
2. Arriba a la derecha: **Authorize** → pegar `Bearer <token>`
3. Los endpoints protegidos ya muestran el candado cerrado

---

## Endpoints disponibles

### Salud
| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| `GET` | `/health` | Health check + conexión BD | ❌ |
| `GET` | `/api/docs` | Swagger UI | ❌ |

### Autenticación (prefix: `/api/v1/auth`)
| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| `POST` | `/api/v1/auth/login` | Iniciar sesión (devuelve JWT) | ❌ |
| `GET` | `/api/v1/auth/me` | Datos del usuario autenticado | ✅ |

### Usuarios (prefix: `/api/v1/usuarios`)
| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| `GET` | `/api/v1/usuarios/` | Listar todos (filtro `?rol=`) | admin |
| `GET` | `/api/v1/usuarios/{id}` | Detalle de usuario | admin o propio |
| `POST` | `/api/v1/usuarios/` | Crear usuario | admin |
| `PUT` | `/api/v1/usuarios/{id}` | Actualizar (excepto password) | admin |
| `DELETE` | `/api/v1/usuarios/{id}` | Desactivar (soft delete) | admin |

---

## Migraciones con Alembic

Alembic está configurado y la migración inicial está generada y aplicada.

```powershell
# Ver estado actual
docker exec zenspa-api alembic current

# Crear nueva migración (después de cambiar models.py)
docker exec zenspa-api alembic revision --autogenerate -m "descripcion"

# Aplicar migraciones pendientes
docker exec zenspa-api alembic upgrade head

# Revertir última migración
docker exec zenspa-api alembic downgrade -1
```

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework web | FastAPI 0.115 |
| ORM | SQLAlchemy 2.0 |
| Migraciones | Alembic 1.14 |
| Base de datos | MySQL 8.0 (charset utf8mb4) |
| Autenticación | JWT (python-jose) + bcrypt 4.0 |
| Validación | Pydantic v2 + EmailStr |
| Servidor | Uvicorn 0.34 |
| Contenedores | Docker + Docker Compose |

---

## Próximos pasos

- [ ] CRUD Clientes
- [ ] CRUD Terapeutas
- [ ] CRUD Cabinas
- [ ] CRUD Servicios
- [ ] CRUD Productos
- [ ] CRUD Citas + validación solapamiento
- [ ] Lógica de negocio en capa de servicios
- [ ] Frontend Angular
- [ ] Pruebas automatizadas
