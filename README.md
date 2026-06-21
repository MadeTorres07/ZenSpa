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
| Login split‑screen | ✅ Panel decorativo + formulario con toggle password, recordarme |
| Navbar responsive | ✅ Logo lotus + links por rol + avatar + hamburguesa |
| Dashboard Admin/Recep | ✅ Hero contextual + KPIs + agenda lateral + mini‑calendario |
| Landing page | ✅ Hero, servicios, stats, testimonios, CTA, footer con newsletter |
| Agenda funcional | ✅ Creación, edición, cancelación, auto-cancel vencidas, notas, vista por rol |
| CRUD Clientes | ✅ Completo con ocultación de historial_salud por rol |
| CRUD Terapeutas | ✅ Con filtro de especialidad y bloqueo de eliminación si tiene citas |
| CRUD Cabinas + Servicios | ✅ CRUD completo con validación de compatibilidad |
| CRUD Productos | ✅ Con alerta stock_bajo y control de stock negativo |
| Reportes | ✅ Servicios populares + ingresos por terapeuta (Chart.js) |
| Docker frontend | ✅ Multi‑stage build (node → nginx), reverse proxy `/api/` |
| Newsletter | ✅ Suscripción con validación y almacenamiento en BD |
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

## Roles del sistema

### 👑 Admin
Acceso completo a todos los módulos. Puede crear, editar y eliminar cualquier recurso.

| Puede hacer | No puede hacer |
|---|---|
| CRUD completo de usuarios, clientes, terapeutas, cabinas, servicios, productos | — |
| Crear y editar citas (cualquier terapeuta/cabina) | — |
| Ver y eliminar clientes (con protección de historial) | — |
| Acceder a reportes de servicios populares e ingresos | — |
| Gestionar inventario (productos, stock) | — |

### 🧑‍💼 Recepcionista
Gestión del día a día: clientes, citas, consultas básicas.

| Puede hacer | No puede hacer |
|---|---|
| Ver clientes, terapeutas, cabinas, servicios, productos | Eliminar clientes (solo admin) |
| Crear y editar citas (asignar terapeuta, cabina, servicios) | Administrar usuarios del sistema |
| Ver citas del día y filtrar por fechas | Ver historial de salud de clientes |
| Cancelar citas | Acceder a reportes |
| Crear nuevos clientes | Gestionar inventario (solo lectura) |

### 💆 Terapeuta
Visión de su propia agenda para gestionar sus citas.

| Puede hacer | No puede hacer |
|---|---|
| Ver sus citas del día (auto-filtradas) | Crear nuevas citas |
| Marcar citas como completadas (solo después de la hora de fin) | Ver lista de otros terapeutas |
| Agregar observaciones a sus citas | Editar horarios, cabina o servicios de una cita |
| Ver perfil de clientes asignados | Cancelar citas |
| | Acceder a reportes, usuarios, inventario |

### 👤 Cliente
Autogestión de sus propias citas.

| Puede hacer | No puede hacer |
|---|---|
| Ver sus citas (solo las suyas) | Crear nuevas citas |
| Confirmar una cita pendiente | Editar citas ya confirmadas |
| Cancelar una cita pendiente | Ver citas de otros clientes |
| | Ver historial de salud |
| | Acceder a otros módulos |

---

## Rutas del frontend

| Ruta | Componente | Roles permitidos |
|---|---|---|
| `/` | LandingComponent | público |
| `/login` | LoginComponent | público |
| `/dashboard` | DashboardComponent | admin, recepcionista |
| `/agenda` | AgendaComponent | admin, recepcionista, terapeuta, cliente |
| `/mis-citas` | AgendaComponent | admin, recepcionista, terapeuta, cliente |
| `/clientes` | ClientesComponent | admin, recepcionista, terapeuta |
| `/terapeutas` | TerapeutasComponent | admin |
| `/servicios` | ServiciosComponent | admin |
| `/cabinas` | CabinasComponent | admin, recepcionista |
| `/inventario` | InventarioComponent | admin |
| `/reportes` | ReportesComponent | admin |
| `/usuarios/nuevo` | NuevoUsuarioComponent | admin |
| `/sin-permiso` | SinPermisoComponent | público |

---

## Credenciales de prueba

| Rol | Email | Contraseña |
|---|---|---|
| Admin | `admin@zenspa.com` | `ZenSpa2024!` |
| Recepcionista | `carlos@zenspa.com` | `ZenSpa2024!` |
| Terapeuta | `laura@zenspa.com` | `ZenSpa2024!` |
| Cliente | `ana@email.com` | `ZenSpa2024!` |

