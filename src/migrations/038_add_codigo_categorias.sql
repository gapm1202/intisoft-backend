-- Migration 038: Add codigo field to categorias for asset code generation
-- Format: <CODIGO_EMPRESA>-<CODIGO_CATEGORIA><NNNN> (e.g., IME-PC0001)

ALTER TABLE categorias
  ADD COLUMN IF NOT EXISTS codigo VARCHAR(5) UNIQUE;

-- Backfill: Generate codes from categoria names (e.g., take first 2 letters of nombre, uppercase)
UPDATE categorias
SET codigo = UPPER(SUBSTRING(nombre, 1, 2))
WHERE codigo IS NULL;

-- Make it NOT NULL after backfill
ALTER TABLE categorias
  ALTER COLUMN codigo SET NOT NULL;
