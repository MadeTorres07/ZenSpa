-- ============================================================
-- ZenSpa Bienestar - Datos de prueba
-- Contraseña común para todos los usuarios de prueba:
--   ZenSpa2024!
-- Hash bcrypt (12 rounds): $2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGniYE6Ie.8a.ZL8mV5iR9yLQGO
-- ADVERTENCIA: En producción cada usuario debe cambiar su contraseña.
-- ============================================================

-- ============================================================
-- USUARIOS (9 en total: 1 admin, 1 recepcionista, 3 terapeutas, 4 clientes)
-- ============================================================
INSERT INTO usuarios (nombre, apellido, email, password_hash, rol, activo)
VALUES
    ('Ana',      'Martínez',  'admin@zenspa.com',           '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGniYE6Ie.8a.ZL8mV5iR9yLQGO', 'admin',         TRUE),
    ('Carlos',   'López',     'recepcion@zenspa.com',        '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGniYE6Ie.8a.ZL8mV5iR9yLQGO', 'recepcionista', TRUE),
    ('Laura',    'García',    'laura.garcia@zenspa.com',     '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGniYE6Ie.8a.ZL8mV5iR9yLQGO', 'terapeuta',     TRUE),
    ('Miguel',   'Sánchez',   'miguel.sanchez@zenspa.com',   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGniYE6Ie.8a.ZL8mV5iR9yLQGO', 'terapeuta',     TRUE),
    ('Elena',    'Rodríguez', 'elena.rodriguez@zenspa.com',  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGniYE6Ie.8a.ZL8mV5iR9yLQGO', 'terapeuta',     TRUE),
    ('Pedro',    'Fernández', 'pedro.fernandez@email.com',   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGniYE6Ie.8a.ZL8mV5iR9yLQGO', 'cliente',       TRUE),
    ('Sofía',    'Ramírez',   'sofia.ramirez@email.com',     '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGniYE6Ie.8a.ZL8mV5iR9yLQGO', 'cliente',       TRUE),
    ('Javier',   'Torres',    'javier.torres@email.com',     '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGniYE6Ie.8a.ZL8mV5iR9yLQGO', 'cliente',       TRUE),
    ('María',    'Vega',      'maria.vega@email.com',        '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGniYE6Ie.8a.ZL8mV5iR9yLQGO', 'cliente',       TRUE);

-- ============================================================
-- CLIENTES (perfiles que extienden a los usuarios con rol 'cliente')
--     usuario 6 = Pedro, usuario 7 = Sofía, usuario 8 = Javier, usuario 9 = María
-- ============================================================
INSERT INTO clientes (usuario_id, telefono, fecha_nacimiento, historial_salud, preferencias)
VALUES
    (6, '555-1001', '1985-03-15', 'Alergia al polen. Lesión lumbar leve (2023).',                                             'Prefiere masajes de intensidad media. Horarios matutinos.'),
    (7, '555-1002', '1992-07-22', 'Piel sensible. No usar productos con fragancias artificiales.',                            'Faciales una vez al mes. Aromaterapia suave.'),
    (8, '555-1003', '1978-11-02', 'Hipertensión controlada. Evitar sesiones de hidroterapia a más de 38°C.',                  'Masajes deportivos los viernes. Sesiones de 90 min.'),
    (9, '555-1004', '1995-09-10', 'Sin condiciones preexistentes.',                                                           'Prefiere tratamientos faciales y aromaterapia.');

-- ============================================================
-- TERAPEUTAS (perfiles que extienden a los usuarios con rol 'terapeuta')
--     usuario 3 = Laura, usuario 4 = Miguel, usuario 5 = Elena
-- ============================================================
INSERT INTO terapeutas (usuario_id, especialidad, certificaciones, activo)
VALUES
    (3, 'masajes',           'Certificación Internacional en Masoterapia (2021). Masaje Deportivo Nivel III.', TRUE),
    (4, 'facial',            'Certificación en Dermocosmética Avanzada. Especialista en Tratamientos Anti-edad.', TRUE),
    (5, 'hidroterapia',      'Técnico en Hidroterapia y Talasoterapia. Certificación en Watsu (2022).', TRUE);

-- ============================================================
-- CABINAS
-- ============================================================
INSERT INTO cabinas (nombre, tipo_tratamiento, estado, equipamiento)
VALUES
    ('Serenidad', 'masajes',       'disponible',  'Camilla térmica, equipo de música ambiental, aromatizador.'),
    ('Armonía',   'facial',        'disponible',  'Lámpara de aumento, vaporizador facial, extractor de comedones, nevera para mascarillas.'),
    ('Aqua',      'hidroterapia',  'disponible',  'Tina de hidromasaje, ducha escocesa, termómetro digital, compresas térmicas.'),
    ('Aroma',     'aromaterapia',  'disponible',  'Difusor ultrasónico, kit de aceites esenciales (10 variedades), sillón reclinable térmico.');

-- ============================================================
-- SERVICIOS
-- ============================================================
INSERT INTO servicios (nombre, duracion_minutos, precio, tipo_terapia)
VALUES
    ('Masaje Relajante',          60,  50.00, 'masajes'),
    ('Masaje Deportivo',          90,  75.00, 'masajes'),
    ('Limpieza Facial Profunda',  45,  40.00, 'facial'),
    ('Hidroterapia Corporal',     60,  60.00, 'hidroterapia'),
    ('Aromaterapia con Masaje',   75,  65.00, 'aromaterapia'),
    ('Tratamiento Anti-edad',     60,  80.00, 'facial');

-- ============================================================
-- CABINA_SERVICIOS (asociación M:N)
-- ============================================================
INSERT INTO cabina_servicios (cabina_id, servicio_id)
VALUES
    -- Serenidad (masajes)
    (1, 1),  -- Masaje Relajante
    (1, 2),  -- Masaje Deportivo
    -- Armonía (facial)
    (2, 3),  -- Limpieza Facial Profunda
    (2, 6),  -- Tratamiento Anti-edad
    -- Aqua (hidroterapia)
    (3, 4),  -- Hidroterapia Corporal
    -- Aroma (aromaterapia)
    (4, 5);  -- Aromaterapia con Masaje

-- ============================================================
-- PRODUCTOS (algunos por debajo de stock_minimo para probar alertas)
-- ============================================================
INSERT INTO productos (nombre, stock, costo_unitario, stock_minimo)
VALUES
    ('Aceite Esencial Lavanda',          20,   8.50,  5),
    ('Crema Hidratante Facial',           3,  15.00,  5),   -- STOCK BAJO
    ('Exfoliante Corporal',              12,  10.00,  5),
    ('Mascarilla de Arcilla',             2,   6.00,  5),   -- STOCK BAJO
    ('Aceite de Masaje Neutro',          25,   7.00,  5),
    ('Vela Aromática Terapéutica',        8,   4.50,  5);

-- ============================================================
-- CITAS (8 en diferentes estados, sin solapamientos)
-- ============================================================
INSERT INTO citas (cliente_id, terapeuta_id, cabina_id, fecha, hora_inicio, hora_fin, estado, total)
VALUES
    -- Cita 1: completada - Pedro / Laura / Serenidad / Masaje Relajante
    (1, 1, 1, '2026-05-20', '09:00:00', '10:00:00', 'completada',       50.00),
    -- Cita 2: confirmada - Sofía / Miguel / Armonía / Limpieza Facial + Anti-edad
    (2, 2, 2, '2026-05-25', '14:00:00', '15:45:00', 'confirmada',      120.00),
    -- Cita 3: pendiente - Javier / Elena / Aqua / Hidroterapia Corporal
    (3, 3, 3, '2026-05-23', '10:00:00', '11:00:00', 'pendiente',        60.00),
    -- Cita 4: cancelada - Pedro / Laura / Serenidad / Masaje Relajante
    (1, 1, 1, '2026-05-18', '16:00:00', '17:00:00', 'cancelada',        50.00),
    -- Cita 5: completada - Pedro / Miguel / Armonía / Limpieza Facial Profunda
    (1, 2, 2, '2026-05-21', '11:00:00', '11:45:00', 'completada',       40.00),
    -- Cita 6: confirmada - Javier / Laura / Serenidad / Masaje Deportivo
    (3, 1, 1, '2026-05-26', '09:00:00', '10:30:00', 'confirmada',       75.00),
    -- Cita 7: cancelada con penalidad - Sofía / Elena / Aqua / Hidroterapia Corporal
    (2, 3, 3, '2026-05-22', '08:00:00', '09:00:00', 'cancelada_penalidad', 60.00),
    -- Cita 8: completada - Javier / Miguel / Armonía / Tratamiento Anti-edad
    (3, 2, 2, '2026-05-19', '15:00:00', '16:00:00', 'completada',       80.00);

-- ============================================================
-- CITA_SERVICIOS (detalle de servicios por cita)
-- ============================================================
INSERT INTO cita_servicios (cita_id, servicio_id, precio_aplicado)
VALUES
    -- Cita 1: Masaje Relajante
    (1, 1, 50.00),
    -- Cita 2: Limpieza Facial Profunda + Tratamiento Anti-edad
    (2, 3, 40.00),
    (2, 6, 80.00),
    -- Cita 3: Hidroterapia Corporal
    (3, 4, 60.00),
    -- Cita 4: Masaje Relajante
    (4, 1, 50.00),
    -- Cita 5: Limpieza Facial Profunda
    (5, 3, 40.00),
    -- Cita 6: Masaje Deportivo
    (6, 2, 75.00),
    -- Cita 7: Hidroterapia Corporal
    (7, 4, 60.00),
    -- Cita 8: Tratamiento Anti-edad
    (8, 6, 80.00);

-- ============================================================
-- USO_PRODUCTOS (registro de productos consumidos en citas completadas)
-- ============================================================
INSERT INTO uso_productos (cita_id, producto_id, cantidad, costo_aplicado)
VALUES
    -- Cita 1: Masaje Relajante consumió aceites
    (1, 1, 2, 8.50),    -- Aceite Esencial Lavanda (2 unidades)
    (1, 5, 1, 7.00),    -- Aceite de Masaje Neutro (1 unidad)
    -- Cita 5: Limpieza Facial Profunda consumió crema y mascarilla
    (5, 2, 1, 15.00),   -- Crema Hidratante Facial (1 unidad)
    (5, 4, 1, 6.00),    -- Mascarilla de Arcilla (1 unidad)
    -- Cita 8: Tratamiento Anti-edad consumió crema y mascarilla
    (8, 2, 1, 15.00),   -- Crema Hidratante Facial (1 unidad)
    (8, 4, 2, 6.00);    -- Mascarilla de Arcilla (2 unidades)
