-- Agrega la columna autoriza_supervision_coordinacion a la tabla sedes
ALTER TABLE sedes ADD COLUMN autoriza_supervision_coordinacion BOOLEAN DEFAULT TRUE;