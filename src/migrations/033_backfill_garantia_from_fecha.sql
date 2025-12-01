-- Backfill `garantia` textual column from garantia_fecha_inicio and garantia_fecha_fin
-- Then drop the old fecha columns

BEGIN;

-- Only backfill when garantia is NULL and both dates exist
UPDATE inventario
SET garantia = (
  CASE
    WHEN ((date_part('year', age(garantia_fecha_fin, garantia_fecha_inicio)) * 12) + date_part('month', age(garantia_fecha_fin, garantia_fecha_inicio))) <= 6 THEN '6 meses'
    WHEN ((date_part('year', age(garantia_fecha_fin, garantia_fecha_inicio)) * 12) + date_part('month', age(garantia_fecha_fin, garantia_fecha_inicio))) <= 18 THEN '1 año'
    WHEN ((date_part('year', age(garantia_fecha_fin, garantia_fecha_inicio)) * 12) + date_part('month', age(garantia_fecha_fin, garantia_fecha_inicio))) <= 30 THEN '2 años'
    WHEN ((date_part('year', age(garantia_fecha_fin, garantia_fecha_inicio)) * 12) + date_part('month', age(garantia_fecha_fin, garantia_fecha_inicio))) <= 54 THEN '3 años'
    ELSE (
      -- fallback: round down years
      (floor(((date_part('year', age(garantia_fecha_fin, garantia_fecha_inicio)) * 12) + date_part('month', age(garantia_fecha_fin, garantia_fecha_inicio))) / 12))::int || ' años'
    )
  END
)
WHERE garantia IS NULL
  AND garantia_fecha_inicio IS NOT NULL
  AND garantia_fecha_fin IS NOT NULL;

-- After backfill, drop the old date columns (optional but requested)
ALTER TABLE inventario
  DROP COLUMN IF EXISTS garantia_fecha_inicio,
  DROP COLUMN IF EXISTS garantia_fecha_fin;

COMMIT;
