-- Migration 047: Add tipoAccion column to contract_history
-- Agregar columna para identificar el tipo de acción (ELIMINACION, CREACION, EDICION)

ALTER TABLE contract_history ADD COLUMN IF NOT EXISTS tipo_accion VARCHAR(30);
ALTER TABLE contract_history ADD CONSTRAINT history_tipo_accion_check 
  CHECK (tipo_accion IS NULL OR tipo_accion IN ('ELIMINACION','CREACION','EDICION'));

COMMENT ON COLUMN contract_history.tipo_accion IS 'Tipo de acción: ELIMINACION, CREACION, EDICION (para clasificación en frontend)';
