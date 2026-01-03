-- Migration 061: Eliminar columna estado_contrato de tabla empresas
-- El estado del contrato pertenece a la tabla contracts, no a empresas
-- Una empresa puede tener múltiples contratos a lo largo del tiempo

-- Eliminar constraint relacionado primero
ALTER TABLE empresas 
  DROP CONSTRAINT IF EXISTS chk_estado_contrato;

-- Eliminar la columna
ALTER TABLE empresas 
  DROP COLUMN IF EXISTS estado_contrato;