> Todas las contraseñas se regeneran automáticamente al iniciar la API. No importa el entorno, siempre funcionan con `ZenSpa2024!`.

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
- **Frontend** (Angular + nginx) en `http://localhost:4200`

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

> **Con Docker**: el frontend se sirve vía nginx con proxy inverso `/api/` → `api:8000`, sin CORS. Usa el perfil `environment.docker.ts` (cambia `apiUrl` a `/api/v1`).

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
| `GET` | `/api/v1/terapeutas/` | Listar (filtro `?activo=` `?especialidad=`) | admin, recepcionista |
| `GET` | `/api/v1/terapeutas/{id}` | Detalle | admin, recepcionista |
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
| `PUT` | `/api/v1/citas/{id}` | Actualizar estado/horario | admin, recep, terapeuta, cliente |
| `GET` | `/api/v1/citas/reportes/servicios-populares` | Ranking de servicios por reservas | admin |
| `GET` | `/api/v1/citas/reportes/ingresos-terapeutas` | Ingresos totales por terapeuta | admin |

> **Nota para roles:**  
> - **Terapeuta**: solo puede cambiar `estado` y `notas` de sus propias citas  
> - **Cliente**: solo puede cambiar `estado` de `"pendiente"` → `"confirmada"` o `"cancelada"` en citas propias
| `GET` | `/api/v1/citas/reportes/servicios-populares` | Ranking de servicios por reservas | admin |
| `GET` | `/api/v1/citas/reportes/ingresos-terapeutas` | Ingresos totales por terapeuta | admin |

> **Filtros del listado:** `?terapeuta_id=`, `?tipo_terapia=`, `?fecha_inicio=`, `?fecha_fin=`, `?estado=`

### Newsletter (prefix: `/api/v1/newsletter`)
| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| `POST` | `/api/v1/newsletter/suscribir` | Suscribir correo a novedades | ❌ público |

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
    │   └── navbar/                # Logo lotus + menú por rol + avatar + responsive
    └── modules/
        ├── auth/login/            # Login split-screen (panel decorativo + formulario)
        ├── dashboard/             # Hero + KPIs + agenda lateral + mini‑calendario
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

---

## Pruebas del sistema

### Prueba de caja negra

El tester **no** tiene acceso al código interno. Cada función se especifica con su firma, comportamiento esperado y reglas de validación.

> **Formato:** `funcion(parametros)` → `tipo_retorno`  
> *Descripción breve*  
> **Reglas:** condiciones que debe cumplir la función

---

#### 1. `validar_login(email, password)` → `bool`

Verifica que las credenciales correspondan a un usuario registrado y activo.

**Reglas:**
- `email` no puede estar vacío
- `password` debe tener al menos 6 caracteres
- Solo los usuarios existentes en la tabla `usuarios` con `activo = true` pueden autenticarse
- Retorna `true` solo si email existe y password coincide con el hash almacenado
- En cualquier otro caso retorna `false`

---

#### 2. `crear_cliente(nombre, apellido, email, password, telefono)` → `bool`

Registra un nuevo cliente en el sistema, creando el usuario y su perfil de cliente.

**Reglas:**
- Todos los campos obligatorios deben estar presentes (nombre, apellido, email, password)
- `nombre` y `apellido`: solo letras y espacios, mínimo 2 caracteres, máximo 100
- `email` debe tener formato válido (`usuario@dominio.com`)
- `email` no puede repetirse con otro usuario existente
- `password` debe tener mínimo 8 caracteres, al menos una mayúscula, un número y un carácter especial
- `telefono` (opcional): si se envía, debe tener entre 7 y 20 dígitos (puede incluir `+`, `-`, espacios, paréntesis)
- Retorna `true` si el cliente se crea exitosamente
- Retorna `false` si alguna validación falla o el email ya existe

---

#### 3. `agendar_cita(cliente_id, terapeuta_id, cabina_id, fecha, hora_inicio, hora_fin, servicios)` → `int | None`

Crea una nueva cita con validación completa de recursos y disponibilidad.

**Reglas:**
- Todos los IDs deben corresponder a registros existentes
- `fecha` debe ser una fecha válida (formato `YYYY-MM-DD`)
- `hora_inicio` debe ser anterior a `hora_fin`
- La cita debe estar dentro del horario de atención (08:00 – 18:00)
- El terapeuta no puede tener otra cita en el mismo horario (mismo día, horario solapado)
- La cabina no puede tener otra cita en el mismo horario
- La cabina debe ser compatible con al menos uno de los servicios seleccionados (coincidencia de `tipo_tratamiento`)
- `servicios` debe contener al menos un ID de servicio válido
- Retorna el `id` de la cita creada si es exitoso
- Retorna `None` si alguna validación falla

