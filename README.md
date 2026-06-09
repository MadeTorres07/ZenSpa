# ZenSpa Bienestar

Sistema de gestión de citas y servicios para un spa. Desarrollado con **FastAPI** (backend) y **Angular 19** (frontend).

---

## Estado del proyecto

| Componente | Estado |
|---|---|
| Modelo Entidad-Relación (MER) | ✅ Diagrama Mermaid en `backend/database/mer_diagrama.md` |
| Schema SQL (10 tablas, 3NF) | ✅ `backend/database/schema.sql` |
| Seed data (pruebas) | ✅ `backend/database/seed.sql` |
| Triggers (solapamiento citas) | ✅ `backend/database/triggers.sql` |
| FastAPI + SQLAlchemy + Pydantic | ✅ |
| Autenticación JWT (bcrypt + HS256) | ✅ Login, /me, roles |
| CRUD Usuarios | ✅ Listar, crear, actualizar, desactivar (solo admin) |
| CRUD Clientes | ✅ Con ocultación de historial_salud por rol |
| CRUD Terapeutas | ✅ Con soft delete en dos tablas |
| CRUD Cabinas + servicios asociados | ✅ Validación de compatibilidad cabina-servicio |
| CRUD Servicios | ✅ Con validación de historial de citas |
| CRUD Productos | ✅ Con alerta stock_bajo y control de stock negativo |
| CRUD Citas | ✅ Con validación de solapamiento + snapshots de precio |
| Reportes | ✅ Servicios populares + ingresos por terapeuta |
| Docker | ✅ `Dockerfile` + `docker-compose.yml` con charset utf8mb4 |
| Auto‑seed de contraseñas | ✅ Hashes regenerados al iniciar la API (portátil entre máquinas) |
| Alembic | ✅ Configurado, migración inicial generada y aplicada |
| Endpoints REST | **36 endpoints** operativos |
| Angular 19 (standalone) | ✅ App shell, routing, guards, interceptor, auth |
| Login funcional | ✅ Login con JWT, redirección por rol |
| Módulos placeholder | ✅ 8 módulos esqueletos con rutas protegidas |
| Paleta spa premium | ✅ Variables CSS, Playfair Display + Inter |

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

### Validaciones (Triggers + Backend)
- No permitir agendar un terapeuta en dos citas simultáneas
- No permitir agendar una cabina en dos citas simultáneas
- Validación de compatibilidad entre tipo de cabina y tipo de servicio
- Control de stock: no permitir stock negativo al crear citas con productos
- Devolución automática de stock al cancelar citas

### Seed data
- 9 usuarios: Madeleine Torres (admin), Carlos López (recepcionista), 3 terapeutas, 4 clientes
- 4 cabinas (Serenidad, Armonía, Aqua, Aroma)
- 6 servicios, 8+ citas en distintos estados
- Productos con stock bajo para probar alertas
- Contraseña común de prueba: `ZenSpa2024!`

---

## Rutas del frontend

| Ruta | Componente | Roles permitidos |
|---|---|---|
| `/login` | LoginComponent | público |
| `/dashboard` | DashboardComponent | admin, recepcionista |
| `/agenda` | AgendaComponent | admin, recepcionista, terapeuta |
| `/clientes` | ClientesComponent | admin, recepcionista, terapeuta |
| `/terapeutas` | TerapeutasComponent | admin |
| `/servicios` | ServiciosComponent | admin |
| `/cabinas` | CabinasComponent | admin, recepcionista |
| `/inventario` | InventarioComponent | admin |
| `/reportes` | ReportesComponent | admin |
| `/sin-permiso` | SinPermisoComponent | público |

> Todos los módulos excepto login contienen solo un placeholder. El contenido visual se implementa en fases posteriores.

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

> ⚡ **Contraseñas listas de inmediato:** Al arrancar, la API regenera automáticamente los hashes bcrypt de todos los usuarios (`ZenSpa2024!`). No importa en qué máquina corras — funciona siempre sin pasos extra. Ver `backend/app/core/seed_passwords.py`.

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

### Frontend (Angular)

```powershell
cd frontend\zenspa
npx -y @angular/cli@19 serve
```

