-- Make empresa_id nullable and add campos JSONB for dynamic fields
ALTER TABLE categorias ALTER COLUMN empresa_id DROP NOT NULL;

-- Add campos JSONB column to store dynamic fields (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='categorias' AND column_name='campos'
  ) THEN
    ALTER TABLE categorias ADD COLUMN campos JSONB DEFAULT '[]'::jsonb;
  END IF;
END$$;

-- Ensure unique names for global categories (empresa_id IS NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_categorias_nombre_global ON categorias (nombre) WHERE empresa_id IS NULL;
