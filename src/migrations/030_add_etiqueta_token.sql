-- 030_add_etiqueta_token.sql
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='inventario' AND column_name='etiqueta_token'
  ) THEN
    ALTER TABLE inventario ADD COLUMN etiqueta_token VARCHAR(128);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE tablename='inventario' AND indexname='idx_inventario_etiqueta_token'
  ) THEN
    CREATE UNIQUE INDEX idx_inventario_etiqueta_token ON inventario(etiqueta_token);
  END IF;
END$$;
