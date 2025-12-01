-- Migration 034: add condicion_fisica enum column to inventario
BEGIN;

-- Create enum type if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'inventario_condicion_fisica') THEN
        CREATE TYPE inventario_condicion_fisica AS ENUM ('EXCELENTE','BUENO','REGULAR','MALO');
    END IF;
END$$;

-- Add column with default NULL
ALTER TABLE inventario
    ADD COLUMN IF NOT EXISTS condicion_fisica inventario_condicion_fisica;

COMMIT;