---

#### 4. `validar_stock_disponible(producto_id, cantidad)` → `bool`

Verifica que un producto tenga stock suficiente para una operación.

**Reglas:**
- `producto_id` debe existir en la tabla `productos`
- `cantidad` debe ser un entero positivo mayor a 0
- El stock actual del producto debe ser mayor o igual a `cantidad`
- Retorna `true` si hay stock suficiente
- Retorna `false` si el producto no existe, cantidad es inválida, o stock insuficiente

---

#### 5. `eliminar_servicio(servicio_id)` → `bool`

Elimina un servicio del sistema si no tiene citas asociadas.

**Reglas:**
- `servicio_id` debe existir en la tabla `servicios`
- El servicio no debe tener registros en `cita_servicios` (historial de citas)
- Si tiene historial, retorna `false` con mensaje "El servicio tiene historial de citas, no se puede eliminar"
- Si no tiene historial, elimina el servicio y sus asociaciones en `cabina_servicios`
- Retorna `true` si la eliminación es exitosa
- Retorna `false` si el servicio no existe o tiene historial

---

#### 6. `calcular_total_cita(servicios_ids, productos_consumo)` → `float`

Calcula el costo total de una cita sumando servicios y productos.

**Reglas:**
- `servicios_ids`: lista de IDs de servicios; cada servicio debe existir
- `productos_consumo`: lista de objetos `{producto_id, cantidad}`; cada producto debe existir
- El total es la suma de: `(precio de cada servicio) + sumatoria(costo_unitario * cantidad de cada producto)`
- Retorna el total como número flotante
- Retorna `0.0` si ambas listas están vacías

---

#### 7. `validar_disponibilidad_terapeuta(terapeuta_id, fecha, hora_inicio, hora_fin)` → `bool`

Verifica si un terapeuta está disponible en una franja horaria específica.

**Reglas:**
- `terapeuta_id` debe existir en la tabla `terapeutas` y estar activo
- `fecha` debe ser una fecha válida
- La franja debe estar dentro del horario laboral (08:00 – 18:00)
- No debe existir otra cita con el mismo terapeuta en la misma fecha con horario solapado
- Se considera solapamiento si: `nueva_hora_inicio < cita_existente_hora_fin` Y `nueva_hora_fin > cita_existente_hora_inicio`
- Retorna `true` si está disponible
- Retorna `false` en cualquier otro caso

---

#### 8. `validar_disponibilidad_cabina(cabina_id, fecha, hora_inicio, hora_fin)` → `bool`

Verifica si una cabina está disponible en una franja horaria específica.

**Reglas:**
- `cabina_id` debe existir en la tabla `cabinas` y su estado debe ser "disponible"
- `fecha` debe ser una fecha válida
- No debe existir otra cita con la misma cabina en la misma fecha con horario solapado
- Retorna `true` si está disponible
- Retorna `false` en cualquier otro caso

---

#### 9. `ajustar_stock(producto_id, cantidad, tipo_operacion)` → `int | None`

Ajusta el stock de un producto (entrada o salida).

**Reglas:**
- `producto_id` debe existir en la tabla `productos`
- `cantidad` debe ser un entero positivo mayor a 0
- `tipo_operacion` debe ser `"entrada"` o `"salida"`
- Si es `"entrada"`: nuevo stock = stock actual + cantidad
- Si es `"salida"`: nuevo stock = stock actual - cantidad; el resultado no puede ser negativo
- Retorna el nuevo stock si la operación es exitosa
- Retorna `None` si el producto no existe, cantidad inválida, o la salida deja stock negativo

---

#### 10. `registrar_uso_producto(cita_id, producto_id, cantidad)` → `bool`

Registra el consumo de un producto en una cita completada.

**Reglas:**
- `cita_id` debe existir en la tabla `citas` y estar en estado "completada"
- `producto_id` debe existir en la tabla `productos`
- `cantidad` debe ser un entero positivo
- Debe haber stock suficiente del producto (ver `validar_stock_disponible`)
- Registra el consumo en `uso_productos` con el `costo_aplicado` = costo_unitario actual del producto
- Descuenta la cantidad del stock del producto
- Retorna `true` si el registro es exitoso
- Retorna `false` si alguna validación falla

---

#### 11. `generar_reporte_servicios_populares(fecha_inicio, fecha_fin)` → `list`

Genera un ranking de servicios más reservados en un período.

