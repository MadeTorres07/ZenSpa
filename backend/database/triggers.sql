-- ============================================================
-- ZenSpa Bienestar - Triggers de validación
-- Control de solapamiento de citas (terapeuta y cabina)
-- ============================================================

DELIMITER //

-- ----------------------------------------------------------
-- BEFORE INSERT: evita agendar si terapeuta o cabina
-- ya tienen una cita activa en el mismo horario.
-- ----------------------------------------------------------
CREATE TRIGGER check_cita_overlap_insert
BEFORE INSERT ON citas
FOR EACH ROW
BEGIN
    DECLARE terapeuta_conflict INT;
    DECLARE cabina_conflict INT;

    -- Verificar solapamiento del terapeuta
    SELECT COUNT(*) INTO terapeuta_conflict
    FROM citas
    WHERE terapeuta_id = NEW.terapeuta_id
      AND fecha = NEW.fecha
      AND estado NOT IN ('cancelada', 'cancelada_penalidad')
      AND NEW.hora_inicio < hora_fin
      AND NEW.hora_fin > hora_inicio;

    IF terapeuta_conflict > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'El terapeuta ya tiene una cita en ese horario';
    END IF;

    -- Verificar solapamiento de la cabina
    SELECT COUNT(*) INTO cabina_conflict
    FROM citas
    WHERE cabina_id = NEW.cabina_id
      AND fecha = NEW.fecha
      AND estado NOT IN ('cancelada', 'cancelada_penalidad')
      AND NEW.hora_inicio < hora_fin
      AND NEW.hora_fin > hora_inicio;

    IF cabina_conflict > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'La cabina ya está ocupada en ese horario';
    END IF;
END//

-- ----------------------------------------------------------
-- BEFORE UPDATE: mismo control que el insert, pero excluye
-- la propia cita que se está actualizando (WHERE id != NEW.id).
-- ----------------------------------------------------------
CREATE TRIGGER check_cita_overlap_update
BEFORE UPDATE ON citas
FOR EACH ROW
BEGIN
    DECLARE terapeuta_conflict INT;
    DECLARE cabina_conflict INT;

    -- Verificar solapamiento del terapeuta (excluyéndose a sí mismo)
    SELECT COUNT(*) INTO terapeuta_conflict
    FROM citas
    WHERE terapeuta_id = NEW.terapeuta_id
      AND fecha = NEW.fecha
      AND estado NOT IN ('cancelada', 'cancelada_penalidad')
      AND id != NEW.id
      AND NEW.hora_inicio < hora_fin
      AND NEW.hora_fin > hora_inicio;

    IF terapeuta_conflict > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'El terapeuta ya tiene una cita en ese horario';
    END IF;

    -- Verificar solapamiento de la cabina (excluyéndose a sí mismo)
    SELECT COUNT(*) INTO cabina_conflict
    FROM citas
    WHERE cabina_id = NEW.cabina_id
      AND fecha = NEW.fecha
      AND estado NOT IN ('cancelada', 'cancelada_penalidad')
      AND id != NEW.id
      AND NEW.hora_inicio < hora_fin
      AND NEW.hora_fin > hora_inicio;

    IF cabina_conflict > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'La cabina ya está ocupada en ese horario';
    END IF;
END//

DELIMITER ;
