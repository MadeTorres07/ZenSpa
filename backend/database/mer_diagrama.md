# ZenSpa Bienestar — Modelo Entidad-Relación (MER)

```mermaid
erDiagram
    usuarios {
        int id PK
        varchar nombre
        varchar apellido
        varchar email UK
        varchar password_hash
        enum rol
        boolean activo
        datetime created_at
    }

    clientes {
        int id PK
        int usuario_id FK
        varchar telefono
        date fecha_nacimiento
        text historial_salud "DATO SENSIBLE"
        text preferencias
        datetime created_at
    }

    terapeutas {
        int id PK
        int usuario_id FK
        varchar especialidad
        text certificaciones
        boolean activo
    }

    cabinas {
        int id PK
        varchar nombre
        enum tipo_tratamiento
        enum estado
        text equipamiento
    }

    servicios {
        int id PK
        varchar nombre
        int duracion_minutos
        decimal precio
        enum tipo_terapia
    }

    cabina_servicios {
        int cabina_id PK FK
        int servicio_id PK FK
    }

    productos {
        int id PK
        varchar nombre
        int stock
        decimal costo_unitario
        int stock_minimo
    }

    citas {
        int id PK
        int cliente_id FK
        int terapeuta_id FK
        int cabina_id FK
        date fecha
        time hora_inicio
        time hora_fin
        enum estado
        decimal total
        datetime created_at
    }

    cita_servicios {
        int cita_id PK FK
        int servicio_id PK FK
        decimal precio_aplicado
    }

    uso_productos {
        int id PK
        int cita_id FK
        int producto_id FK
        int cantidad
        decimal costo_aplicado
    }

    usuarios ||--o{ clientes : "extiende"
    usuarios ||--o{ terapeutas : "extiende"
    clientes  ||--o{ citas : "agenda"
    terapeutas ||--o{ citas : "atiende"
    cabinas   ||--o{ citas : "asigna"
    cabinas   ||--o{ cabina_servicios : "ofrece"
    servicios ||--o{ cabina_servicios : "incluido en"
    citas     ||--o{ cita_servicios : "contiene"
    servicios ||--o{ cita_servicios : "facturado en"
    citas     ||--o{ uso_productos : "consume"
    productos ||--o{ uso_productos : "usado en"
```
