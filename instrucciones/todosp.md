Prompt Fase 1 — listo para copiar en OpenCode
Este es el primer prompt que le envías. Cópialo tal cual:

[FASE 1 — MODELO DE DATOS ZENSPA]
Eres un desarrollador backend senior. Vamos a construir el sistema ZenSpa Bienestar, un spa management system. En esta fase SOLO vas a hacer el diseño de base de datos. Nada de código Python todavía.
Stack: MySQL 8, normalización 3NF, SQLAlchemy (para referencia de tipos), Alembic para migraciones.
Entrega exacta que necesito:

Script SQL completo (schema.sql) con CREATE TABLE en este orden y con estas reglas:

usuarios (id, nombre, email UNIQUE, password_hash VARCHAR(255), rol ENUM('admin','recepcionista','terapeuta','cliente'), activo BOOL, created_at)
clientes (id, usuario_id FK→usuarios, nombre, apellido, telefono, fecha_nacimiento, historial_salud TEXT, preferencias TEXT, created_at)
terapeutas (id, usuario_id FK→usuarios, nombre, apellido, especialidad, certificaciones TEXT, activo BOOL)
cabinas (id, nombre, tipo_tratamiento ENUM('masajes','facial','hidroterapia','aromaterapia','multiple'), estado ENUM('disponible','ocupada','mantenimiento'), equipamiento TEXT)
servicios (id, nombre, duracion_minutos INT, precio DECIMAL(10,2), tipo_terapia ENUM igual que cabina)
cabina_servicios (cabina_id FK, servicio_id FK) — tabla intermedia M:N
productos (id, nombre, stock INT DEFAULT 0, costo_unitario DECIMAL(10,2), stock_minimo INT DEFAULT 5)
citas (id, cliente_id FK, terapeuta_id FK, cabina_id FK, fecha DATE, hora_inicio TIME, hora_fin TIME, estado ENUM('pendiente','confirmada','completada','cancelada','cancelada_penalidad'), total DECIMAL(10,2), created_at)
cita_servicios (cita_id FK, servicio_id FK, precio_aplicado DECIMAL(10,2)) — M:N con precio snapshot
uso_productos (id, cita_id FK, producto_id FK, cantidad INT, costo_aplicado DECIMAL(10,2))

Constraints obligatorios:

CHECK en citas: hora_fin > hora_inicio
INDEX en citas(fecha, hora_inicio), citas(terapeuta_id), citas(cabina_id)
UNIQUE en usuarios(email)
FK con ON DELETE RESTRICT en todas las relaciones (no queremos borrados en cascada que destruyan historial)

Script de seed (seed.sql) con datos de prueba realistas:

1 usuario admin, 1 recepcionista, 3 terapeutas, 4 clientes
4 cabinas, 6 servicios, 6 productos, 8 citas con diferentes estados
Las contraseñas en seed deben ser hashes bcrypt válidos (usa $2b$12$... como placeholder con nota de que se deben regenerar)

Diagrama MER en formato texto (tipo ASCII o Mermaid erDiagram) mostrando todas las entidades y relaciones con cardinalidad.

Reglas de seguridad que debes respetar:

NUNCA stores contraseñas en texto plano, ni en seed, ni en comentarios
Todos los IDs deben ser INT AUTO_INCREMENT o UUID (elige uno y sé consistente)
El campo historial_salud debe tener comentario SQL indicando que es dato sensible

NO hagas todavía: código Python, proyecto FastAPI, carpetas del proyecto, nada de frontend.
Cuando termines, muéstrame el schema.sql completo y el seed.sql completo. Los revisaré antes de continuar.

Qué debo revisar yo cuando OpenCode te entregue la Fase 1
Cuando me muestres lo que OpenCode produjo, voy a verificar:

Que existan las dos tablas intermedias M:N (cabina_servicios y cita_servicios)
Que cita_servicios tenga precio_aplicado (snapshot histórico del precio)
Que no haya ninguna contraseña en texto plano en el seed
Que los ENUMs sean correctos y coherentes entre servicios y cabinas
Que existan los índices de rendimiento en citas
Que uso_productos tenga la lógica para descontar inventario

Sobre el diseño visual (tu imagen de referencia)
La imagen que adjuntaste es excelente y la vamos a respetar. En la Fase 8 le daré a OpenCode un prompt de diseño detallado con:

Paleta exacta (los tonos tierra/crema/dorado que se ven)
Tipografía (serif elegante para headings, sans limpio para datos)
Dashboard contextual por rol (no el mismo para todos)
El módulo de agenda como el más poderoso visualmente
Fichas clínicas de cliente estilo "premium spa"
Cards de terapeutas editoriales, no tablas

Pero eso va en la Fase 8. Primero el backend sólido.

¿Listo para empezar? Copia el prompt de Fase 1 en OpenCode y cuando te entregue los archivos SQL, muéstramelos aquí. Los reviso y te doy el prompt de Fase 2.

Tienes toda la razón en ambos puntos. Vamos a resolverlos antes de tocar código.
Mi análisis y decisión
Sobre nombre/apellido duplicado:
Para un spa, lo más limpio es el modelo de extensión de perfil: usuarios tiene la identidad, clientes y terapeutas son solo perfiles con datos del dominio. Sin duplicación, sin riesgo de inconsistencia. La única concesión es que las queries van a necesitar JOIN con usuarios para mostrar el nombre, pero eso es exactamente lo correcto en SQL normalizado.
Sobre los overlaps en citas:
Tienes razón, el CHECK no ayuda ahí. Para MySQL la solución más robusta y que no depende de que el backend esté bien escrito es un TRIGGER BEFORE INSERT/UPDATE que valide solapamiento. La validación backend va igual, pero el trigger es la red de seguridad a nivel de BD que garantiza integridad aunque alguien haga un INSERT directo a MySQL.

Aquí el prompt corregido:

[FASE 1 — MODELO DE DATOS ZENSPA — v2]
Eres un desarrollador backend senior. Vamos a construir el sistema ZenSpa Bienestar. En esta fase SOLO vas a hacer el diseño de base de datos. Nada de código Python todavía.
Stack: MySQL 8, normalización 3NF estricta, tipos SQLAlchemy como referencia, Alembic para migraciones después.
Decisión de diseño que debes respetar: usuarios es la única tabla que contiene identidad personal (nombre, apellido, email, contraseña). clientes y terapeutas son perfiles de extensión que apuntan a usuarios vía FK. Esto elimina duplicación y garantiza 3NF.

Entrega 1 — schema.sql completo con CREATE TABLE en este orden:
usuarios
id INT AUTO_INCREMENT PK
nombre VARCHAR(100) NOT NULL
apellido VARCHAR(100) NOT NULL
email VARCHAR(150) UNIQUE NOT NULL
password_hash VARCHAR(255) NOT NULL -- bcrypt, NUNCA texto plano
rol ENUM('admin','recepcionista','terapeuta','cliente') NOT NULL
activo BOOLEAN DEFAULT TRUE
created_at DATETIME DEFAULT CURRENT_TIMESTAMP

clientes
id INT AUTO_INCREMENT PK
usuario_id INT UNIQUE NOT NULL FK→usuarios(id) ON DELETE RESTRICT
telefono VARCHAR(20)
fecha_nacimiento DATE
historial_salud TEXT -- DATO SENSIBLE: acceso restringido por rol
preferencias TEXT
created_at DATETIME DEFAULT CURRENT_TIMESTAMP

terapeutas
id INT AUTO_INCREMENT PK
usuario_id INT UNIQUE NOT NULL FK→usuarios(id) ON DELETE RESTRICT
especialidad VARCHAR(100) NOT NULL
certificaciones TEXT
activo BOOLEAN DEFAULT TRUE

cabinas
id INT AUTO_INCREMENT PK
nombre VARCHAR(100) NOT NULL
tipo_tratamiento ENUM('masajes','facial','hidroterapia','aromaterapia','multiple') NOT NULL
estado ENUM('disponible','ocupada','mantenimiento') DEFAULT 'disponible'
equipamiento TEXT

servicios
id INT AUTO_INCREMENT PK
nombre VARCHAR(100) NOT NULL
duracion_minutos INT NOT NULL
precio DECIMAL(10,2) NOT NULL
tipo_terapia ENUM('masajes','facial','hidroterapia','aromaterapia','multiple') NOT NULL

cabina_servicios -- M:N entre cabinas y servicios
cabina_id INT FK→cabinas(id) ON DELETE CASCADE
servicio_id INT FK→servicios(id) ON DELETE CASCADE
PRIMARY KEY (cabina_id, servicio_id)

productos
id INT AUTO_INCREMENT PK
nombre VARCHAR(100) NOT NULL
stock INT DEFAULT 0
costo_unitario DECIMAL(10,2) NOT NULL
stock_minimo INT DEFAULT 5 -- para alertas de inventario bajo

citas
id INT AUTO_INCREMENT PK
cliente_id INT NOT NULL FK→clientes(id) ON DELETE RESTRICT
terapeuta_id INT NOT NULL FK→terapeutas(id) ON DELETE RESTRICT
cabina_id INT NOT NULL FK→cabinas(id) ON DELETE RESTRICT
fecha DATE NOT NULL
hora_inicio TIME NOT NULL
hora_fin TIME NOT NULL
estado ENUM('pendiente','confirmada','completada','cancelada','cancelada_penalidad') DEFAULT 'pendiente'
total DECIMAL(10,2) DEFAULT 0.00
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
CONSTRAINT chk_horas CHECK (hora_fin > hora_inicio)
INDEX idx_citas_fecha_hora (fecha, hora_inicio)
INDEX idx_citas_terapeuta (terapeuta_id)
INDEX idx_citas_cabina (cabina_id)

cita_servicios -- M:N con snapshot de precio histórico
cita_id INT FK→citas(id) ON DELETE CASCADE
servicio_id INT FK→servicios(id) ON DELETE RESTRICT
precio_aplicado DECIMAL(10,2) NOT NULL -- snapshot del precio al momento de la cita
PRIMARY KEY (cita_id, servicio_id)

uso_productos
id INT AUTO_INCREMENT PK
cita_id INT NOT NULL FK→citas(id) ON DELETE RESTRICT
producto_id INT NOT NULL FK→productos(id) ON DELETE RESTRICT
cantidad INT NOT NULL
costo_aplicado DECIMAL(10,2) NOT NULL -- snapshot del costo unitario al momento

Entrega 2 — Triggers anti-overlap en MySQL 8 (archivo triggers.sql):
Crea dos triggers, uno BEFORE INSERT y uno BEFORE UPDATE en la tabla citas. Cada trigger debe:

Verificar que el terapeuta no tenga otra cita activa (estado != 'cancelada' AND estado != 'cancelada_penalidad') en la misma fecha con horas solapadas. Condición de solapamiento: hora_inicio_nueva < hora_fin_existente AND hora_fin_nueva > hora_inicio_existente.
Verificar lo mismo para la cabina.
Si hay solapamiento en el terapeuta, lanzar: SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El terapeuta ya tiene una cita en ese horario';
Si hay solapamiento en la cabina, lanzar: SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La cabina ya está ocupada en ese horario';
El trigger de UPDATE debe excluir la cita actual del chequeo (WHERE id != NEW.id).

Entrega 3 — seed.sql con datos de prueba realistas:

Inserta en usuarios: 1 admin, 1 recepcionista, 3 terapeutas, 4 clientes (8 usuarios en total)
Inserta los perfiles correspondientes en clientes y terapeutas apuntando a esos usuarios
4 cabinas con diferentes tipos, 6 servicios, asociaciones en cabina_servicios
6 productos con stock variado (algunos por debajo de stock_minimo para probar alertas)
8 citas en diferentes estados, con sus cita_servicios y algunos uso_productos
Las contraseñas deben ser hashes bcrypt reales. Usa este hash de ejemplo para todas: $2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGniYE6Ie.8a.ZL8mV5iR9yLQGO (corresponde a ZenSpa2024!). Agrega un comentario en el seed indicando que en producción cada usuario debe cambiar su contraseña.