**Reglas:**
- `fecha_inicio` y `fecha_fin` deben ser fechas válidas (formato `YYYY-MM-DD`)
- `fecha_inicio` debe ser anterior o igual a `fecha_fin`
- El período no puede exceder 365 días
- Retorna una lista ordenada de objetos `{servicio_id, nombre, total_reservas}`, de mayor a menor por `total_reservas`
- Solo considera citas en estado "completada"
- Retorna lista vacía si no hay servicios en el período

---

#### 12. `filtrar_usuarios_por_rol(rol)` → `list`

Obtiene todos los usuarios de un rol específico.

**Reglas:**
- `rol` debe ser uno de: `"admin"`, `"recepcionista"`, `"terapeuta"`, `"cliente"`
- Retorna una lista de objetos con `{id, nombre, apellido, email, rol, activo}`
- Solo retorna usuarios con `activo = true`
- Si el rol no es válido, retorna lista vacía

---

### Prueba de caja blanca

El tester **sí** tiene acceso al código interno. Se verifican caminos lógicos, condiciones, ciclos y flujos de datos.

| # | Función / Archivo | Camino probado | Entrada | Salida esperada | Cobertura |
|---|---|---|---|---|---|
| 1 | `producto_service.validar_nombre` | Nombre duplicado en create | `data.nombre="Aceite"` (ya existe) | HTTP 400 "Ya existe un producto con ese nombre" | Líneas 42–47 |
| 2 | `producto_service.validar_nombre` | Nombre único en create | `data.nombre="Nuevo Producto"` | Producto creado (dict con id > 0) | Líneas 48–61 |
| 3 | `producto_service.update` | Nombre duplicado en update (otro producto) | `data.nombre="Aceite"`, id distinto | HTTP 400 "Ya existe un producto con ese nombre" | Líneas 70–80 |
| 4 | `producto_service.delete` | Producto sin historial de uso | producto_id sin UsoProducto | dict del producto eliminado | Líneas 101–104 |
| 5 | `producto_service.delete` | Producto con historial de uso | producto_id con UsoProducto | HTTP 400 "tiene historial de uso" | Líneas 97–100 |
| 6 | `main.py lifespan` | Migración automática: columna faltante | tabla sin columna `descripcion` | ALTER TABLE ejecutado | Líneas 18–27 |
| 7 | `main.py lifespan` | Migración automática: columna ya existe | tabla con columna `descripcion` | No ejecuta ALTER | Línea 23 |
| 8 | `schemas.ProductoCreate.validar_costo` | costo_unitario < 5000 | `costo_unitario = 1000` | ValueError "mínimo es \$5.000" | Línea (validator) |
| 9 | `schemas.ProductoCreate.validar_costo` | costo_unitario >= 5000 | `costo_unitario = 5000` | Valor aceptado | Línea (validator) |
| 10 | `producto_service._producto_to_dict` | Serialización correcta | Producto con datos completos | dict con 10 campos, costo como float | Líneas 8–20 |

---

### Pruebas unitarias

Verifican funciones individuales de forma aislada.

| # | Unidad | Prueba | Entrada | Resultado esperado |
|---|---|---|---|---|
| 1 | `_validar_nombre_apellido` | Nombre vacío | `""` | ValueError "no puede estar vacío" |
| 2 | `_validar_nombre_apellido` | Nombre con números | `"Juan123"` | ValueError "Solo se permiten letras" |
| 3 | `_validar_nombre_apellido` | Nombre válido | `"  maría  "` | `"María"` (trim + title) |
| 4 | `_validar_password` | Password corta | `"Ab1!"` | ValueError "al menos 8 caracteres" |
| 5 | `_validar_password` | Password sin mayúscula | `"abcdef1!"` | ValueError "al menos una mayúscula" |
| 6 | `_validar_password` | Password sin especial | `"Abcdefgh1"` | ValueError "al menos un carácter especial" |
| 7 | `_validar_password` | Password válida | `"Abcdef1!"` | `"Abcdef1!"` |
| 8 | `producto_service._producto_to_dict` | Producto con campos nulos | Producto con `descripcion=None` | `descripcion: null` en dict |
| 9 | `producto_service._producto_to_dict` | Producto con fecha_vencimiento | Producto con fecha `2025-12-31` | `fecha_vencimiento: "2025-12-31"` |
| 10 | `producto_service._producto_to_dict` | costo_unitario Decimal a float | Decimal("15000.50") | `15000.5` (float) |

---

### Pruebas de integración

Verifican que los módulos interactúen correctamente entre sí.

