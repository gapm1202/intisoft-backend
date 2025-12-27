-- Migration: Permitir 'RENOVACION' en contract_history.tipo_accion
ALTER TABLE contract_history DROP CONSTRAINT IF EXISTS history_tipo_accion_check;
ALTER TABLE contract_history ADD CONSTRAINT history_tipo_accion_check 
  CHECK (tipo_accion IS NULL OR tipo_accion IN ('ELIMINACION','CREACION','EDICION','RENOVACION'));