Esto arranca en `http://localhost:4200`. La app usa el proxy directo a `http://localhost:8000/api/v1` definido en `src/environments/environment.ts`.

Para login rápido: `admin@zenspa.com` / `ZenSpa2024!` → redirige a `/dashboard`.

---

## Autenticación en frontend

El frontend implementa autenticación vía OAuth2 Password Grant:

1. El componente **Login** envía `email` + `password` como `FormData` a `POST /auth/login`
2. El backend devuelve un `access_token` JWT + `rol` + `nombre`
3. `AuthService` guarda el token en `localStorage` (`zenspa_token`) y los datos de sesión (`zenspa_session`)
4. El **interceptor HTTP** inyecta `Authorization: Bearer <token>` en todas las requests a la API
5. Si el backend responde 401, el interceptor hace `logout()` automáticamente
6. **AuthGuard** protege las rutas; **RoleGuard** verifica el rol contra los permitidos en cada ruta

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
| `GET` | `/api/v1/auth/me` | Datos del usuario autenticado | ✅ c/sesión |

### Usuarios (prefix: `/api/v1/usuarios`)
| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| `GET` | `/api/v1/usuarios/` | Listar todos (filtro `?rol=`) | admin |
| `GET` | `/api/v1/usuarios/{id}` | Detalle de usuario | admin o propio |
| `POST` | `/api/v1/usuarios/` | Crear usuario | admin |
| `PUT` | `/api/v1/usuarios/{id}` | Actualizar (excepto password) | admin |
| `DELETE` | `/api/v1/usuarios/{id}` | Desactivar (soft delete) | admin |

### Clientes (prefix: `/api/v1/clientes`)
| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| `GET` | `/api/v1/clientes/` | Listar todos | admin, recep, terapeuta |
| `GET` | `/api/v1/clientes/{id}` | Detalle | admin, recep, terapeuta, propio |
| `POST` | `/api/v1/clientes/` | Crear cliente + usuario | admin, recep |
| `PUT` | `/api/v1/clientes/{id}` | Actualizar | admin, recep, terapeuta, propio |
| `DELETE` | `/api/v1/clientes/{id}` | Desactivar (soft delete) | admin |

> **Nota:** `historial_salud` solo visible para admin y terapeuta. Para recepcionista y cliente llega como `null`.

### Terapeutas (prefix: `/api/v1/terapeutas`)
| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| `GET` | `/api/v1/terapeutas/` | Listar (filtro `?activo=` `?especialidad=`) | admin |
| `GET` | `/api/v1/terapeutas/{id}` | Detalle | admin |
| `POST` | `/api/v1/terapeutas/` | Crear terapeuta + usuario | admin |
| `PUT` | `/api/v1/terapeutas/{id}` | Actualizar | admin |
| `DELETE` | `/api/v1/terapeutas/{id}` | Desactivar (soft delete en 2 tablas) | admin |

### Cabinas (prefix: `/api/v1/cabinas`)
| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| `GET` | `/api/v1/cabinas/` | Listar (filtro `?estado=` `?tipo_tratamiento=`) | ✅ c/sesión |
| `GET` | `/api/v1/cabinas/{id}` | Detalle | ✅ c/sesión |
| `GET` | `/api/v1/cabinas/{id}/servicios` | Servicios asociados a la cabina | ✅ c/sesión |
| `POST` | `/api/v1/cabinas/` | Crear cabina | admin |
| `PUT` | `/api/v1/cabinas/{id}` | Actualizar | admin |
| `DELETE` | `/api/v1/cabinas/{id}` | Eliminar (solo sin citas activas) | admin |
| `POST` | `/api/v1/cabinas/{id}/servicios/{s_id}` | Asociar servicio (valida compatibilidad) | admin |
| `DELETE` | `/api/v1/cabinas/{id}/servicios/{s_id}` | Desasociar servicio | admin |

### Servicios (prefix: `/api/v1/servicios`)
| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| `GET` | `/api/v1/servicios/` | Listar (filtro `?tipo_terapia=`) | ✅ c/sesión |
| `GET` | `/api/v1/servicios/{id}` | Detalle | ✅ c/sesión |
| `POST` | `/api/v1/servicios/` | Crear servicio | admin |
| `PUT` | `/api/v1/servicios/{id}` | Actualizar | admin |
| `DELETE` | `/api/v1/servicios/{id}` | Eliminar (solo sin historial de citas) | admin |

