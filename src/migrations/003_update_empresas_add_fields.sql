-- Add new fields for updated empresa form
-- Safe ALTERs using IF NOT EXISTS for Postgres

ALTER TABLE empresas
  ADD COLUMN IF NOT EXISTS direccion_fiscal TEXT,
  ADD COLUMN IF NOT EXISTS direccion_operativa TEXT,
  ADD COLUMN IF NOT EXISTS pagina_web VARCHAR(255),
  ADD COLUMN IF NOT EXISTS estado_contrato VARCHAR(20) DEFAULT 'Activo',
  ADD COLUMN IF NOT EXISTS contactos_administrativos JSONB,
  ADD COLUMN IF NOT EXISTS contactos_tecnicos JSONB;

-- Optional: create a check constraint for estado_contrato values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'empresas' AND c.conname = 'chk_estado_contrato'
  ) THEN
    ALTER TABLE empresas
      ADD CONSTRAINT chk_estado_contrato CHECK (estado_contrato IN ('Activo','Suspendido','No renovado'));
  END IF;
END$$;
