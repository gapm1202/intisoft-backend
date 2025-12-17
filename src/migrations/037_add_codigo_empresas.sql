-- Migration 037: Add codigo field to empresas for asset code generation
-- Format: <CODIGO>-<CAT><NNNN> (e.g., IME-PC0001)

-- 1) Ensure column exists, but WITHOUT uniqueness yet (handle duplicates first)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'empresas' AND column_name = 'codigo'
  ) THEN
    ALTER TABLE empresas ADD COLUMN codigo VARCHAR(10);
  END IF;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Could not add column codigo on empresas: %', SQLERRM;
END$$;

-- If a unique constraint already exists from a previous attempt, drop it to allow backfill
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'empresas_codigo_key'
  ) THEN
    ALTER TABLE empresas DROP CONSTRAINT empresas_codigo_key;
  END IF;
END$$;

-- Backfill: Generate codes from empresa names (e.g., take first 3 letters, uppercase)
-- 2) Backfill with UNIQUE, deterministic codes based on the first 3 letters of nombre.
--    For duplicates (same 3-letter prefix), append a numeric suffix using row_number().
WITH base AS (
  SELECT id,
         UPPER(SUBSTRING(nombre, 1, 3)) AS pref,
         ROW_NUMBER() OVER (PARTITION BY UPPER(SUBSTRING(nombre,1,3)) ORDER BY id) AS rn
  FROM empresas
), resolved AS (
  SELECT id,
         CASE WHEN rn = 1 THEN pref ELSE pref || rn::text END AS codigo
  FROM base
)
UPDATE empresas e
SET codigo = r.codigo
FROM resolved r
WHERE e.id = r.id
  AND e.codigo IS NULL;

-- Make it NOT NULL after backfill
-- 3) Enforce NOT NULL and UNIQUE now that values are backfilled
ALTER TABLE empresas
  ALTER COLUMN codigo SET NOT NULL;

ALTER TABLE empresas
  ADD CONSTRAINT empresas_codigo_key UNIQUE (codigo);