### Productos (prefix: `/api/v1/productos`)
| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| `GET` | `/api/v1/productos/` | Listar (filtro `?stock_bajo=true`) | admin, recep |
| `GET` | `/api/v1/productos/{id}` | Detalle | admin, recep |
| `POST` | `/api/v1/productos/` | Crear producto | admin |
| `PUT` | `/api/v1/productos/{id}` | Actualizar (stock nunca negativo) | admin |
| `DELETE` | `/api/v1/productos/{id}` | Eliminar (solo sin historial de uso) | admin |

### Citas (prefix: `/api/v1/citas`)
| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| `GET` | `/api/v1/citas/` | Listar con filtros | admin, recep, terapeuta, cliente |
| `GET` | `/api/v1/citas/{id}` | Detalle | admin, recep, terapeuta, cliente (solo propia) |
| `POST` | `/api/v1/citas/` | Crear cita con validación completa | admin, recep |
| `PUT` | `/api/v1/citas/{id}` | Actualizar estado/horario | admin, recep |
| `GET` | `/api/v1/citas/reportes/servicios-populares` | Ranking de servicios por reservas | admin |
| `GET` | `/api/v1/citas/reportes/ingresos-terapeutas` | Ingresos totales por terapeuta | admin |

> **Filtros del listado:** `?terapeuta_id=`, `?tipo_terapia=`, `?fecha_inicio=`, `?fecha_fin=`, `?estado=`

---

## Arquitectura del frontend

```
frontend/zenspa/src/
├── main.ts                        # Punto de entrada (bootstrap Angular)
├── index.html
├── styles.scss                    # Variables CSS globales (paleta spa)
├── environments/
│   ├── environment.ts             # apiUrl: http://localhost:8000/api/v1
│   └── environment.prod.ts
└── app/
    ├── app.component.ts           # <router-outlet /> raíz
    ├── app.config.ts              # Http interceptor, router, animaciones
    ├── app.routes.ts              # 10 rutas con guards por rol
    ├── core/
    │   ├── guards/
    │   │   ├── auth.guard.ts      # Redirige a /login si no hay token
    │   │   └── role.guard.ts      # Redirige a /sin-permiso si rol no autorizado
    │   ├── interceptors/
    │   │   └── auth.interceptor.ts # Inyecta Bearer token en cada request
    │   ├── models/
    │   │   └── index.ts           # Interfaces: Usuario, Cliente, Cita, AuthResponse…
    │   └── services/
    │       ├── auth.service.ts    # login, logout, sesión localStorage
    │       ├── cliente.service.ts # CRUD HTTP clientes
    │       ├── terapeuta.service.ts
    │       ├── cabina.service.ts
    │       ├── servicio.service.ts
    │       ├── producto.service.ts
    │       └── cita.service.ts    # CRUD + filtros + reportes
    ├── shared/components/
    │   ├── navbar/                # (pendiente)
    │   └── sidebar/               # (pendiente)
    └── modules/
        ├── auth/login/            # LoginComponent (funcional)
        ├── dashboard/             # Placeholder
        ├── agenda/                # Placeholder
        ├── clientes/              # Placeholder
        ├── terapeutas/            # Placeholder
        ├── servicios/             # Placeholder
        ├── cabinas/               # Placeholder
        ├── inventario/            # Placeholder
        └── reportes/              # Placeholder + SinPermisoComponent
```

### Patrón de flujo de autenticación

```
Login → AuthService.login() → POST /auth/login → JWT → localStorage
                                                      ↓
Interceptor → Authorization: Bearer JWT → cada GET/POST a la API
                                                      ↓
                                        401? → AuthService.logout() → /login
```

---

## Arquitectura del backend

