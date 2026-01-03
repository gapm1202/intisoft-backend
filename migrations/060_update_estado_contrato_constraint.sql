-- Migration 060: Actualizar constraint de estado_contrato en empresas
-- Para que acepte los mismos valores que la tabla contracts ('activo', 'suspendido', 'vencido')

-- Eliminar constraint anterior PRIMERO
ALTER TABLE empresas 
  DROP CONSTRAINT IF EXISTS chk_estado_contrato;

-- Ahora actualizar valores existentes con mayúscula a minúscula
UPDATE empresas 
SET estado_contrato = LOWER(estado_contrato)
WHERE estado_contrato IN ('Activo', 'Suspendido', 'Vencido', 'No renovado', 'No Renovado');

-- Convertir 'no renovado' a 'vencido'
UPDATE empresas 
SET estado_contrato = 'vencido'
WHERE LOWER(estado_contrato) IN ('no renovado', 'no_renovado');

-- Crear nuevo constraint con valores en minúscula
ALTER TABLE empresas 
  ADD CONSTRAINT chk_estado_contrato 
  CHECK (estado_contrato IN ('activo', 'suspendido', 'vencido', 'historico') OR estado_contrato IS NULL);
