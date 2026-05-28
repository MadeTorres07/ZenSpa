-- ============================================================
-- ZenSpa Bienestar - Esquema de Base de Datos
-- MySQL 8 / 3NF
-- ============================================================

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

ALTER DATABASE zenspa_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ============================================================
-- 1. USUARIOS (identidad única del sistema)
--    clientes y terapeutas son perfiles de extensión.
-- ============================================================
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol ENUM('admin', 'recepcionista', 'terapeuta', 'cliente') NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- 2. CLIENTES (perfil de extensión sobre usuarios)
-- ============================================================
CREATE TABLE clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNIQUE NOT NULL,
    telefono VARCHAR(20),
    fecha_nacimiento DATE,
    historial_salud TEXT,  -- DATO SENSIBLE: acceso restringido por rol
    preferencias TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_clientes_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ============================================================
-- 3. TERAPEUTAS (perfil de extensión sobre usuarios)
-- ============================================================
CREATE TABLE terapeutas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNIQUE NOT NULL,
    especialidad VARCHAR(100) NOT NULL,
    certificaciones TEXT,
    activo BOOLEAN DEFAULT TRUE,
    CONSTRAINT fk_terapeutas_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ============================================================
-- 4. CABINAS
-- ============================================================
CREATE TABLE cabinas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    tipo_tratamiento ENUM('masajes', 'facial', 'hidroterapia', 'aromaterapia', 'multiple') NOT NULL,
    estado ENUM('disponible', 'ocupada', 'mantenimiento') DEFAULT 'disponible',
    equipamiento TEXT
) ENGINE=InnoDB;

-- ============================================================
-- 5. SERVICIOS
-- ============================================================
CREATE TABLE servicios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    duracion_minutos INT NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    tipo_terapia ENUM('masajes', 'facial', 'hidroterapia', 'aromaterapia', 'multiple') NOT NULL
) ENGINE=InnoDB;

-- ============================================================
-- 6. CABINA_SERVICIOS (M:N entre cabinas y servicios)
-- ============================================================
CREATE TABLE cabina_servicios (
    cabina_id INT NOT NULL,
    servicio_id INT NOT NULL,
    PRIMARY KEY (cabina_id, servicio_id),
    CONSTRAINT fk_cabina_servicios_cabina
        FOREIGN KEY (cabina_id) REFERENCES cabinas(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_cabina_servicios_servicio
        FOREIGN KEY (servicio_id) REFERENCES servicios(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 7. PRODUCTOS
-- ============================================================
CREATE TABLE productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    stock INT DEFAULT 0,
    costo_unitario DECIMAL(10,2) NOT NULL,
    stock_minimo INT DEFAULT 5
) ENGINE=InnoDB;

-- ============================================================
-- 8. CITAS
-- ============================================================
CREATE TABLE citas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    terapeuta_id INT NOT NULL,
    cabina_id INT NOT NULL,
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    estado ENUM('pendiente', 'confirmada', 'completada', 'cancelada', 'cancelada_penalidad') DEFAULT 'pendiente',
    total DECIMAL(10,2) DEFAULT 0.00,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_citas_cliente
        FOREIGN KEY (cliente_id) REFERENCES clientes(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_citas_terapeuta
        FOREIGN KEY (terapeuta_id) REFERENCES terapeutas(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_citas_cabina
        FOREIGN KEY (cabina_id) REFERENCES cabinas(id)
        ON DELETE RESTRICT,
    CONSTRAINT chk_horas CHECK (hora_fin > hora_inicio),
    INDEX idx_citas_fecha_hora (fecha, hora_inicio),
    INDEX idx_citas_terapeuta (terapeuta_id),
    INDEX idx_citas_cabina (cabina_id)
) ENGINE=InnoDB;

-- ============================================================
-- 9. CITA_SERVICIOS (M:N con snapshot de precio histórico)
-- ============================================================
CREATE TABLE cita_servicios (
    cita_id INT NOT NULL,
    servicio_id INT NOT NULL,
    precio_aplicado DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (cita_id, servicio_id),
    CONSTRAINT fk_cita_servicios_cita
        FOREIGN KEY (cita_id) REFERENCES citas(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_cita_servicios_servicio
        FOREIGN KEY (servicio_id) REFERENCES servicios(id)
        ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ============================================================
-- 10. USO_PRODUCTOS
-- ============================================================
CREATE TABLE uso_productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cita_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL,
    costo_aplicado DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_uso_productos_cita
        FOREIGN KEY (cita_id) REFERENCES citas(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_uso_productos_producto
        FOREIGN KEY (producto_id) REFERENCES productos(id)
        ON DELETE RESTRICT
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;