```
backend/
├── main.py                        # Punto de entrada, lifespan, /health
├── alembic.ini
├── alembic/                       # Migraciones
│   └── versions/                  # Una migración inicial generada
├── app/
│   ├── core/
│   │   ├── config.py              # Settings con pydantic-settings
│   │   ├── database.py            # SQLAlchemy engine + session + Base
│   │   ├── security.py            # JWT, bcrypt, dependencias auth
│   │   └── seed_passwords.py      # Regenera hashes bcrypt al arrancar
│   ├── models/
│   │   ├── models.py              # 10 modelos SQLAlchemy
│   │   └── __init__.py            # Exporta Base + todos los modelos
│   ├── schemas/
│   │   └── schemas.py             # Schemas Pydantic (request/response)
│   ├── services/                  # Lógica de negocio
│   │   ├── usuario_service.py
│   │   ├── cliente_service.py
│   │   ├── terapeuta_service.py
│   │   ├── cabina_service.py
│   │   ├── servicio_service.py
│   │   ├── producto_service.py
│   │   └── cita_service.py        # Transacción atómica más compleja
│   └── api/v1/
│       ├── router.py              # Router principal que agrupa todos
│       ├── auth.py
│       ├── usuarios.py
│       ├── clientes.py
│       ├── terapeutas.py
│       ├── cabinas.py
│       ├── servicios.py
│       ├── productos.py
│       └── citas.py
```

### Patrón de capas

```
Router (endpoint HTTP) → Service (lógica de negocio) → Model (SQLAlchemy)
```

- Los **routers** solo manejan HTTP (parámetros, permisos, respuestas)
- Los **services** contienen toda la validación de negocio y transacciones
- Los **schemas** definen contratos de entrada/salida con Pydantic

---

## Reglas de seguridad implementadas

- **Contraseñas:** hasheadas con bcrypt antes de almacenar
- **JWT:** token expira cada 480 min, nunca incluye `password_hash`
- **Historial de salud:** campo sensible: solo admin/terapeuta lo ven, recepcionista y cliente lo reciben como `null`
- **Soft delete:** usuarios y clientes nunca se eliminan físicamente, solo se desactivan
- **Stock:** no puede quedar negativo al crear citas con productos; al cancelar se devuelve automáticamente
- **Mensajes genéricos:** en login no se distingue "email no encontrado" vs "contraseña incorrecta"

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

## Auto‑seed de contraseñas (`seed_passwords.py`)

El archivo `backend/app/core/seed_passwords.py` se ejecuta **cada vez que arranca la API** (vía el `lifespan` de FastAPI en `main.py`).

**¿Qué hace?**
- Conecta a la base de datos
- Genera un hash bcrypt **fresco** de `ZenSpa2024!` (usando `bcrypt.gensalt()`)
- Actualiza todos los usuarios con ese hash

**¿Por qué?**
Los hashes bcrypt son sensibles a diferencias entre entornos (versión de bcrypt, encoding, `$` en PowerShell). Al regenerarlos al inicio, el proyecto funciona en cualquier máquina sin depender del hash pre-generado en `seed.sql`.

**¿Y si cambio la contraseña de un usuario?**
El seed solo se aplica al arrancar, pisando TODAS las contraseñas con `ZenSpa2024!`. Si creas usuarios con otras contraseñas mediante la API, sus hashes se respetan (el script solo corre al inicio). Para desarrollo local es suficiente; en producción desactivarías este script.

---

## Stack tecnológico

### Backend
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

### Frontend
| Capa | Tecnología |
|---|---|
| Framework | Angular 19 (standalone, signals-ready) |
| UI / CDK | @angular/cdk 19 |
| Gráficos | Chart.js + ng2-charts |
| Fechas | date-fns |
| Tipografía | Playfair Display (headings) + Inter (cuerpo) |
| Paleta | Terracota #C8956C / Crema #FAF7F2

---

## Próximos pasos

- [ ] Navbar + Sidebar (shared components)
- [ ] Dashboard con tarjetas de resumen y gráficos
- [ ] Módulo de agenda (calendario de citas)
- [ ] CRUD visual: Clientes, Terapeutas, Cabinas, Servicios, Productos
- [ ] Creación y edición de citas desde el frontend
- [ ] Reportes con gráficos (Chart.js)
- [ ] Pruebas automatizadas (pytest backend + Jasmine/Karma frontend)
- [ ] Módulo de experiencia / fidelización
- [ ] Despliegue con Docker compose completo (backend + frontend + nginx)
