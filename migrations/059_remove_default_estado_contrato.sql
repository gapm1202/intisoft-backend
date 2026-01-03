-- Migration 059: Remover valor por defecto 'Activo' de estado_contrato
-- El estado_contrato debe inicializarse como NULL y calcularse solo al crear contrato

ALTER TABLE empresas 
  ALTER COLUMN estado_contrato DROP DEFAULT;

-- Actualizar registros existentes que tengan 'Activo' sin contrato asociado
UPDATE empresas e
SET estado_contrato = NULL
WHERE estado_contrato = 'Activo'
  AND NOT EXISTS (
    SELECT 1 FROM contracts c 
    WHERE c.empresa_id = e.id
  );
