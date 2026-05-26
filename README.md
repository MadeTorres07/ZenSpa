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
| Autenticación JWT (bcrypt + HS256) | ✅ |
| Endpoints (scaffold) | ✅ `GET /health` — `GET /api/docs` (Swagger) |
| Docker | ✅ `Dockerfile` + `docker-compose.yml` |
| Alembic | ✅ Inicializado, sin migraciones aún |

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
- 9 usuarios (1 admin, 1 recepcionista, 3 terapeutas, 4 clientes)
- 4 cabinas (Serenidad, Armonía, Aqua, Aroma)
- 6 servicios, 8 citas en distintos estados
- Productos con stock bajo para probar alertas
- Contraseña común de prueba: `ZenSpa2024!`

---

## Cómo ejecutar

### Opción 1: Local (desarrollo)

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Crear `.env` desde `.env.example`:
```powershell
copy .env.example .env
# Editar: DB_USER, DB_PASSWORD, SECRET_KEY
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

### Opción 2: Docker (recomendado para otros PCs)

```powershell
# Requisito: Docker Desktop instalado y abierto
docker compose up --build
```

Esto levanta:
- **MySQL 8.0** con schema + seed + triggers cargados automáticamente
- **API** en `http://localhost:8000`

### Endpoints disponibles

| Ruta | Descripción |
|---|---|
| `GET /health` | Health check (status + conexión BD) |
| `GET /api/docs` | Swagger UI (documentación interactiva) |
| `GET /api/v1/...` | Endpoints REST (en construcción) |

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework web | FastAPI 0.115 |
| ORM | SQLAlchemy 2.0 |
| Migraciones | Alembic 1.14 (inicializado) |
| Base de datos | MySQL 8.0 |
| Autenticación | JWT (python-jose) + bcrypt (passlib) |
| Validación | Pydantic v2 |
| Servidor | Uvicorn 0.34 |
| Contenedores | Docker + Docker Compose |

---

## Próximos pasos

- [ ] Endpoints CRUD para todas las entidades
- [ ] Autenticación y registro de usuarios
- [ ] Lógica de negocio en capa de servicios
- [ ] Frontend Angular
- [ ] Pruebas automatizadas
