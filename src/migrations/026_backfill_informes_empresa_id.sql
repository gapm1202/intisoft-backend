-- 026_backfill_informes_empresa_id.sql
-- Empareja informes.empresa_nombre con empresas.nombre y rellena informes.empresa_id cuando esté vacío
BEGIN;

-- Actualiza empresa_id para informes cuyo nombre coincide exactamente con empresas.nombre (case-insensitive)
WITH matched AS (
  SELECT i.id as informe_id, e.id as empresa_id
  FROM informes i
  JOIN empresas e ON lower(trim(i.empresa_nombre)) = lower(trim(e.nombre))
  WHERE i.empresa_id IS NULL
)
UPDATE informes
SET empresa_id = m.empresa_id
FROM matched m
WHERE informes.id = m.informe_id;

-- Opcional: devolver un resumen
SELECT count(*) as updated_count FROM informes WHERE empresa_id IS NOT NULL;

COMMIT;