| # | Escenario | Pasos | Resultado esperado |
|---|---|---|---|
| 1 | Crear cliente → login → obtener perfil | 1. `POST /auth/registro` con datos válidos<br>2. `POST /auth/login` con mismas credenciales<br>3. `GET /auth/me` con token recibido | 1. 201 Created<br>2. 200 OK + JWT<br>3. 200 OK + email coincide |
| 2 | Crear cita descontando stock | 1. Ver stock producto X = 10<br>2. Crear cita con producto X, cantidad 3<br>3. Ver stock producto X | Stock final = 7 |
| 3 | Cancelar cita devuelve stock | 1. Crear cita con producto X, cantidad 2 (stock = 8)<br>2. Cancelar cita<br>3. Ver stock producto X | Stock vuelve a 10 |
| 4 | Asociar servicio a cabina incompatible | 1. Crear cabina tipo "facial"<br>2. Crear servicio tipo "masajes"<br>3. `POST /cabinas/{id}/servicios/{s_id}` | 400 Bad Request (incompatible) |
| 5 | Eliminar producto con historial | 1. Crear cita con uso de producto X<br>2. `DELETE /productos/{id}` | 400 Bad Request |
| 6 | Auto-creación de perfil al crear usuario | 1. `POST /usuarios/` con rol="terapeuta"<br>2. `GET /terapeutas/?usuario_id={nuevo_id}` | 200 OK + terapeuta existe |

---

### Pruebas de sistema

Verifican flujos completos de principio a fin (end-to-end).

| # | Caso de uso | Pasos | Criterio de aceptación |
|---|---|---|---|
| 1 | Registro de nuevo cliente | 1. Acceder a `/login` → "Registrarse"<br>2. Completar formulario con datos válidos<br>3. Enviar | Redirige a `/dashboard`, navbar muestra nombre del cliente |
| 2 | Agendar cita completa | 1. Login como recepcionista<br>2. Ir a agenda → "Nueva cita"<br>3. Seleccionar cliente, terapeuta, cabina, fecha, hora, servicios<br>4. Confirmar | Cita aparece en agenda, stock de productos descontado |
| 3 | Reporte de servicios populares | 1. Login como admin<br>2. Ir a reportes<br>3. Seleccionar filtro de fechas<br>4. Generar | Gráfico de barras con servicios ordenados por popularidad |
| 4 | Gestión de inventario | 1. Login como admin<br>2. Ir a inventario<br>3. Crear nuevo producto con costo \$10.000 y stock 50<br>4. Verificar KPI de valor de inventario | Producto visible en tabla, KPI refleja \$500.000 |
| 5 | Login con credenciales inválidas | 1. Ir a `/login`<br>2. Ingresar email inexistente y contraseña<br>3. Enviar | Mensaje genérico: "Email o contraseña incorrectos", sin revelar cuál falló |

---

### Pruebas de aceptación

Validan que el sistema cumple los requisitos del negocio.

| # | Criterio | Descripción | Estado |
|---|---|---|---|
| 1 | Seguridad de contraseñas | Todas las contraseñas se almacenan hasheadas con bcrypt; nunca en texto plano | ✅ |
| 2 | Control de acceso por rol | Un recepcionista no puede crear/editar/eliminar usuarios admin; un cliente solo ve sus propias citas | ✅ |
| 3 | Protección de datos sensibles | `historial_salud` solo accesible para admin y terapeuta; recepcionista y cliente reciben `null` | ✅ |
| 4 | Integridad del stock | El stock nunca puede quedar negativo; al cancelar citas se devuelve el stock automáticamente | ✅ |
| 5 | Prevención de doble agendamiento | No se puede agendar un terapeuta o cabina en dos citas simultáneas | ✅ |
| 6 | Compatibilidad cabina-servicio | Solo se pueden asociar servicios a cabinas con el mismo `tipo_tratamiento` | ✅ |
| 7 | Historial de precios | El precio de un servicio al momento de la cita queda congelado en `cita_servicios.precio_aplicado` | ✅ |
| 8 | UX: mensajes claros | Los errores de formulario muestran mensajes intuitivos (ej: "El costo unitario mínimo es \$5.000", no errores técnicos) | ✅ |
| 9 | Migración automática | Nuevas columnas se agregan automáticamente al iniciar la API sin intervención manual | ✅ |
| 10 | Portabilidad | El proyecto funciona con `docker compose up --build` sin configuración manual; contraseñas de prueba regeneradas automáticamente | ✅ |

---

## Próximos pasos

- [ ] Pruebas automatizadas (pytest backend + Jasmine/Karma frontend)
- [ ] Módulo de experiencia / fidelización
- [ ] Notificaciones por email/WhatsApp al crear/confirmar citas
- [ ] Panel de administración de contenido del landing page
- [ ] Optimización de rendimiento (lazy loading, SSR)