Entrega 4 — Diagrama MER en formato Mermaid erDiagram:
Muestra todas las tablas, sus atributos principales y las relaciones con cardinalidad correcta (||--o{, etc.).

Reglas que no puedes violar:

Cero contraseñas en texto plano en cualquier archivo
Todos los comentarios en español
El campo historial_salud debe tener comentario SQL -- DATO SENSIBLE
ON DELETE RESTRICT en todas las FK de dominio (protege historial clínico)
ON DELETE CASCADE solo en las tablas intermedias M:N

NO hagas todavía: código Python, proyecto FastAPI, carpetas del proyecto, nada de frontend.
Muéstrame los 4 archivos completos al terminar.

Cuando OpenCode te entregue los archivos, muéstramelos antes de avanzar. Voy a verificar específicamente que los triggers usen la condición de solapamiento correcta y que el modelo de extensión de perfil esté bien implementado, que no haya un nombre perdido en clientes o terapeutas.

Revisión completa hecha. El trabajo de OpenCode es sólido. Te doy el veredicto por archivo y luego los puntos a corregir antes de pasar a Fase 2.

Veredicto general: Aprobado con 3 correcciones menores

schema.sql — ✅ Bien

Modelo de extensión de perfil correcto, sin nombre/apellido duplicados en clientes ni terapeutas.
FK con ON DELETE RESTRICT donde corresponde, CASCADE solo en tablas intermedias M:N.
precio_aplicado en cita_servicios y costo_aplicado en uso_productos están bien, son los snapshots históricos.
Índices de rendimiento en citas presentes.

Una cosa que falta: uso_productos no tiene un CHECK cantidad > 0. Alguien podría insertar cantidad 0 o negativa. Lo corregimos en el prompt de Fase 2 con una migración Alembic, no vale la pena rehacer el schema ahora.

triggers.sql — ✅ Bien
La lógica de solapamiento es correcta:
NEW.hora_inicio < hora_fin AND NEW.hora_fin > hora_inicio
Eso cubre todos los casos de overlap incluyendo citas anidadas. El id != NEW.id en el UPDATE está bien puesto. Los estados excluidos ('cancelada', 'cancelada_penalidad') son exactamente los correctos.
Sin observaciones.

seed.sql — ⚠️ Un error de datos
El comentario del encabezado dice 8 usuarios pero solo insertó 3 clientes (usuarios 6, 7, 8), cuando el requisito pedía 4. Eso no rompe nada técnicamente, pero el seed queda con un cliente menos de lo planeado. Además hay un problema de integridad lógica:
La cita 2 tiene total = 120.00 (Limpieza Facial 40 + Tratamiento Anti-edad 80 = 120 ✅), pero la cabina asignada es Armonía (tipo facial) y el terapeuta es Miguel (especialidad facial), lo cual es correcto. Sin embargo el servicio Aromaterapia con Masaje de las citas 4 y 7 está asignado a la cabina Aroma (tipo aromaterapia) pero el terapeuta de esas citas es Laura (especialidad masajes) y Elena (especialidad hidroterapia). Esto no viola ninguna FK del schema, pero sí viola la regla de negocio del enunciado: "no se puede asignar un servicio a una cabina que no tenga el equipamiento requerido para ese tipo de terapia" — y agrego: tampoco debería atender un terapeuta fuera de su especialidad. El seed debería ser coherente con las reglas de negocio para que las pruebas tengan sentido.

MER Mermaid — ✅ Bien
Cardinalidades correctas. La distinción ||--o{ (uno a muchos obligatorio del lado "uno", opcional del lado "muchos") está bien aplicada. El "DATO SENSIBLE" en historial_salud visible en el diagrama es un detalle que el profesor va a notar positivamente.

Las 3 correcciones antes de Fase 2
Le puedes pedir a OpenCode que corrija el seed directamente, es rápido:

[CORRECCIÓN SEED — antes de Fase 2]
Corrige el archivo seed.sql con estos tres cambios puntuales. No toques el schema ni los triggers.
Corrección 1: Agrega un cuarto cliente. Inserta en usuarios un usuario con rol 'cliente' (usa el mismo hash bcrypt de siempre) y su perfil en clientes. Ejemplo: ('María', 'Vega', 'maria.vega@email.com', ...). Luego actualiza el comentario del encabezado para que diga "4 clientes".
Corrección 2: Las citas 4 y 7 tienen un terapeuta con especialidad incorrecta para el servicio asignado. Corrígelas así:

Cita 4 (Aromaterapia con Masaje en cabina Aroma): cambia el terapeuta por Elena (terapeuta_id = 3, especialidad hidroterapia/multiple) o simplemente ajusta para que sea coherente. La solución más limpia: cambia la cita 4 para que sea un Masaje Relajante en cabina Serenidad con Laura, que sí es especialista en masajes. Actualiza hora_fin a '17:00:00' (60 min) y total a 50.00. Actualiza también el registro correspondiente en cita_servicios.
Cita 7: cambia el servicio a Hidroterapia Corporal (servicio_id = 4) en cabina Aqua (cabina_id = 3) con Elena (terapeuta_id = 3). Ajusta hora_fin a '09:00:00'... espera, la cita 7 ya empieza a las 08:00:00 y dura 60 min, entonces hora_fin = '09:00:00'. Total = 60.00. Actualiza el registro en cita_servicios.

Corrección 3: En la tabla uso_productos del seed, las citas 4 y 7 son cancelada y cancelada_penalidad respectivamente. No debería haber consumo de productos en citas canceladas. Elimina los registros de uso_productos de esas citas si los hay (revisando, no los hay en el seed actual, así que solo verifica y confirma).
Muéstrame el seed.sql actualizado completo.

Cuando me confirmes que el seed está corregido, te doy el prompt de Fase 2 que es la estructura del proyecto FastAPI con toda la configuración de seguridad, variables de entorno y el ORM con SQLAlchemy. Es el paso más largo de backend, así que el prompt va a ser bien detallado.

Tienes toda la razón en ambos puntos. En Colombia el separador de miles es el punto y el decimal es la coma, y los celulares son siempre 10 dígitos sin guiones. En base de datos los teléfonos como VARCHAR(20) sí aceptan guiones pero es mala práctica porque complica búsquedas y validaciones. Lo correcto es guardar solo dígitos.
Para los precios, el DECIMAL(10,2) del schema está bien estructuralmente, solo hay que actualizar los valores del seed a precios colombianos realistas.

[CORRECCIÓN COSMÉTICA SEED — Colombia]
Actualiza únicamente los datos del seed.sql. No toques schema ni triggers.
Teléfonos: Reemplaza todos los valores de telefono por números celulares colombianos reales de 10 dígitos, solo dígitos, sin guiones ni espacios. Empieza siempre con 3. Ejemplos: '3214567890', '3107654321', '3005551234'.
Precios en pesos colombianos (COP): Actualiza todos los campos monetarios con valores realistas para un spa de nivel medio-alto en Colombia. Usa estos valores de referencia:
Servicios:

Masaje Relajante 60 min → 85000.00
Masaje Deportivo 90 min → 130000.00
Limpieza Facial Profunda 45 min → 75000.00
Hidroterapia Corporal 60 min → 110000.00
Aromaterapia con Masaje 75 min → 120000.00
Tratamiento Anti-edad 60 min → 150000.00

Productos (costo unitario):

Aceite Esencial Lavanda → 18000.00
Crema Hidratante Facial → 32000.00
Exfoliante Corporal → 22000.00
Mascarilla de Arcilla → 14000.00
Aceite de Masaje Neutro → 16000.00
Vela Aromática Terapéutica → 9500.00

Recalcula todos los campos total en citas, precio_aplicado en cita_servicios y costo_aplicado en uso_productos para que sean consistentes con los nuevos precios. Por ejemplo la cita 2 que tiene Limpieza Facial + Tratamiento Anti-edad debe tener total = 225000.00.
Muéstrame el seed.sql completo actualizado.

Cuando me lo pases lo verifico rápido y de inmediato te doy el prompt de Fase 2.Dijiste: listo, ya puedes revisar el archivo seed, ya me puedes dar el prompt de la fase 2, a y otra cosa, esta es la estructura que tengo actualmente:

Revisión seed — ✅ Aprobado
Todo cuadra perfectamente:

4 clientes correctos (usuarios 6, 7, 8, 9)
Teléfonos colombianos de 10 dígitos sin guiones ✅
Precios en COP coherentes en todos los campos ✅
Cita 2 total 225000.00 = 75k + 150k ✅
Citas 4 y 7 corregidas con especialidades coherentes ✅
uso_productos solo en citas completadas (1, 5, 8) ✅

Un detalle menor que no requiere corrección ahora: costo_aplicado en uso_productos guarda el costo unitario pero no multiplica por cantidad. Cita 8 usa 2 mascarillas a 14k cada una pero registra 14000.00 no 28000.00. Esto es una decisión de diseño válida si el backend calcula el total multiplicando, solo hay que ser consistente en la capa de negocio. Lo anotamos para cuando lleguemos al endpoint de citas.

Sobre la estructura de carpetas
Para un proyecto académico con entrega en GitHub, te recomiendo mantenerlos juntos en un solo repositorio (monorepo) pero con separación clara. La razón es práctica: un solo git clone y el profesor ve todo. Repositorios separados complican la entrega y la revisión.
La estructura que deberías tener al final es esta:
zenspa-bienestar/
├── .opencode/
├── backend/
│ ├── app/
│ │ ├── api/ ← rutas FastAPI por módulo
│ │ ├── core/ ← config, seguridad, JWT
│ │ ├── models/ ← modelos SQLAlchemy
│ │ ├── schemas/ ← esquemas Pydantic
│ │ └── services/ ← lógica de negocio
│ ├── database/
│ │ ├── schema.sql
│ │ ├── seed.sql
│ │ ├── triggers.sql
│ │ └── mer_diagrama.md
│ ├── .env.example ← nunca el .env real
│ ├── main.py
│ └── requirements.txt
├── frontend/
│ └── (Angular aquí en Fase 7)
├── README.md
└── .gitignore ← debe ignorar .env y **pycache**

Prompt Fase 2 — Esqueleto Backend FastAPI

[FASE 2 — ESQUELETO BACKEND FASTAPI]
Continuamos con ZenSpa Bienestar. La base de datos ya está diseñada. Ahora vas a crear el esqueleto completo del backend. En esta fase NO implementes lógica de negocio todavía, solo la estructura, configuración y conexión a base de datos funcionando.
Stack: Python 3.11+, FastAPI, SQLAlchemy 2.0 (ORM, estilo declarativo con DeclarativeBase), Alembic para migraciones, python-dotenv para variables de entorno, passlib[bcrypt] para hashing, python-jose[cryptography] para JWT, PyMySQL como driver MySQL.

Entrega 1 — requirements.txt:
Incluye con versiones fijas (no rangos):

fastapi, uvicorn[standard], sqlalchemy, alembic, pymysql, python-dotenv, passlib[bcrypt], python-jose[cryptography], pydantic[email], pydantic-settings.

Entrega 2 — .env.example (nunca el .env real):
DB_HOST=localhost
DB_PORT=3306
DB_NAME=zenspa_db
DB_USER=
DB_PASSWORD=
SECRET_KEY=
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480
ALLOWED_ORIGINS=http://localhost:4200

Entrega 3 — Estructura de carpetas dentro de backend/:
Crea todos los archivos con su contenido real, no placeholders vacíos:
backend/
├── app/
│ ├── **init**.py
│ ├── core/
│ │ ├── **init**.py
│ │ ├── config.py ← Settings con pydantic-settings
│ │ ├── database.py ← engine, SessionLocal, get_db
│ │ └── security.py ← hash_password, verify_password, create_token, decode_token
│ ├── models/
│ │ ├── **init**.py
│ │ └── models.py ← todos los modelos SQLAlchemy
│ ├── schemas/
│ │ ├── **init**.py
│ │ └── schemas.py ← schemas Pydantic base por entidad
│ ├── api/
│ │ ├── **init**.py
│ │ └── v1/
│ │ ├── **init**.py
│ │ └── router.py ← APIRouter que agrupa todos los módulos
│ └── services/
│ └── **init**.py
├── database/
│ ├── schema.sql
│ ├── seed.sql
│ ├── triggers.sql
│ └── mer_diagrama.md
├── main.py
└── requirements.txt

Entrega 4 — Contenido de cada archivo:
app/core/config.py: Usa pydantic-settings con clase Settings que lee todas las variables del .env. Expón una instancia settings = Settings(). Incluye DB_URL como @property que construye el string de conexión MySQL: f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}".
app/core/database.py: Crea el engine con create_engine(settings.DB_URL). Define SessionLocal con sessionmaker. Define Base = DeclarativeBase(). Implementa get_db() como generador con try/finally para cerrar sesión correctamente. Implementa check_db_connection() que ejecute SELECT 1 y devuelva True o lance excepción.
app/core/security.py: Implementa hash_password(plain: str) -> str con bcrypt. Implementa verify_password(plain: str, hashed: str) -> bool. Implementa create_access_token(data: dict, expires_delta: timedelta) -> str con JWT. Implementa decode_token(token: str) -> dict que lance HTTPException 401 si el token es inválido o expirado. Nunca loguees contraseñas ni tokens en ninguna función.
app/models/models.py: Mapea todas las tablas del schema.sql a clases SQLAlchemy con DeclarativeBase. Respeta exactamente los nombres de columnas y tipos del schema. Incluye las relaciones con relationship() entre modelos relacionados. Agrega **tablename** explícito en cada modelo.
app/schemas/schemas.py: Crea schemas Pydantic para cada entidad. Patrón por entidad: EntidadBase (campos comunes), EntidadCreate(EntidadBase) (para POST), EntidadResponse(EntidadBase) (para respuestas, con id y model_config = ConfigDict(from_attributes=True)). Para UsuarioCreate incluye password: str (no password_hash). Para UsuarioResponse nunca incluyas password_hash.
main.py: Instancia FastAPI con título "ZenSpa Bienestar API", versión "1.0.0", y docs_url="/api/docs". Configura CORS con CORSMiddleware usando settings.ALLOWED_ORIGINS.split(",") como whitelist. Agrega el router de /api/v1. Agrega un endpoint GET /health que llame a check_db_connection() y devuelva {"status": "ok", "database": "connected"}. En el arranque loguea con print() que el servidor está corriendo, nunca las credenciales.

Reglas que no puedes violar:

El .env real nunca debe crearse ni commitearse. Solo .env.example.
Agrega .env y **pycache**/ al .gitignore si no existe.
SECRET_KEY nunca hardcodeada, siempre desde settings.
Los modelos SQLAlchemy deben coincidir exactamente con el schema SQL (mismos nombres de tabla y columna).
UsuarioResponse nunca expone password_hash.
Todo comentario en español.

Prueba de humo al final: Indica exactamente qué comandos ejecutar para instalar dependencias, crear el .env real localmente y correr uvicorn. El endpoint GET /health debe responder 200 OK con la base de datos conectada.
NO hagas todavía: endpoints de auth, lógica de negocio, módulos específicos. Solo el esqueleto funcionando con /health verde.
Muéstrame todos los archivos completos al terminar.

Cuando OpenCode te entregue esto, me muestras el main.py y el app/core/database.py y verifico que la conexión y el CORS estén bien configurados antes de pasar a Fase 3 que es auth y JWT.

Perfecto, con esos dos archivos tengo suficiente para la revisión. Docker es una excelente decisión por cierto, hace que el proyecto sea reproducible en cualquier máquina, el profesor lo va a poder correr sin configurar MySQL localmente.
Revisión Fase 2 — ✅ Aprobado
database.py — Sin observaciones. pool_pre_ping=True es un detalle senior que reconecta automáticamente si MySQL cierra la conexión por inactividad, bien puesto. El generador get_db() con try/finally es correcto.
main.py — Funciona bien pero hay una cosa que debo señalarte:
python@app.on_event("startup")
def on_startup():
Base.metadata.create_all(bind=engine)
on_event("startup") está deprecado en FastAPI moderno. No rompe nada hoy pero generará warnings y en versiones futuras dejará de funcionar. Además create_all en startup está bien para desarrollo pero en producción las migraciones deben ir por Alembic exclusivamente. Anótalo, lo corregimos en el prompt de Fase 3 de una vez.

Prompt Fase 3 — Auth y usuarios

[FASE 3 — AUTENTICACIÓN JWT Y MÓDULO USUARIOS]
Continuamos ZenSpa Bienestar. El esqueleto del backend ya funciona. Ahora implementas el sistema de autenticación completo y el CRUD de usuarios.

Corrección previa en main.py: Reemplaza el decorador deprecado @app.on_event("startup") por el patrón moderno con lifespan:
pythonfrom contextlib import asynccontextmanager

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
Elimina el Base.metadata.create_all del lifespan. Las tablas ya existen por el schema.sql, Alembic se encarga de migraciones futuras.

Entrega 1 — Inicializar Alembic:
Dentro de backend/ ejecuta alembic init alembic. Luego configura alembic/env.py para que importe Base desde app.models.models y use settings.DB_URL en lugar de leer sqlalchemy.url del alembic.ini. El alembic.ini no debe contener credenciales, solo sqlalchemy.url = vacío. Agrega alembic/versions/ al .gitignore no, déjalo versionado. Sí agrega \*.pyc y .env si no están.

Entrega 2 — Dependencia de autenticación en app/core/security.py:
Agrega estas dos funciones nuevas al archivo existente (no borres las que ya están):
get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> Usuario: decodifica el token, extrae el sub (que será el usuario.id como string), busca el usuario en BD, lanza HTTPException 401 si no existe o si usuario.activo == False. Usa OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login").
require_roles(\*roles: str): función que retorna una dependencia. Úsala así: Depends(require_roles("admin", "recepcionista")). Si el rol del usuario actual no está en la lista lanza HTTPException 403 con mensaje "No tienes permiso para esta acción".

Entrega 3 — Endpoints de auth en app/api/v1/auth.py:
POST /api/v1/auth/login: recibe OAuth2PasswordRequestForm. Busca usuario por email (el username del form es el email). Verifica contraseña con verify_password. Si falla lanza HTTPException 401 con mensaje "Credenciales incorrectas". Si el usuario tiene activo = False lanza HTTPException 403 con mensaje "Usuario inactivo". Si pasa, crea JWT con payload {"sub": str(usuario.id), "rol": usuario.rol, "nombre": usuario.nombre} y retorna {"access_token": token, "token_type": "bearer", "rol": usuario.rol, "nombre": usuario.nombre}.
GET /api/v1/auth/me: protegido con Depends(get_current_user). Retorna los datos del usuario actual usando UsuarioResponse (sin password_hash).

Entrega 4 — CRUD usuarios en app/api/v1/usuarios.py:
Todos los endpoints requieren rol admin excepto donde se indica.

GET /api/v1/usuarios/ → lista todos, soporta query param ?rol= para filtrar. Requiere admin.
GET /api/v1/usuarios/{id} → detalle de un usuario. Requiere admin o que sea el propio usuario.
POST /api/v1/usuarios/ → crea usuario. Recibe UsuarioCreate con campo password (no password_hash). Hashea con hash_password antes de guardar. Verifica que el email no exista, si existe lanza HTTPException 400 con mensaje "El email ya está registrado". Requiere admin.
PUT /api/v1/usuarios/{id} → actualiza nombre, apellido, email, rol, activo. Nunca actualiza password_hash por este endpoint. Requiere admin.
DELETE /api/v1/usuarios/{id} → no elimina físicamente. Cambia activo = False. Un admin no puede desactivarse a sí mismo. Requiere admin.

Entrega 5 — Servicio de lógica en app/services/usuario_service.py:
Mueve toda la lógica de negocio (búsquedas, validaciones, hash) fuera de los endpoints a funciones en este archivo. Los endpoints solo llaman al servicio y devuelven respuesta. Patrón: get_usuario_by_id(db, id), get_usuario_by_email(db, email), create_usuario(db, data), update_usuario(db, id, data), deactivate_usuario(db, id, requesting_user_id).

Entrega 6 — Registra las rutas en app/api/v1/router.py:
Importa y agrega los dos nuevos routers (auth y usuarios) al router principal con sus prefijos y tags correctos.

Reglas que no puedes violar:

El JWT nunca incluye password_hash en el payload.
Los mensajes de error de login deben ser genéricos: no digas "contraseña incorrecta" ni "email no encontrado" por separado, siempre "Credenciales incorrectas" para no dar pistas a atacantes.
Nunca loguees el token ni la contraseña en ningún print.
El endpoint DELETE es un soft delete, nunca db.delete().
Todo comentario en español.

Prueba de humo: Indica los pasos para probar en /api/docs: login con admin@zenspa.com / ZenSpa2024!, copiar el token, usarlo en el candado de Swagger, llamar a GET /api/v1/auth/me y ver los datos del admin.
NO hagas todavía: CRUDs de clientes, terapeutas, cabinas, servicios, productos ni citas.
Muéstrame todos los archivos nuevos y modificados al terminar.

Cuando OpenCode termine, muéstrame app/core/security.py completo y app/api/v1/auth.py completo. Con esos dos verifico que el flujo JWT esté bien antes de pasar a Fase 4.

Revisión Fase 3 — ✅ Aprobado con un comentario
security.py — Excelente. Tres detalles que vale la pena que sepas:
datetime.now(timezone.utc) en lugar de datetime.utcnow() es la forma correcta en Python 3.11+, bien hecho. El mensaje de error en get_current_user es genérico cuando el usuario no existe o está inactivo, eso es correcto por seguridad, no le dices al atacante cuál de las dos condiciones falló. require_roles como closure que retorna una dependencia es el patrón idiomático de FastAPI, bien implementado.
auth.py — Sin observaciones. El orden de validación es correcto: primero verifica credenciales, luego verifica si está activo. Así evitas el timing attack de verificar hash solo cuando el usuario existe.
Una cosa a anotar para después: el login devuelve usuario.rol como string directo desde el modelo SQLAlchemy. Cuando llegues al frontend, asegúrate de que Angular guarde ese rol en el estado de sesión para los guards de ruta, lo vamos a necesitar en Fase 7.

Prompt Fase 4 — CRUDs core

[FASE 4 — CRUDS CORE: CLIENTES, TERAPEUTAS, CABINAS, SERVICIOS, PRODUCTOS]
Continuamos ZenSpa Bienestar. Auth funcionando. Ahora implementas los cinco módulos de gestión base. Sigue exactamente el patrón de capas establecido: router → service → modelo.

Archivos a crear:
app/
├── api/v1/
│ ├── clientes.py
│ ├── terapeutas.py
│ ├── cabinas.py
│ ├── servicios.py
│ └── productos.py
└── services/
├── cliente_service.py
├── terapeuta_service.py
├── cabina_service.py
├── servicio_service.py
└── producto_service.py
Registra todos los routers nuevos en app/api/v1/router.py.

Patrón que debes repetir para cada módulo:
Endpoints:

GET / → listar todos, con filtros opcionales por query param donde tenga sentido
GET /{id} → detalle
POST / → crear
PUT /{id} → actualizar
DELETE /{id} → soft delete (activo=False) donde aplique, delete físico solo en cabinas y servicios si no tienen citas asociadas

Service: funciones get_all, get_by_id, create, update, delete. Toda validación de negocio va aquí, nunca en el router.

Reglas específicas por módulo:
Clientes — prefijo /api/v1/clientes, tag Clientes:

Al crear un cliente se crea simultáneamente el Usuario (rol cliente) y el perfil Cliente en una sola transacción. El request recibe nombre, apellido, email, password, telefono, fecha_nacimiento, historial_salud, preferencias.
historial_salud solo puede ser leído o modificado por roles admin y terapeuta. Si el rol es recepcionista o cliente, ese campo debe llegar como null en la respuesta aunque tenga datos en BD. Implementa esto en el service con un parámetro include_historial: bool.
Acceso: admin y recepcionista pueden listar y ver. Terapeuta puede ver detalle. Cliente solo puede ver su propio perfil.

Terapeutas — prefijo /api/v1/terapeutas, tag Terapeutas:

Al crear un terapeuta se crea simultáneamente el Usuario (rol terapeuta) y el perfil Terapeuta.
DELETE /{id} hace soft delete: usuario.activo = False y terapeuta.activo = False en la misma transacción.
GET / soporta filtro ?activo=true/false y ?especialidad=.
Acceso: solo admin.

Cabinas — prefijo /api/v1/cabinas, tag Cabinas:

DELETE /{id}: antes de eliminar verifica que la cabina no tenga citas con estado pendiente o confirmada. Si tiene, lanza HTTPException 400 con mensaje "La cabina tiene citas activas, no se puede eliminar".
GET / soporta filtro ?estado= y ?tipo_tratamiento=.
GET /{id}/servicios → retorna los servicios asociados a esa cabina vía cabina_servicios.
POST /{id}/servicios/{servicio_id} → asocia un servicio a la cabina. Valida que el tipo_terapia del servicio sea compatible con el tipo_tratamiento de la cabina (deben coincidir o la cabina debe ser multiple). Si no son compatibles lanza HTTPException 400 con mensaje "El servicio no es compatible con el tipo de tratamiento de esta cabina".
DELETE /{id}/servicios/{servicio_id} → desasocia el servicio.
Acceso: admin para escribir, todos los roles para leer.

Servicios — prefijo /api/v1/servicios, tag Servicios:

DELETE /{id}: verifica que el servicio no tenga registros en cita_servicios. Si tiene, lanza HTTPException 400 con mensaje "El servicio tiene historial de citas, no se puede eliminar".
GET / soporta filtro ?tipo_terapia=.
Acceso: admin para escribir, todos los roles para leer.

Productos — prefijo /api/v1/productos, tag Productos:

GET / soporta filtro ?stock_bajo=true que retorna solo productos donde stock <= stock_minimo.
PUT /{id} permite actualizar stock (entrada de inventario). El stock nunca puede quedar negativo, valida en el service.
DELETE /{id}: verifica que el producto no tenga registros en uso_productos. Si tiene lanza HTTPException 400 con mensaje "El producto tiene historial de uso, no se puede eliminar".
Acceso: admin para escribir, admin y recepcionista para leer.

Schemas nuevos que necesitas agregar en schemas.py:
Para clientes: ClienteCreate (incluye campos de usuario + campos de perfil), ClienteResponse (incluye datos del usuario via join: nombre, apellido, email, más campos del perfil. historial_salud presente pero puede ser None).
Para terapeutas: TerapeutaCreate, TerapeutaResponse (incluye nombre, apellido, email del usuario asociado).
Para cabinas: CabinaCreate, CabinaUpdate, CabinaResponse.
Para servicios: ServicioCreate, ServicioUpdate, ServicioResponse.
Para productos: ProductoCreate, ProductoUpdate, ProductoResponse.
Todos los Response deben tener model_config = ConfigDict(from_attributes=True).

Reglas que no puedes violar:

Toda operación que toque dos tablas a la vez (crear cliente+usuario, soft delete terapeuta) debe usar una sola transacción: una sola db.commit() al final, db.rollback() en el except.
Nunca devuelvas password_hash en ningún response.
Las validaciones de negocio (compatibilidad cabina-servicio, stock negativo, citas activas) van en el service, no en el router.
Todo comentario en español.

Prueba de humo: Con el seed cargado, prueba en /api/docs: listar clientes con token admin, intentar ver historial_salud con token de recepcionista (debe llegar null), intentar asociar Hidroterapia Corporal a la cabina Serenidad (debe fallar por incompatibilidad).
NO hagas todavía: módulo de citas, facturación ni reportes.
Muéstrame todos los archivos al terminar.

Cuando OpenCode termine, muéstrame cliente_service.py completo y cabina_service.py completo. El primero para verificar la transacción doble y el filtro de historial_salud, el segundo para verificar la validación de compatibilidad cabina-servicio.Dijiste: cliente_service.

Revisión Fase 4 — ✅ Aprobado con una corrección importante
cabina_service.py — Sólido. La validación de compatibilidad está bien implementada, el check de citas activas antes del delete es correcto, y el manejo de la relación M:N es limpio.
cliente_service.py — Aquí hay un problema real que hay que corregir ahora.
Mira la función create:
pythondb.add(usuario)
db.flush() # ← obtiene el ID del usuario
db.add(cliente)
db.commit() # ← un solo commit, correcto
El db.flush() + un solo db.commit() al final es correcto para la transacción atómica. Bien.
Pero falta el try/except con db.rollback(). Si el db.add(cliente) o el db.commit() fallan después del flush, la transacción queda en estado inconsistente. Hay que envolver en try/except. Lo corriges en el próximo prompt junto con la fase 5.
Sobre la prueba del historial_salud — veo que el response que me muestras tiene el historial visible, lo cual significa que lo probaste con token de admin. Correcto. Lo que necesito que verifiques tú antes de avanzar es probarlo con token de recepcionista: en /api/docs haz login con recepcion@zenspa.com / ZenSpa2024!, copia ese token, úsalo en el candado, y llama al GET /api/v1/clientes/. El campo historial_salud debe llegar null en todos los registros. Si llega con datos, hay un bug en cómo el router pasa el parámetro include_historial al service. Dime qué resultado obtienes.

Prompt Fase 5 — Módulo de Citas
Este es el módulo más crítico del sistema. Le dices a OpenCode que vaya despacio y sin atajos.

[FASE 5 — MÓDULO DE CITAS Y FACTURACIÓN]
Continuamos ZenSpa Bienestar. Este es el módulo más crítico. Léelo completo antes de escribir una sola línea de código.
Corrección previa en cliente_service.py: Envuelve el cuerpo de la función create en un bloque try/except con db.rollback():
pythondef create(db: Session, data: ClienteCreate) -> dict:
try:
usuario = Usuario(...)
db.add(usuario)
db.flush()
cliente = Cliente(...)
db.add(cliente)
db.commit()
db.refresh(cliente)
return \_cliente_to_dict(cliente)
except Exception:
db.rollback()
raise
Aplica el mismo patrón a la función create de terapeuta_service.py ya que también crea dos registros.

Archivos a crear:
app/
├── api/v1/
│ └── citas.py
└── services/
└── cita_service.py
Registra el router en app/api/v1/router.py.

Schemas nuevos en schemas.py:
CitaCreate:
cliente_id, terapeuta_id, cabina_id, fecha (date),
hora_inicio (time), hora_fin (time),
servicios: list[int] ← lista de servicio_ids
productos: list[ProductoUso] ← opcional, puede ser lista vacía

ProductoUso:
producto_id: int
cantidad: int ← debe ser >= 1

CitaUpdate:
estado: str | None ← solo se puede actualizar el estado
terapeuta_id: int | None
cabina_id: int | None
hora_inicio: time | None
hora_fin: time | None

CitaResponse:
id, cliente_id, terapeuta_id, cabina_id, fecha,
hora_inicio, hora_fin, estado, total, created_at
nombre_cliente: str
nombre_terapeuta: str
nombre_cabina: str
servicios: list[ServicioResponse]

ReporteCitasFilter: ← para el endpoint de consultas con JOIN
terapeuta_id: int | None
tipo_terapia: str | None
fecha_inicio: date | None
fecha_fin: date | None
estado: str | None

cita_service.py — funciones requeridas:
create(db, data: CitaCreate) -> CitaResponse
Esta función es una transacción atómica completa. El orden de operaciones es exactamente este, sin saltarse pasos:

Validar que hora_fin > hora_inicio, si no lanza HTTPException 400 con "La hora de fin debe ser posterior a la hora de inicio".
Validar que cada servicio_id en data.servicios exista en BD. Si alguno no existe lanza HTTPException 404.
Validar que la cabina exista y su estado sea disponible. Si no lanza HTTPException 400 con "La cabina no está disponible".
Validar que cada servicio sea compatible con la cabina (mismo tipo_terapia o cabina multiple). Si no lanza HTTPException 400 con "El servicio {nombre} no es compatible con esta cabina".
Validar disponibilidad del terapeuta: consulta si existe alguna cita activa (estado no cancelado) del mismo terapeuta en la misma fecha con horas solapadas. Condición: hora_inicio_existente < hora_fin_nueva AND hora_fin_existente > hora_inicio_nueva. Si hay conflicto lanza HTTPException 409 con "El terapeuta no está disponible en ese horario".
Validar disponibilidad de la cabina: misma lógica que el terapeuta. Si hay conflicto lanza HTTPException 409 con "La cabina no está disponible en ese horario".
Validar stock de productos: para cada producto en data.productos, verifica que producto.stock >= cantidad. Si no lanza HTTPException 400 con "Stock insuficiente para {nombre_producto}". Esta validación va ANTES de cualquier escritura.

Solo si todas las validaciones pasan, abre la transacción de escritura dentro de try/except con db.rollback():

Calcular total: suma de precio de cada servicio (snapshot del precio actual).
Crear el registro en citas.
db.flush() para obtener cita.id.
Insertar en cita_servicios un registro por cada servicio con precio_aplicado = servicio.precio (snapshot).
Para cada producto en data.productos: insertar en uso_productos con costo_aplicado = producto.costo_unitario (snapshot) y decrementar producto.stock -= cantidad.
db.commit().

update_estado(db, cita_id, data: CitaUpdate, usuario_actual) -> CitaResponse

Si el nuevo estado es cancelada o cancelada_penalidad, verificar si la cita está a menos de 2 horas del momento actual combinando cita.fecha + cita.hora_inicio. Si está a menos de 2 horas, forzar el estado a cancelada_penalidad independientemente de lo que envíe el cliente.
Si se cambia terapeuta_id o cabina_id o el horario, re-ejecutar las validaciones de solapamiento de los pasos 5 y 6.
Si la cita pasa a cancelada o cancelada_penalidad y tenía productos consumidos en uso_productos, devolver el stock: producto.stock += cantidad por cada registro en uso_productos de esa cita.
Transacción atómica con try/except y db.rollback().

get_citas_filtradas(db, filtros: ReporteCitasFilter) -> list[CitaResponse]
Query con JOIN explícito a usuarios (para nombre cliente y terapeuta), cabinas, cita_servicios y servicios. Aplica filtros opcionales por terapeuta_id, tipo_terapia (filtra por tipo de los servicios de la cita), rango de fechas y estado. Esta función es la que alimenta tanto el módulo de citas como los reportes.
get_by_id(db, cita_id) -> CitaResponse | None
get_reporte_servicios_populares(db) -> list[dict]
Retorna lista de {servicio_id, nombre, total_reservas, ingresos_generados} ordenada por total_reservas desc. Usa func.count y func.sum de SQLAlchemy.
get_reporte_ingresos_terapeuta(db) -> list[dict]
Retorna {terapeuta_id, nombre, apellido, total_citas_completadas, ingresos_generados} filtrando citas con estado completada.

citas.py — endpoints:

POST /api/v1/citas/ → crea cita. Acceso: admin y recepcionista.
GET /api/v1/citas/ → lista con filtros opcionales via query params. Acceso: admin y recepcionista ven todas. Terapeuta ve solo las suyas. Cliente ve solo las suyas.
GET /api/v1/citas/{id} → detalle. Misma lógica de acceso que el listado.
PUT /api/v1/citas/{id} → actualiza estado u horario. Acceso: admin y recepcionista.
GET /api/v1/citas/reportes/servicios-populares → reporte. Acceso: admin.
GET /api/v1/citas/reportes/ingresos-terapeutas → reporte. Acceso: admin.

Atención con el orden de rutas en FastAPI: registra /reportes/servicios-populares y /reportes/ingresos-terapeutas ANTES que /{id} en el router, o FastAPI intentará parsear "reportes" como un entero y dará error 422.

Reglas que no puedes violar:

Todas las validaciones de disponibilidad del paso 5 y 6 en el service deben ejecutarse TAMBIÉN a nivel de BD vía los triggers del triggers.sql. El backend valida primero para dar mensajes claros al usuario, el trigger es la red de seguridad final. No elimines los triggers.
El decremento de stock nunca puede dejar producto.stock en negativo. Si por alguna condición de carrera llegara a ocurrir, el try/except con rollback lo revierte.
Los snapshots de precio (precio_aplicado) y costo (costo_aplicado) se toman del valor actual en BD al momento de crear la cita, no del valor que envíe el cliente.
Todo comentario en español.

Prueba de humo: Con el seed cargado, intenta crear una cita para el terapeuta Laura (id=1) el 2026-05-26 entre 09:00 y 10:30 (que ya tiene la cita 6 en el seed). Debe responder 409 con "El terapeuta no está disponible en ese horario".
NO hagas todavía: frontend, reportes adicionales, módulo de experiencia.
Muéstrame cita_service.py completo al terminar.

Revisión Fase 5 — ✅ Aprobado con un bug crítico a corregir
Historial_salud con recepcionista — null en todos los registros. Perfecto, esa regla de negocio funciona correctamente.
cita_service.py — La estructura general es sólida. Las validaciones van en orden correcto, los snapshots de precio están bien, los reportes usan func.count y func.sum correctamente, el outerjoin en el reporte de terapeutas es la decisión correcta para que aparezcan terapeutas con 0 citas.
Pero hay un bug crítico en update_estado:
python# Primero actualiza el estado
if data.estado is not None:
cita.estado = data.estado

# Luego verifica si debe devolver stock

if cita.estado in ("cancelada", "cancelada_penalidad"): # ← siempre True si acaba de asignarlo
for up in cita.uso_productos:
up.producto.stock += up.cantidad
El problema: si una cita ya estaba en estado cancelada y alguien llama al endpoint de update por cualquier otra razón (cambiar horario, por ejemplo), el bloque de devolución de stock se ejecuta de nuevo porque cita.estado ya es cancelada. Eso devuelve el stock dos veces. La condición debe verificar si el estado está cambiando a cancelado, no si ya es cancelado.
Le dices esto a OpenCode con este fix exacto:

[FIX PUNTUAL — cita_service.py función update_estado]
Corrige el bug de devolución doble de stock. El bloque que devuelve inventario debe ejecutarse solo cuando el estado cambia a cancelado, no cuando ya lo era. Reemplaza esta lógica dentro del bloque try:
python# Guardar estado anterior ANTES de modificar
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

# Solo devolver stock si el estado CAMBIA a cancelado (no si ya lo era)

estados_cancelacion = ("cancelada", "cancelada_penalidad")
if cita.estado in estados_cancelacion and estado_anterior not in estados_cancelacion:
for up in cita.uso_productos:
up.producto.stock += up.cantidad

db.commit()
db.refresh(cita)
return \_cita_to_dict(cita)
No cambies nada más del archivo.

Cuando OpenCode aplique el fix, muéstrame únicamente esas líneas corregidas para confirmar y te doy el prompt de Fase 6 que son los reportes adicionales y después ya entramos al frontend.

Revisión Fix + Fase 5 — ✅ Todo aprobado
El fix quedó perfecto:
pythonestado_anterior = cita.estado # captura ANTES de modificar

# ... modifica campos ...

# Solo ejecuta si el estado CAMBIA a cancelado, no si ya lo era

if cita.estado in estados_cancelacion and estado_anterior not in estados_cancelacion:
for up in cita.uso_productos:
up.producto.stock += up.cantidad
Lógica correcta. El backend está completo y sólido. Pasamos al frontend.

Prompt Fase 6 — Proyecto base Angular
No hay una fase 6 de reportes separada porque los reportes ya están implementados en el backend como endpoints. El frontend los consume directamente. Entramos directo a Angular.

[FASE 6 — PROYECTO BASE ANGULAR + ARQUITECTURA + AUTH]
Iniciamos el frontend de ZenSpa Bienestar. Lee todo antes de escribir código.
Referencia visual obligatoria: El sistema debe tener estética de spa premium. Paleta tierra/crema: fondo principal #FAF7F2, acento primario #C8956C (terracota dorado), texto principal #2C2C2C, superficies de card #FFFFFF con sombra suave. Tipografía: Playfair Display para headings (Google Fonts), Inter para cuerpo y datos. El sistema debe sentirse como una aplicación de lujo, no como un CRUD genérico.

Paso 0 — Crear el proyecto dentro de frontend/:
bashcd frontend
ng new zenspa --standalone --routing --style=scss --skip-git
Instala dependencias adicionales:
bashnpm install @angular/cdk chart.js ng2-charts date-fns

Paso 1 — Variables de entorno Angular:
En src/environments/environment.ts:
typescriptexport const environment = {
production: false,
apiUrl: 'http://localhost:8000/api/v1'
};
En src/environments/environment.prod.ts igual pero production: true.

Paso 2 — Estructura de carpetas dentro de src/app/:
src/app/
├── core/
│ ├── guards/
│ │ ├── auth.guard.ts
│ │ └── role.guard.ts
│ ├── interceptors/
│ │ └── auth.interceptor.ts
│ ├── models/
│ │ └── index.ts ← interfaces TypeScript de todas las entidades
│ └── services/
│ ├── auth.service.ts
│ ├── cliente.service.ts
│ ├── terapeuta.service.ts
│ ├── cabina.service.ts
│ ├── servicio.service.ts
│ ├── producto.service.ts
│ └── cita.service.ts
├── shared/
│ └── components/
│ ├── navbar/
│ └── sidebar/
└── modules/
├── auth/
│ └── login/
├── dashboard/
├── clientes/
├── terapeutas/
├── agenda/
├── servicios/
├── cabinas/
├── inventario/
└── reportes/

Paso 3 — Interfaces TypeScript en core/models/index.ts:
Crea interfaces que reflejen exactamente los schemas de respuesta del backend:
typescriptexport interface Usuario { id: number; nombre: string; apellido: string; email: string; rol: string; activo: boolean; }
export interface Cliente { id: number; usuario_id: number; nombre: string; apellido: string; email: string; telefono: string; fecha_nacimiento: string; historial_salud: string | null; preferencias: string; }
export interface Terapeuta { id: number; usuario_id: number; nombre: string; apellido: string; especialidad: string; certificaciones: string; activo: boolean; }
export interface Cabina { id: number; nombre: string; tipo_tratamiento: string; estado: string; equipamiento: string; }
export interface Servicio { id: number; nombre: string; duracion_minutos: number; precio: number; tipo_terapia: string; }
export interface Producto { id: number; nombre: string; stock: number; costo_unitario: number; stock_minimo: number; }
export interface Cita { id: number; cliente_id: number; terapeuta_id: number; cabina_id: number; fecha: string; hora_inicio: string; hora_fin: string; estado: string; total: number; nombre_cliente: string; nombre_terapeuta: string; nombre_cabina: string; servicios: Servicio[]; }
export interface AuthResponse { access_token: string; token_type: string; rol: string; nombre: string; }
export interface ReporteServicio { servicio_id: number; nombre: string; total_reservas: number; ingresos_generados: number; }
export interface ReporteTerapeuta { terapeuta_id: number; nombre: string; apellido: string; total_citas_completadas: number; ingresos_generados: number; }

Paso 4 — AuthService en core/services/auth.service.ts:
Usa inject(HttpClient) y inject(Router). Almacena el token en localStorage con clave zenspa_token y el objeto de sesión con clave zenspa_session (rol y nombre). Implementa:

login(email, password): POST a /auth/login con FormData (OAuth2PasswordRequestForm requiere username y password como form fields, no JSON). Guarda token y sesión. Navega según rol: admin/recepcionista → /dashboard, terapeuta → /agenda, cliente → /mis-citas.
logout(): limpia localStorage, navega a /login.
getToken(): retorna el token del localStorage.
getSession(): retorna {rol, nombre} del localStorage.
isLoggedIn(): retorna true si hay token válido (verifica que exista, no decodifiques JWT en frontend).
hasRole(...roles: string[]): verifica si el rol actual está en la lista.

Paso 5 — Interceptor en core/interceptors/auth.interceptor.ts:
Interceptor funcional (no clase). Agrega el header Authorization: Bearer {token} a todas las requests que vayan a environment.apiUrl. Si la respuesta es 401, llama a authService.logout() automáticamente.
typescriptexport const authInterceptor: HttpInterceptorFn = (req, next) => { ... }

Paso 6 — Guards:
auth.guard.ts: si no hay token redirige a /login. Si hay token deja pasar.
role.guard.ts: recibe roles permitidos via data: { roles: ['admin', 'recepcionista'] } en la ruta. Si el rol del usuario no está en la lista redirige a /sin-permiso.

Paso 7 — Servicios HTTP en core/services/:
Cada servicio usa inject(HttpClient) y la baseUrl = environment.apiUrl. Implementa los métodos CRUD básicos. Ejemplo patrón para cliente.service.ts:
typescriptgetAll(): Observable<Cliente[]>
getById(id: number): Observable<Cliente>
create(data: any): Observable<Cliente>
update(id: number, data: any): Observable<Cliente>
delete(id: number): Observable<any>
Mismo patrón para terapeuta, cabina, servicio, producto. Para cita.service.ts agrega:
typescriptgetCitasFiltradas(filtros: any): Observable<Cita[]>
getReporteServicios(): Observable<ReporteServicio[]>
getReporteTerapeutas(): Observable<ReporteTerapeuta[]>

Paso 8 — Rutas en app.routes.ts:
typescript{ path: 'login', component: LoginComponent },
{ path: '', canActivate: [authGuard], children: [
{ path: 'dashboard', component: DashboardComponent, canActivate: [roleGuard], data: { roles: ['admin', 'recepcionista'] } },
{ path: 'agenda', component: AgendaComponent, canActivate: [roleGuard], data: { roles: ['admin', 'recepcionista', 'terapeuta'] } },
{ path: 'clientes', component: ClientesComponent, canActivate: [roleGuard], data: { roles: ['admin', 'recepcionista', 'terapeuta'] } },
{ path: 'terapeutas', component: TerapeutasComponent, canActivate: [roleGuard], data: { roles: ['admin'] } },
{ path: 'servicios', component: ServiciosComponent, canActivate: [roleGuard], data: { roles: ['admin'] } },
{ path: 'cabinas', component: CabinasComponent, canActivate: [roleGuard], data: { roles: ['admin', 'recepcionista'] } },
{ path: 'inventario', component: InventarioComponent, canActivate: [roleGuard], data: { roles: ['admin'] } },
{ path: 'reportes', component: ReportesComponent, canActivate: [roleGuard], data: { roles: ['admin'] } },
{ path: '', redirectTo: 'dashboard', pathMatch: 'full' },
]},
{ path: 'sin-permiso', component: SinPermisoComponent },
{ path: '\*\*', redirectTo: 'login' },

Paso 9 — app.config.ts:
Registra provideHttpClient(withInterceptors([authInterceptor])), provideRouter(routes), y provideAnimationsAsync().

Paso 10 — styles.scss global:
scss@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');

:root {
--color-bg: #FAF7F2;
--color-surface: #FFFFFF;
--color-primary: #C8956C;
--color-primary-dark: #A67550;
--color-primary-light: #F0DDD0;
--color-text: #2C2C2C;
--color-text-muted: #6B6B6B;
--color-border: #E8E0D8;
--color-success: #4CAF82;
--color-warning: #E8A838;
--color-danger: #E05C5C;
--shadow-sm: 0 1px 3px rgba(0,0,0,0.06);
--shadow-md: 0 4px 12px rgba(0,0,0,0.08);
--shadow-lg: 0 8px 24px rgba(0,0,0,0.10);
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 16px;
--font-heading: 'Playfair Display', serif;
--font-body: 'Inter', sans-serif;
}

- { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: var(--color-bg); color: var(--color-text); font-family: var(--font-body); }
  h1, h2, h3 { font-family: var(--font-heading); }

Paso 11 — Módulo Login (modules/auth/login/):
Componente standalone con formulario reactivo. Campos: email y password. Botón "Ingresar". Al hacer submit llama a authService.login(). Muestra error si las credenciales son incorrectas. Diseño: card centrada en pantalla, logo ZenSpa arriba, fondo con la paleta crema, inputs con borde terracota en focus, botón terracota sólido. Sin navbar ni sidebar en esta ruta.

Entregable mínimo de esta fase: La app compila sin errores, el login funciona con admin@zenspa.com / ZenSpa2024!, redirige al dashboard, y el interceptor añade el token a las requests subsiguientes. Los demás módulos pueden ser componentes vacíos con solo el título por ahora.
NO hagas todavía: el contenido visual de dashboard ni los módulos internos. Solo la arquitectura, el login funcional y los componentes vacíos de cada módulo.
Muéstrame al terminar: auth.service.ts, auth.interceptor.ts y el componente login.component.ts + login.component.html.

Cuando OpenCode termine, me muestras esos tres archivos y verifico que el flujo de autenticación esté bien conectado antes de pasar a la Fase 7 que es el dashboard y los módulos visuales, que es donde entra el diseño premium que tanto te gustó de la imagen.

Revisión Fase 6 — ✅ Aprobado
Todo correcto: el auth.service.ts maneja el URLSearchParams correctamente para el formato OAuth2PasswordRequestForm que espera FastAPI, el interceptor agrega el header solo a requests de la API y desloguea en 401, y el login funcional con manejo de error 401 específico está bien resuelto.
El login actual es solo el placeholder funcional que pediste para esta fase. Ahora en el Prompt 7B le damos la cara real de la imagen 7 (split-screen).

Empezamos con el Prompt 7A — Navbar + Shell, la pieza que envuelve todos los módulos. La extraje directamente de tus imágenes (está presente e idéntica en Dashboard, Agenda, Clientes, Terapeutas, Servicios e Inventario).

[FASE 7A — NAVBAR Y SHELL PRINCIPAL]
Vamos a construir el shell visual de ZenSpa Bienestar (navbar superior + contenedor de rutas). Esto envuelve TODOS los módulos del sistema. Sigue las especificaciones EXACTAS, no inventes valores.
Actualiza primero src/styles.scss reemplazando las variables de color por la paleta definitiva "Zen Luxury":
scss@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Inter:wght@300;400;500;600;700&display=swap');

:root {
--color-bg: #F6F1EA;
--color-bg-secondary: #EFE7DD;
--color-surface: #FFFFFF;
--color-primary: #C96A2B;
--color-primary-hover: #B85D24;
--color-secondary: #D9B48F;
--color-text: #2B2B2B;
--color-text-secondary: #6B625C;
--color-text-aux: #7A736D;
--color-border: #E7DDD3;
--color-success: #6F9F78;
--color-warning: #D6A04B;
--color-error: #C96A6A;

--color-header: #F8F3EC;
--color-sidebar: #FAF7F2;

--estado-confirmada-bg: #EDF7EE; --estado-confirmada-text: #4D8A5C;
--estado-pendiente-bg: #FFF4E6; --estado-pendiente-text: #C67B28;
--estado-cancelada-bg: #FDECEC; --estado-cancelada-text: #C15A5A;
--estado-penalidad-bg: #F6E6E6; --estado-penalidad-text: #9D3F3F;

--shadow-card: 0 8px 30px rgba(43, 43, 43, 0.06);
--shadow-card-hover: 0 12px 40px rgba(43, 43, 43, 0.10);

--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 16px;
--radius-pill: 999px;

--font-heading: 'Playfair Display', serif;
--font-body: 'Inter', sans-serif;
}

- { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; }
  body { background: var(--color-bg); color: var(--color-text); font-family: var(--font-body); font-size: 14px; }
  h1, h2, h3 { font-family: var(--font-heading); font-weight: 600; color: var(--color-text); }

Componente shared/components/navbar/navbar.component.ts — standalone, recibe nada por input, usa inject(AuthService) y inject(Router) directamente.
Estructura exacta del navbar (basada en las capturas de referencia):
Barra horizontal, altura 72px, fondo var(--color-header), border-bottom: 1px solid var(--color-border), padding: 0 32px, display: flex; align-items: center; justify-content: space-between.
Zona izquierda — Logo:

Círculo de 40px con border-radius: 50%, fondo gradiente linear-gradient(135deg, #D9B48F 0%, #C96A2B 100%), contiene un ícono de hoja/lotus en SVG simple, color blanco, centrado.
A la derecha del círculo, dos líneas de texto sin separación vertical: "ZenSpa" en font-family: var(--font-heading); font-size: 18px; font-weight: 600; line-height: 1.1 y debajo "Bienestar" en font-size: 13px; font-weight: 400; color: var(--color-text-secondary); line-height: 1.1.
gap: 12px entre el círculo y el texto.

Zona central — Navegación:

display: flex; gap: 32px
Cada link: font-size: 14px; font-weight: 500; color: var(--color-text-secondary); text-decoration: none; padding-bottom: 4px; cursor: pointer; transition: color 0.2s
Link activo (routerLinkActive): color: var(--color-primary); border-bottom: 2px solid var(--color-primary)
Hover en links inactivos: color: var(--color-text)
Items y sus rutas, filtrados según el rol del usuario actual:

Inicio → /dashboard (admin, recepcionista)
Agenda → /agenda (admin, recepcionista, terapeuta)
Clientes → /clientes (admin, recepcionista, terapeuta)
Terapeutas → /terapeutas (admin)
Servicios → /servicios (admin)
Inventario → /inventario (admin)
Reportes → /reportes (admin)

Usa \*ngFor sobre un array filtrado en el componente con authService.hasRole(...item.roles).

Zona derecha:

display: flex; align-items: center; gap: 20px
Ícono de búsqueda (lupa SVG simple, 24px, color var(--color-text-secondary), sin funcionalidad por ahora, solo visual)
Ícono de campana de notificaciones (24px) con badge circular pequeño en la esquina superior derecha: background: var(--color-primary); color: white; font-size: 10px; width: 16px; height: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center. El número del badge no tiene dato real todavía, usa un valor estático 0 o ocúltalo si es 0 (deja la lógica preparada con un @Input o señal notificacionesCount, default 0).
Avatar circular 40px, border-radius: 50%, con iniciales del usuario (primera letra de nombre) sobre fondo var(--color-secondary), color de texto var(--color-text). Junto al avatar, dos líneas: el nombre del authService.getSession() en font-size: 14px; font-weight: 500 y debajo el rol capitalizado en font-size: 12px; color: var(--color-text-secondary).
Ícono de chevron-down (16px) al final, clickeable, abre un menú simple con una sola opción "Cerrar sesión" que llama a authService.logout(). El menú es un <div> posicionado absoluto con box-shadow: var(--shadow-card), background: var(--color-surface), border-radius: var(--radius-md), oculto por defecto (\*ngIf con una señal menuAbierto).

Componente app.component.html (o donde corresponda el shell raíz):
html@if (showNavbar()) {
<app-navbar />
}

<main class="main-content">
  <router-outlet />
</main>
showNavbar() es una señal computada que devuelve false cuando la ruta activa es /login (o cualquier ruta sin shell), true en el resto. Suscríbete a router.events para actualizarla.
.main-content: min-height: calc(100vh - 72px); background: var(--color-bg); padding: 32px; — pero cuando no hay navbar (login), el main-content debe ocupar 100vh sin padding. Maneja esto con una clase condicional.

Reglas:

Usa SVG inline para los íconos (lupa, campana, chevron, lotus), no instales librerías de íconos nuevas.
Todo el texto visible en español.
El navbar debe ser responsive: en pantallas menores a 1024px, los links de navegación central colapsan a un menú hamburguesa (puedes dejar la lógica del toggle preparada con una señal, el diseño del menú móvil no necesita ser pixel-perfect en esta fase).

NO hagas todavía: contenido de dashboard, agenda ni otros módulos. Solo el navbar y el shell.
Muéstrame navbar.component.ts, navbar.component.html, navbar.component.scss y los cambios en app.component.html/.ts al terminar.

Cuando termine, me los muestras y reviso especialmente el filtro de navegación por rol y la lógica de showNavbar(). Después seguimos con el Prompt 7B (Login con el diseño de la imagen 7).

Revisión Fase 7A — ✅ Aprobado
Todo está correcto. Tres detalles que vale la pena que notes:
itemsVisibles = computed(...) es la forma idiomática moderna de Angular 17+, bien usado. El $event.stopPropagation() en el botón de logout dentro del dropdown es necesario para evitar que el click se propague al user-area y vuelva a abrir el menú, está bien puesto. El showNavbar reactivo a NavigationEnd es la solución correcta para que el navbar no aparezca en login.
Un detalle menor: el ícono SVG del logo es una hoja genérica, en el Prompt 7B le voy a dar el SVG exacto del lotus/ola que se ve en tu imagen del icono (imagen 4 que me mandaste).

Prompt 7B — Login

[FASE 7B — LOGIN SPLIT-SCREEN]
Reemplaza el login placeholder con el diseño final. Sigue las especificaciones píxel a píxel.
Archivos a modificar/crear:

src/app/modules/auth/login/login.component.ts (ya existe, solo actualiza el template y estilos)

src/app/modules/auth/login/login.component.html

src/app/modules/auth/login/login.component.scss

Layout general:

display: grid; grid-template-columns: 1fr 1fr; height: 100vh; overflow: hidden
Sin navbar (ya controlado por showNavbar en app.component).

Panel izquierdo — .panel-izquierdo:

Ocupa el 50% del ancho, height: 100vh
Fondo: imagen de spa (usa un gradiente que simule la atmósfera hasta que se tenga imagen real): background: linear-gradient(160deg, #3D2314 0%, #6B3A1F 30%, #9C5A2E 60%, #C96A2B 100%)
position: relative; overflow: hidden; display: flex; flex-direction: column; justify-content: space-between; padding: 48px
Zona superior: logo + nombre de marca

Círculo 48px con background: rgba(255,255,255,0.15); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.25); border-radius: 50%. Dentro el SVG del lotus (ver abajo), color blanco.
A la derecha: "ZENSPA" en font-family: var(--font-heading); font-size: 18px; font-weight: 700; color: #FFFFFF; letter-spacing: 3px y debajo "BIENESTAR" en font-size: 12px; letter-spacing: 4px; color: rgba(255,255,255,0.7)
display: flex; align-items: center; gap: 16px

Zona central: el texto hero

margin-top: auto
Título: "La serenidad comienza antes" + salto de línea + "de " + <em>"tu primera sesión."</em> — el <em> en color: #D9B48F; font-style: italic
Fuente: font-family: var(--font-heading); font-size: 42px; font-weight: 600; color: #FFFFFF; line-height: 1.2; margin-bottom: 20px
Subtítulo: "Gestiona, conecta y transforma el bienestar de tus clientes." en font-size: 16px; color: rgba(255,255,255,0.75); line-height: 1.6; max-width: 340px

Zona inferior: badge de seguridad

display: flex; align-items: center; gap: 12px; background: rgba(0,0,0,0.3); backdrop-filter: blur(8px); border-radius: var(--radius-md); padding: 16px 20px; margin-top: auto
Ícono escudo SVG simple, color blanco, 20px
Texto: "Acceso seguro y protegido" en font-size: 14px; font-weight: 500; color: #FFFFFF y debajo "Tus datos están cifrados y respaldados." en font-size: 13px; color: rgba(255,255,255,0.65)

SVG del lotus (úsalo en el panel izquierdo y en la tarjeta del panel derecho):
html<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
<path d="M12 3c0 0-3 3-3 7 0 2 1.5 3.5 3 4 1.5-.5 3-2 3-4 0-4-3-7-3-7z"/>
<path d="M12 14c0 0-5 1-7 4 2 1 5 1 7-2"/>
<path d="M12 14c0 0 5 1 7 4-2 1-5 1-7-2"/>
<path d="M5 10c-1.5 1-2.5 2.5-2.5 4 1.5.5 3 0 4-1.5"/>
<path d="M19 10c1.5 1 2.5 2.5 2.5 4-1.5.5-3 0-4-1.5"/>
<line x1="12" y1="22" x2="12" y2="14"/>
</svg>

Panel derecho — .panel-derecho:

background: #FAF7F2; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px
Decoración sutil: position: relative; overflow: hidden. Agrega una hoja SVG grande decorativa en la esquina superior derecha con position: absolute; top: -40px; right: -40px; opacity: 0.12; color: var(--color-primary), tamaño 200px (solo visual, no interactivo).

Tarjeta del formulario — .login-card:

background: var(--color-surface); border-radius: var(--radius-lg); padding: 48px 40px; width: 100%; max-width: 440px; box-shadow: var(--shadow-card)

Cabecera de la tarjeta:

Círculo del logo 52px, centrado, background: var(--color-primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px. SVG lotus blanco dentro, 28px.
"ZENSPA BIENESTAR" en font-size: 12px; font-weight: 600; letter-spacing: 3px; color: var(--color-primary); text-align: center; margin-bottom: 12px
"Bienvenido de nuevo" en font-family: var(--font-heading); font-size: 28px; font-weight: 600; text-align: center; color: var(--color-text); margin-bottom: 8px
"Accede a tu espacio de bienestar." en font-size: 14px; color: var(--color-text-secondary); text-align: center; margin-bottom: 32px

Campo de email:

Label: "Correo electrónico" — font-size: 13px; font-weight: 500; color: var(--color-text); margin-bottom: 8px
Input wrapper: position: relative con ícono de sobre SVG a la izquierda (position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--color-text-secondary); width: 16px)
Input: width: 100%; height: 48px; padding: 0 16px 0 42px; border: 1.5px solid var(--color-border); border-radius: var(--radius-sm); font-size: 14px; font-family: var(--font-body); background: var(--color-surface); color: var(--color-text); outline: none; transition: border-color 0.2s
Focus: border-color: var(--color-primary)
Error: border-color: var(--color-error)

Campo de contraseña:

Igual al email pero con ícono candado a la izquierda y botón ojo a la derecha (position: absolute; right: 14px) que alterna type="password" / type="text". Agrega señal mostrarPassword = signal(false) al componente.

Fila de opciones:

display: flex; justify-content: space-between; align-items: center; margin: 16px 0 24px
Checkbox "Recordarme": estilo personalizado, color var(--color-primary) cuando activo
Link "¿Olvidaste tu contraseña?": font-size: 13px; color: var(--color-primary); text-decoration: none; cursor: pointer

Botón principal:

width: 100%; height: 52px; background: var(--color-primary); color: #FFFFFF; border: none; border-radius: var(--radius-sm); font-size: 15px; font-weight: 600; font-family: var(--font-body); cursor: pointer; transition: background 0.2s; display: flex; align-items: center; justify-content: center; gap: 10px
Hover: background: var(--color-primary-hover)
Disabled (loading): opacity: 0.7; cursor: not-allowed
Contenido: ícono lotus SVG 16px blanco + texto "Iniciar sesión" + ícono flecha derecha SVG 16px blanco

Mensaje de error:

background: #FDECEC; border: 1px solid var(--color-error); border-radius: var(--radius-sm); padding: 12px 16px; font-size: 13px; color: var(--color-error); margin-bottom: 16px
Solo visible cuando error tiene valor.

Badges de seguridad inferiores:

display: flex; justify-content: center; gap: 24px; margin-top: 28px
Tres ítems: "Seguro", "Privado", "Confiable"
Cada uno: ícono SVG (escudo, candado, check) 16px color var(--color-primary) + texto font-size: 12px; color: var(--color-text-secondary)
display: flex; flex-direction: column; align-items: center; gap: 6px

Footer:

Fuera de la tarjeta, al fondo del panel: "© 2024 ZenSpa Bienestar · Todos los derechos reservados" en font-size: 12px; color: var(--color-text-aux); text-align: center; margin-top: 32px

Lógica del componente .ts — agrega a lo existente:
typescriptmostrarPassword = signal(false);

Responsive:

En pantallas < 768px: oculta el panel izquierdo (display: none), el panel derecho ocupa 100vw.

Reglas:

Todos los íconos SVG inline, sin librerías externas.
No uses <form> — usa (ngSubmit) en el tag existente o simplemente un <div> con (keydown.enter). Espera, Angular acepta <form> con [formGroup] y (ngSubmit) sin problema, úsalo normal.
El formGroup y la lógica de submit ya existen en el .ts, no los toques.

Muéstrame login.component.html y login.component.scss completos al terminar.

Cuando OpenCode termine el login, me lo muestras, lo reviso visualmente contra tu imagen 7 y te doy el Prompt 7C — Dashboard.

(adjuntado).

8:20
Revisión 7B — ✅ Aprobado
El login está completo y fiel al diseño de referencia. El split-screen, el backdrop-filter en el badge de seguridad, el toggle del ojo en la contraseña, el checkbox personalizado y los badges de seguridad inferiores están todos correctamente implementados.

Prompt 7C — Dashboard
Analicé tu imagen 3 (Dashboard) en detalle. Es la vista más compleja visualmente: hero con gradiente + nombre, mini-agenda lateral, 4 KPIs, tabla de próximas citas, terapeutas activos, servicios populares, inventario bajo y acciones rápidas. Lo vamos a construir en dos partes para que DeepSeek no se pierda.

[FASE 7C — DASHBOARD ADMIN/RECEPCIONISTA — Parte 1: Hero + KPIs + Agenda compacta]

Crea el componente del dashboard. Este módulo solo lo ven admin y recepcionista (ya está protegido por el guard). Los datos que no vienen del backend en esta fase se muestran con valores estáticos o calculados desde el seed. En fases posteriores se conectarán a endpoints reales.

Archivo: src/app/modules/dashboard/dashboard.component.ts + .html + .scss

Importa AuthService para el saludo personalizado.

SECCIÓN 1 — Hero contextual:

Contenedor .hero-section:

position: relative; overflow: hidden; border-radius: var(--radius-lg); margin-bottom: 28px; min-height: 200px; background: linear-gradient(135deg, #F6F1EA 0%, #EADBCB 40%, #D9B48F 70%, #C96A2B 100%); display: flex; align-items: flex-end; padding: 40px 48px
Zona de texto (izquierda, z-index por encima del fondo):
Saludo: "Buenos días," en font-family: var(--font-heading); font-size: 42px; font-weight: 600; color: var(--color-text); line-height: 1
Nombre del usuario en línea siguiente: font-family: var(--font-heading); font-size: 42px; font-weight: 600; font-style: italic; color: var(--color-primary). El nombre viene de authService.getSession()?.nombre.
Subtítulo debajo: "La serenidad también se administra." en font-size: 16px; color: var(--color-text-secondary); margin-top: 12px
Fecha actual debajo del subtítulo: calcula con new Date() en el componente, formatea como "Martes, 14 de mayo de 2024" en español usando Intl.DateTimeFormat('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }). Muéstrala en font-size: 13px; color: var(--color-text-aux)
Decoración derecha: un círculo grande 300px x 300px, border-radius: 50%, background: rgba(201, 106, 43, 0.12), position: absolute; right: -60px; top: -80px (solo decorativo, pointer-events: none). Encima otro círculo 200px x 200px, background: rgba(217, 180, 143, 0.2), position: absolute; right: 60px; top: -20px.
SECCIÓN 2 — Grid principal (agenda izquierda + KPIs + contenido derecho):

Layout de toda la página debajo del hero:

scss
.dashboard-grid {
display: grid;
grid-template-columns: 320px 1fr;
gap: 24px;
align-items: start;
}
Columna izquierda — .agenda-lateral:

Card con background: var(--color-surface); border-radius: var(--radius-lg); box-shadow: var(--shadow-card); overflow: hidden

Sub-sección .agenda-header:

Título "Agenda de hoy" en font-family: var(--font-heading); font-size: 18px; font-weight: 600; padding: 24px 24px 16px
Mini-calendario semanal: 7 columnas LUN MAR MIÉ JUE VIE SÁB DOM, encabezados en font-size: 11px; font-weight: 600; color: var(--color-text-aux); text-transform: uppercase. Debajo los números del 13 al 19 (hardcodeados por ahora). El día actual (14) se resalta: background: var(--color-primary); color: #fff; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center. Resto de días: font-size: 14px; color: var(--color-text-secondary); width: 32px; height: 32px; display: flex; align-items: center; justify-content: center. Flechas < > a los lados del encabezado del mini-calendario (solo visuales, sin lógica).
Sub-sección .citas-hoy: lista de 4 citas del día (datos del seed)

Cada cita: display: flex; align-items: flex-start; gap: 12px; padding: 12px 24px; border-bottom: 1px solid var(--color-border)
Hora: font-size: 13px; font-weight: 600; color: var(--color-text); min-width: 44px
Círculo indicador pequeño 8px, color según estado (--estado-confirmada-text o --estado-pendiente-text)
Nombre del servicio: font-size: 14px; font-weight: 500
Nombre del cliente y sala: font-size: 12px; color: var(--color-text-secondary)
Badge de estado alineado a la derecha: usa los colores de estado definidos en styles.scss
Datos hardcodeados para esta fase (basados en el seed): 09:00 Masaje Relajante - Pedro Fernández - Sala Serenidad - Confirmada, 11:30 Limpieza Facial Profunda - Sofía Ramírez - Sala Armonía - Pendiente, 14:00 Hidroterapia Corporal - Javier Torres - Sala Aqua - Confirmada, 16:00 Masaje Relajante - Pedro Fernández - Sala Serenidad - Cancelada
Link al fondo: "Ver agenda completa →" en color: var(--color-primary); font-size: 13px; padding: 16px 24px; display: block; text-decoration: none

Card inferior izquierda — .promo-card: debajo de la agenda

background: linear-gradient(135deg, #3D2314 0%, #C96A2B 100%); border-radius: var(--radius-lg); padding: 28px; color: #fff; margin-top: 0
Texto: "Cuida del bienestar de tus clientes, nosotros te ayudamos a gestionarlo." en font-family: var(--font-heading); font-size: 18px; line-height: 1.4; margin-bottom: 16px
Link: "Ver experiencia ZenSpa →" en font-size: 13px; color: #D9B48F; text-decoration: none; display: flex; align-items: center; gap: 6px
Columna derecha — .dashboard-right:

Sub-sección .kpis-grid:

scss
display: grid;
grid-template-columns: repeat(4, 1fr);
gap: 16px;
margin-bottom: 24px;
4 cards KPI con estructura idéntica:

background: var(--color-surface); border-radius: var(--radius-md); padding: 20px; box-shadow: var(--shadow-card)
Label superior: font-size: 12px; color: var(--color-text-aux); margin-bottom: 8px
Valor: font-family: var(--font-heading); font-size: 26px; font-weight: 600; color: var(--color-text)
Subtexto: font-size: 12px; color: var(--color-text-aux); margin-top: 4px
Ícono SVG 28px alineado a la derecha: color: var(--color-primary); opacity: 0.7
Datos de los 4 KPIs (hardcodeados):

Label: "Ingresos de hoy" / Valor: "$ 485,000" / Sub: "+12% vs ayer" / Ícono: tendencia-up (flecha con línea)
Label: "Ocupación de cabinas" / Valor: "78%" / Sub: "3 / 4 ocupadas" / Ícono: círculo con porcentaje o puerta
Label: "Citas de hoy" / Valor: "4" / Sub: "1 pendiente" / Ícono: calendario
Label: "Nuevos clientes" / Valor: "4" / Sub: "+2 vs ayer" / Ícono: persona con plus
Para cada ícono usa SVG inline simple y representativo (no necesita ser pixel-perfect, solo reconocible).

Reglas generales:

Todos los datos de citas y KPIs son hardcodeados en esta fase. En el prompt siguiente (7C Parte 2) conectamos los datos reales del backend.
No uses HttpClient todavía en este componente.
Todo texto en español.
El componente debe ser standalone: true.
NO hagas todavía: tabla de próximas citas, terapeutas activos, servicios populares, inventario bajo, acciones rápidas. Eso va en la Parte 2.

Muéstrame dashboard.component.html y dashboard.component.scss completos al terminar.

Cuando OpenCode termine la Parte 1, me la muestras, reviso y te doy la Parte 2 con el resto del dashboard (la mitad inferior: próximas citas, terapeutas activos, servicios populares, inventario bajo y acciones rápidas).

# =========================================================================================================================

# =========================================================================================================================

# =========================================================================================================================

Lo que ya está hecho ✅
Backend completo:

Fase 1 — Schema MySQL 3NF, triggers anti-overlap, seed colombiano
Fase 2 — Esqueleto FastAPI con SQLAlchemy, variables de entorno, /health
Fase 3 — Auth JWT, guards por rol, CRUD usuarios
Fase 4 — CRUDs de clientes, terapeutas, cabinas, servicios, productos
Fase 5 — Módulo de citas con transacción atómica y reportes

Frontend:

Fase 6 — Arquitectura Angular, servicios HTTP, guards, interceptor, rutas
Fase 7A — Navbar + shell con filtro por rol
Fase 7B — Login split-screen completo
Fase 7C Parte 1 — Hero + KPIs + Agenda lateral (hardcodeado)

Lo que falta por hacer y sus prompts

Prompt 7C Parte 2 — Dashboard (sección inferior)

[FASE 7C PARTE 2 — DASHBOARD: SECCIÓN INFERIOR]
Continuamos el dashboard. Agrega las secciones inferiores al componente dashboard.component ya existente. No toques lo que ya está arriba del archivo.
Dentro de .dashboard-right, debajo de .kpis-grid, agrega:
Sección "Próximas citas" — .proximas-citas:

Header: título "Próximas citas" a la izquierda + link "Ver todas" a la derecha en color: var(--color-primary); font-size: 13px
Tabla compacta con columnas: HORA | CLIENTE | SERVICIO | TERAPEUTA | SALA | ESTADO
font-size: 13px. Encabezados en color: var(--color-text-aux); font-size: 11px; font-weight: 600; text-transform: uppercase; padding-bottom: 12px
Cada fila: padding: 12px 0; border-bottom: 1px solid var(--color-border)
Cliente y terapeuta muestran avatar circular 28px con inicial sobre var(--color-secondary) + nombre
Badge de estado con los colores de styles.scss: confirmada/pendiente/cancelada
Datos hardcodeados (5 filas del seed): 09:00 Pedro Fernández / Masaje Relajante / Laura García / Serenidad / Confirmada, 11:30 Sofía Ramírez / Limpieza Facial / Miguel Sánchez / Armonía / Pendiente, 14:00 Javier Torres / Hidroterapia / Elena Rodríguez / Aqua / Confirmada, 16:00 Pedro Fernández / Masaje Relajante / Laura García / Serenidad / Cancelada, 10:00 María Vega / Aromaterapia / Elena Rodríguez / Aroma / Pendiente

Sección "Terapeutas activos" — .terapeutas-activos:

display: grid; grid-template-columns: 1fr 2fr; gap: 24px; margin-top: 24px
Card izquierda: título "Terapeutas activos" + link "Ver todos". Debajo 4 terapeutas en fila: avatar circular 56px con inicial, punto verde 8px en esquina inferior derecha (background: var(--color-success); border: 2px solid white), nombre debajo font-size: 13px; font-weight: 500, especialidad font-size: 11px; color: var(--color-text-aux). Datos: Laura García/Masajes, Miguel Sánchez/Facial, Elena Rodríguez/Hidroterapia, Ana Martínez/Admin

Sección inferior — grid de 3 columnas:

display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 24px; margin-top: 24px

Card "Servicios más reservados": título + link "Ver todos". Lista de 4 servicios: nombre + cantidad de reservas a la izquierda, mini sparkline SVG a la derecha (línea simple de 3-4 puntos hardcodeada, solo visual). Datos del seed: Masaje Relajante 2 reservas, Limpieza Facial 2 reservas, Hidroterapia 1 reserva, Aromaterapia 1 reserva.
Card "Inventario bajo": título + link "Ver inventario". Lista de 4 productos con stock bajo. Cada fila: nombre del producto + "Stock: X unidades" en color: var(--color-warning). Datos del seed: Crema Hidratante Facial Stock 3, Mascarilla de Arcilla Stock 2 (estos son los que están bajo stock_minimo en el seed).
Card "Acciones rápidas": título. Grid 2x3 de botones: "Nueva cita" (ícono calendario), "Nuevo cliente" (ícono persona+), "Cobrar servicio" (ícono billete), "Venta de producto" (ícono caja), "Uso de inventario" (ícono clipboard), "Generar reporte" (ícono chart). Cada botón: background: var(--color-bg); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 16px 12px; display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; font-size: 12px; font-weight: 500; color: var(--color-text-secondary); transition: all 0.2s. Hover: border-color: var(--color-primary); color: var(--color-primary); background: var(--color-primary-light). Ícono SVG 20px, color: var(--color-primary).
Regla crítica de archivos: Todo el HTML va en dashboard.component.html. Todo el SCSS va en dashboard.component.scss. El .ts solo tiene la lógica (fecha, nombre de usuario). Cero estilos inline en el HTML. Cero HTML en el .ts.
Muéstrame los tres archivos completos al terminar.

Prompt 7D — Adaptar vistas de Stitch a Angular

[ADAPTACIÓN STITCH → ANGULAR]
Tengo vistas generadas con Google Stitch (que usa Tailwind CSS y genera HTML/CSS monolítico). Necesito que las adaptes al stack del proyecto ZenSpa Bienestar: Angular 17 standalone components, SCSS con las variables CSS del proyecto, sin Tailwind.
Reglas de adaptación obligatorias:

Separación estricta de archivos. Por cada vista debes generar exactamente 3 archivos separados:

nombre.component.ts — solo lógica: imports Angular, decorador @Component, propiedades, signals, métodos. Cero HTML. Cero estilos.
nombre.component.html — solo template HTML con directivas Angular (@if, @for, [formGroup], etc). Cero lógica. Cero estilos inline salvo [style.color] cuando sea dinámico por dato.
nombre.component.scss — solo estilos SCSS. Usa exclusivamente las variables CSS del proyecto (ver abajo). Cero clases Tailwind.

Conversión de Tailwind a variables CSS del proyecto. Mapeo obligatorio:

Colores de fondo (bg-_) → var(--color-bg), var(--color-surface), var(--color-bg-secondary)
Texto (text-_) → var(--color-text), var(--color-text-secondary), var(--color-text-aux)
Bordes (border-_) → var(--color-border), border-radius → var(--radius-sm/md/lg)
Sombras (shadow-_) → var(--shadow-card), var(--shadow-card-hover)
Color primario (orange-_, amber-_) → var(--color-primary), var(--color-primary-hover)
Estados de citas → var(--estado-confirmada-bg/text), var(--estado-pendiente-bg/text), etc.

Componentización. Si una sección se repite (cards de KPI, filas de tabla, badges de estado), extráela como subcomponente o al menos como bloque @for con datos en array del .ts. No copies HTML repetitivo.
Datos en el .ts, nunca en el .html. Si el HTML de Stitch tiene datos hardcodeados (nombres, números, estados), muévelos a arrays/objetos en el .ts y recórrelos con @for en el template.
Tipografía. Reemplaza cualquier font-sans o font-serif de Tailwind por font-family: var(--font-body) o var(--font-heading).
Íconos. Si Stitch usa Heroicons u otra librería externa, reemplázalos por SVG inline equivalente dentro del HTML. No instales librerías de íconos nuevas.
Formularios. Si hay formularios, usa ReactiveFormsModule con FormBuilder. Nunca [(ngModel)].

Cuando te pase el código de Stitch de una vista, aplica todas estas reglas y entrega los 3 archivos separados. Confirma que entendiste antes de empezar.

Prompt 7E — Registro de usuarios y flujo de auto-registro de clientes

[FASE 7E — REGISTRO Y GESTIÓN DE USUARIOS]
Implementa el flujo completo de creación de usuarios con estas reglas de negocio:
Regla de registro:

Clientes pueden auto-registrarse desde el login (botón "¿No tienes cuenta? Regístrate"). El formulario de registro público solo crea usuarios con rol cliente. No hay selector de rol.
Admin, recepcionista y terapeuta solo pueden ser creados por un admin autenticado desde el módulo de gestión de usuarios (/usuarios/nuevo). Nunca desde el registro público.

Archivo 1 — Registro público de clientes:

src/app/modules/auth/registro/registro.component.ts|html|scss
Ruta: /registro (sin guard, pública)

Agrega en app.routes.ts: { path: 'registro', component: RegistroComponent }
Layout: misma estructura split-screen del login (panel izquierdo con gradiente + panel derecho con formulario). Reutiliza las clases del login o crea un archivo \_auth-layout.scss compartido en src/styles/.
Formulario con ReactiveFormsModule:

Nombre (required)
Apellido (required)
Email (required, email validator)
Teléfono (required, pattern ^3[0-9]{9}$ — 10 dígitos colombianos empezando en 3)
Fecha de nacimiento (required)
Contraseña (required, minLength 8, pattern con al menos 1 mayúscula, 1 número y 1 carácter especial)
Confirmar contraseña (required, validador cruzado que compare con password)
Preferencias (opcional, textarea)

Al hacer submit: POST a /clientes con el rol hardcodeado como cliente. Si respuesta 200, navega a /login con un query param ?registered=true. En login, si existe ese param, muestra un mensaje de éxito: "Cuenta creada exitosamente. Inicia sesión para continuar." en verde.
En login.component.html agrega al fondo de la tarjeta: "¿No tienes cuenta? " + link "Regístrate" → /registro
Archivo 2 — Creación de usuarios internos (admin):

src/app/modules/usuarios/nuevo-usuario/nuevo-usuario.component.ts|html|scss
Ruta: /usuarios/nuevo, guard: solo admin
Diseño: página con panel izquierdo oscuro (imagen del spa, gradiente #3D2314 → #C96A2B) con texto "Crea acceso para tu equipo" y descripción, panel derecho con el formulario.
Formulario:

Nombre, Apellido, Email, Teléfono (igual que registro)
Rol: <select> con opciones admin | recepcionista | terapeuta (nunca cliente aquí)
Estado activo: toggle switch, default true
Contraseña + Confirmar contraseña con los mismos validators
Panel informativo derecho (dentro del formulario, tarjeta separada): descripción de cada rol con sus permisos

Al lado derecho del formulario (en desktop), muestra una card informativa con íconos explicando qué puede hacer cada rol: Administrador / Recepcionista / Terapeuta / Cliente.
Submit → POST a /usuarios. Éxito → navega a /terapeutas si el rol era terapeuta, si no a /usuarios.
Regla crítica de archivos: 3 archivos por componente. HTML en .html, lógica en .ts, estilos en .scss. El validador cruzado de contraseñas va como función pura fuera de la clase en el mismo .ts.
Muéstrame todos los archivos al terminar.

Prompt 7F — Módulo Agenda

[FASE 7F — MÓDULO AGENDA]
Crea el módulo de agenda. Es la vista más compleja del sistema — tres columnas horizontales.
src/app/modules/agenda/agenda.component.ts|html|scss
Layout general:
scss.agenda-page { display: grid; grid-template-columns: 320px 1fr 320px; gap: 24px; height: calc(100vh - 72px - 64px); }
Columna 1 — "1. Seleccionar cliente":

Header con número "1." + título
Buscador: input con ícono lupa, placeholder "Buscar cliente por nombre, email o teléfono…". Al escribir filtra el array local de clientes.
Link "+ Nuevo cliente" en color: var(--color-primary)
Lista de clientes: cada ítem tiene avatar circular con inicial, nombre en bold, email en muted, teléfono. Al hacer click se selecciona (borde var(--color-primary), fondo rgba(201,106,43,0.06)).
Al fondo: "Ver todos los clientes →"
Sección "Información del cliente" debajo cuando hay uno seleccionado: avatar más grande, nombre, badge Activo/Inactivo, fecha de nacimiento, historial de salud, preferencias, link "Ver historial completo"
Datos: usa el array de clientes del seed (4 clientes).

Columna 2 — "2. Configurar cita":

Sub-header con número y título
Fecha: date picker nativo <input type="date"> estilizado
Duración aproximada: <select> con opciones 45 min / 60 min / 75 min / 90 min
Buscar horario: <select> "Cualquier hora" por ahora
Sección Terapeuta: cards horizontales scrolleables. Cada card: avatar circular 48px con inicial, punto de disponibilidad verde, nombre, especialidad. Al seleccionar: borde var(--color-primary).
Sección Servicios: lista de servicios disponibles. Cada ítem: ícono categoria SVG, nombre, descripción corta, duración, precio formateado en COP ($85.000). Botón + para agregar. Panel a la derecha "Servicios seleccionados" con los agregados y botón × para quitar. Subtotal actualizado reactivamente.
Sección Cabinas: 4 cards con foto placeholder (gradiente que representa la cabina), nombre, tipo, badge "Disponible". Al seleccionar: borde var(--color-primary) y check.
Observaciones: <textarea> con contador de caracteres 0/250

Columna 3 — "3. Resumen de la cita":

Sticky: position: sticky; top: 24px
Card con: cliente seleccionado (avatar + nombre + teléfono), terapeuta seleccionado (avatar + nombre + especialidad), fecha y hora, cabina, lista de servicios con precio, subtotal, IVA 19%, Total en grande con color: var(--color-primary); font-family: var(--font-heading); font-size: 28px
Botón "Confirmar cita" full-width, terracota sólido. Al clickear llama al CitaService.create() con los datos seleccionados.
Nota debajo: "Se enviará una confirmación al cliente por email y WhatsApp."

Botón superior derecho de la página: "Ver calendario" (outline) + "+ Nueva cita" (terracota sólido) — el botón nueva cita resetea el formulario.
Lógica en el .ts:

Signals: clienteSeleccionado, terapeutaSeleccionado, cabinaSeleccionada, serviciosSeleccionados (array), subtotal (computed), total (computed con IVA)
agregarServicio(s), quitarServicio(id), seleccionarCliente(c), confirmarCita() que llama al service
Los datos de clientes, terapeutas, servicios y cabinas se cargan desde el backend en ngOnInit usando los services correspondientes

Regla crítica: .ts solo lógica, .html solo template, .scss solo estilos. Cero mezcla.
Muéstrame los 3 archivos completos.

Prompts 7G, 7H, 7I, 7J — Módulos restantes
Para clientes, terapeutas, servicios e inventario el patrón es idéntico — tabla + panel lateral de detalle — así que el prompt es el mismo con datos diferentes:

[FASE 7G — MÓDULO CLIENTES]
Crea src/app/modules/clientes/clientes.component.ts|html|scss.
Layout: display: grid; grid-template-columns: 1fr 380px; gap: 24px — tabla a la izquierda, panel de detalle a la derecha (se muestra al seleccionar una fila).
Header de página: título "Clientes" + subtítulo + buscador + botón filtros + botón "+ Nuevo cliente" terracota.
4 KPI cards arriba: Total clientes / Clientes nuevos mes / Clientes frecuentes / Valor promedio por cliente. Datos del ClienteService.getAll().
Tabla:

Columnas: CLIENTE (avatar + nombre + email) | TELÉFONO | FECHA NAC. | ÚLTIMA VISITA | GASTO TOTAL | ESTADO | ACCIONES

ÚLTIMA VISITA y GASTO TOTAL son calculados en el backend (agrega endpoint GET /clientes/{id}/resumen que retorne {total_visitas, gasto_total, ultima_visita} — dile a OpenCode que primero revise si ese endpoint existe y si no lo cree en FastAPI).
Badge de estado: Activo/Inactivo con colores definidos
Acciones: ícono ojo (ver detalle), ícono lápiz (editar), ícono papelera (desactivar con confirmación modal)
Paginación al fondo: "Mostrando 1 a N de X clientes" + controles « ‹ 1 2 3 … › » + selector "8 por página"

Panel de detalle derecho:

position: sticky; top: 24px; background: var(--color-surface); border-radius: var(--radius-lg); box-shadow: var(--shadow-card); padding: 24px
Header: título "Detalle del cliente" + botón X para cerrar
Avatar grande 72px con inicial, nombre, badge estado, email, teléfono, fecha nacimiento
Tabs: Información | Historial | Preferencias | Notas — cada tab muestra contenido diferente:

Información: historial_salud (solo si el rol puede verlo), preferencias
Historial: lista de citas pasadas del cliente
Preferencias: texto de preferencias
Notas: campo libre (por implementar)

Stats: Total de visitas + Gasto total + Cliente desde
Botones al fondo: "Editar cliente" (outline) + "Eliminar cliente" (rojo)

Señal activa: clienteSeleccionado = signal<Cliente | null>(null). Al clickear una fila se setea. El panel derecho se muestra con @if (clienteSeleccionado()).
Al cargar: ClienteService.getAll() en ngOnInit. Loading state con skeleton o spinner.
Regla: 3 archivos separados obligatorio.

[FASE 7H — MÓDULO TERAPEUTAS]
Crea src/app/modules/terapeutas/terapeutas.component.ts|html|scss.
Mismo patrón layout que clientes (tabla + panel lateral).
4 KPIs: Total terapeutas / Terapeutas activos / Citas asignadas hoy (dato del endpoint de citas filtradas por fecha hoy) / Calificación promedio (hardcodeado 4.8 / 5 por ahora)
Tabla:

Columnas: TERAPEUTA (avatar + nombre + email) | ESPECIALIDAD (badge con ícono) | CITAS ESTA SEMANA (número + barra de progreso sobre 16) | ESTADO | ACCIONES
La barra de progreso: <div class="progress-bar"> con width: calc(citas/16\*100%), background: var(--color-primary), height: 4px, border-radius: 2px
Panel de detalle:

Avatar 72px, nombre, badge activo, email, teléfono, fecha nacimiento
Tabs: Información | Disponibilidad | Rendimiento | Documentos
Información: badge especialidad + lista de certificaciones (parsea el string por . o \n) + texto "Sobre mí" (hardcodeado por ahora)
Stats: Citas esta semana / Calificación promedio / Clientes atendidos
Botones: "Editar terapeuta" + "Desactivar terapeuta" (rojo)

Carga datos con TerapeutaService.getAll().

[FASE 7I — MÓDULO SERVICIOS]
Crea src/app/modules/servicios/servicios.component.ts|html|scss.
Layout: grid tabla + panel lateral.
4 KPIs: Total servicios / Duración promedio (calcula el promedio de duracion_minutos) / Precio promedio (promedio de precio) / Servicio más reservado (del endpoint reportes/servicios-populares)
Tabla:

Columnas: SERVICIO (thumbnail cuadrado 48px con gradiente por tipo de terapia + nombre + descripción corta) | TIPO DE TERAPIA (badge con ícono) | DURACIÓN | PRECIO (formateado COP) | ESTADO | ACCIONES
Para el thumbnail usa un gradiente según tipo_terapia: masajes → #D9B48F → #C96A2B, facial → #F0D9C8 → #D9A87A, hidroterapia → #C8D9F0 → #7A9FD9, aromaterapia → #D4C8F0 → #9A7AD9
Panel de detalle:

Imagen/thumbnail grande 100% con gradiente del tipo
Nombre, tipo, duración, precio
Tabs: Información | Disponibilidad
Información: campos Descripción, Beneficios, Incluye, Recomendaciones, Contraindicaciones (todos hardcodeados inicialmente, después pueden editarse)
Disponibilidad: cabinas compatibles con este servicio (llama a GET /cabinas/{id}/servicios invertido — o simplemente muestra las cabinas de cabina_servicios)
Botones: "Editar servicio" + "Eliminar servicio" (rojo, con modal de confirmación)

Carga con ServicioService.getAll().

[FASE 7J — MÓDULO INVENTARIO]
Crea src/app/modules/inventario/inventario.component.ts|html|scss.
Layout: grid tabla + panel lateral.
4 KPIs: Total productos / Stock total (suma de todos los stock) / Bajo stock (productos donde stock <= stock_minimo) en color var(--color-warning) si > 0 / Valor del inventario (suma de stock \* costo_unitario)
Filtros sobre la tabla: buscador + dropdown Categoría (por ahora todas las categorías hardcodeadas) + dropdown Estado (Todos/OK/Bajo stock/Crítico) + dropdown Stock + botón Filtros + link Limpiar filtros
Tabla:

Columnas: PRODUCTO (thumbnail + nombre + descripción) | STOCK (número, en naranja si bajo) | STOCK MÍNIMO | COSTO UNITARIO (COP) | VALOR TOTAL (stock \* costo_unitario) | ESTADO (OK/Bajo stock/Crítico) | ACCIONES
Estado calculado en el .ts: si stock === 0 → Crítico (rojo), si stock <= stock_minimo → Bajo stock (naranja), si no → OK (verde).
Panel de detalle:

Imagen placeholder con gradiente según categoría
Nombre, código (puedes generarlo como "AE-LAV-001" genérico), categoría
Tabs: Información | Stock y movimientos | Proveedores
Información: Descripción, Presentación, Uso recomendado, Fecha de vencimiento, Proveedor (todos hardcodeados)
Stats: Stock actual / Stock mínimo / Costo unitario / Valor total
Botones: "Editar producto" + "Ajustar stock" (abre modal con input de cantidad y tipo: entrada/salida)

Carga con ProductoService.getAll(). El ajuste de stock llama a PUT /productos/{id}.

Prompt 7K — Módulo Reportes

[FASE 7K — MÓDULO REPORTES]
Crea src/app/modules/reportes/reportes.component.ts|html|scss.
Instala chart.js: npm install chart.js y usa el canvas de HTML5 directamente (sin ng2-charts para evitar dependencias extra).
Layout: grid de 2 columnas 1fr 1fr con algunos elementos que ocupan las 2 columnas (grid-column: span 2).
Sección 1 — Servicios más reservados (span 2):

Card con título + gráfico de barras horizontal (Chart.js, tipo bar con indexAxis: 'y')
Datos del endpoint GET /citas/reportes/servicios-populares
Colores de barras: var(--color-primary) con opacidad degradada
Al lado del gráfico: tabla resumen con nombre, total_reservas, ingresos_generados formateados en COP

Sección 2 — Ingresos por terapeuta:

Card con título + gráfico de barras vertical
Datos del endpoint GET /citas/reportes/ingresos-terapeutas
Eje Y en COP

Sección 3 — KPIs de resumen (span 2):

4 cards métricas: Total ingresos del período / Cita más popular / Terapeuta top / Producto más usado
Datos calculados en el .ts a partir de las respuestas de los dos endpoints

Selector de período en el header: "Esta semana | Este mes | Este año" — botones toggle. Al cambiar el período, re-llama a los endpoints (por ahora los endpoints no filtran por fecha pero la UI lo muestra).
Inicializa Chart.js en ngAfterViewInit con @ViewChild('barChart') barChartRef!: ElementRef.
Regla: 3 archivos separados.

Prompt final — README y entrega GitHub

[ENTREGA FINAL — README Y GITHUB]
Crea el archivo README.md en la raíz del proyecto con esta estructura exacta:
markdown# ZenSpa Bienestar

Sistema de Gestión de Spa y Centro de Relajación

## Descripción

Sistema web para gestionar clientes, terapeutas, cabinas, servicios, citas y facturación de ZenSpa Bienestar.

## Módulos

- Módulo de Acceso al Sistema (Login + Registro)
- Módulo de Gestión de Usuarios
- Módulo de Gestión de Clientes
- Módulo de Gestión de Terapeutas
- Módulo de Cabinas y Servicios
- Módulo de Productos e Inventario
- Módulo de Citas y Facturación
- Módulo de Reportes

## Stack tecnológico

- Frontend: Angular 17 (Standalone Components)
- Backend: Python 3.11 + FastAPI
- Base de datos: MySQL 8
- ORM: SQLAlchemy 2.0 + Alembic
- Autenticación: JWT (HS256) + bcrypt

## Instalación

### Backend

cd backend
pip install -r requirements.txt
cp .env.example .env # configurar variables
uvicorn main:app --reload

### Frontend

cd frontend/zenspa
npm install
ng serve

### Base de datos

mysql -u root -p < backend/database/schema.sql
mysql -u root -p zenspa_db < backend/database/triggers.sql
mysql -u root -p zenspa_db < backend/database/seed.sql

## Autor

[Tu nombre completo]
SENA — Análisis y Desarrollo de Software
También verifica que el .gitignore de la raíz incluya: .env, **pycache**/, \*.pyc, node_modules/, .angular/, dist/.
