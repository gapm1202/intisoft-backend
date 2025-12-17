-- Migration 039: Add new fields to empresas and deprecate old contact fields
-- Frontend requirement: soporte para codigo_cliente (auto-generado), contactos_admin, contactos_tecnicos, etc.

-- 1) Create a sequence for codigo_cliente (CLI-001, CLI-002, etc.)
CREATE SEQUENCE IF NOT EXISTS empresas_codigo_cliente_seq START WITH 1 INCREMENT BY 1;

-- 2) Add new columns to empresas
ALTER TABLE empresas
  ADD COLUMN IF NOT EXISTS codigo_cliente VARCHAR(20) UNIQUE,
  ADD COLUMN IF NOT EXISTS observaciones_generales TEXT,
  ADD COLUMN IF NOT EXISTS autorizacion_facturacion BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS contactos_admin JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS contactos_tecnicos JSONB DEFAULT '[]'::jsonb;

-- 3) Migrate data from old fields to new JSONB columns (if they exist)
-- First, check if the old columns exist, then migrate
DO $$
BEGIN
  -- Migrate admin contacts if old columns exist
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'empresas' AND column_name = 'admin_nombre'
  ) THEN
    UPDATE empresas
    SET contactos_admin = jsonb_build_array(
      jsonb_build_object(
        'nombre', COALESCE(admin_nombre, ''),
        'cargo', COALESCE(admin_cargo, ''),
        'telefono', COALESCE(admin_telefono, ''),
        'email', COALESCE(admin_email, '')
      )
    )
    WHERE contactos_admin = '[]'::jsonb 
      AND (admin_nombre IS NOT NULL OR admin_cargo IS NOT NULL OR admin_telefono IS NOT NULL OR admin_email IS NOT NULL);
  END IF;

  -- Migrate tech contacts if old columns exist
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'empresas' AND column_name = 'tec_nombre'
  ) THEN
    UPDATE empresas
    SET contactos_tecnicos = jsonb_build_array(
      jsonb_build_object(
        'nombre', COALESCE(tec_nombre, ''),
        'cargo', COALESCE(tec_cargo, ''),
        'telefono1', COALESCE(tec_telefono1, ''),
        'telefono2', COALESCE(tec_telefono2, ''),
        'email', COALESCE(tec_email, ''),
        'contactoPrincipal', TRUE,
        'horarioDisponible', '',
        'autorizaCambiosCriticos', FALSE,
        'nivelAutorizacion', COALESCE(nivel_autorizacion, '')
      )
    )
    WHERE contactos_tecnicos = '[]'::jsonb 
      AND (tec_nombre IS NOT NULL OR tec_cargo IS NOT NULL OR tec_telefono1 IS NOT NULL OR tec_email IS NOT NULL);
  END IF;
END$$;

-- 4) Backfill codigo_cliente for existing rows (if null)
UPDATE empresas
SET codigo_cliente = 'CLI-' || LPAD(nextval('empresas_codigo_cliente_seq')::text, 3, '0')
WHERE codigo_cliente IS NULL;

-- 5) Make codigo_cliente NOT NULL after backfill
ALTER TABLE empresas
  ALTER COLUMN codigo_cliente SET NOT NULL;

-- 6) Drop old deprecated columns if they exist (careful: only if migration was fully completed)
-- NOTE: This is destructive. Uncomment only after confirming data migration.
-- ALTER TABLE empresas
--   DROP COLUMN IF EXISTS admin_nombre,
--   DROP COLUMN IF EXISTS admin_cargo,
--   DROP COLUMN IF EXISTS admin_telefono,
--   DROP COLUMN IF EXISTS admin_email,
--   DROP COLUMN IF EXISTS observaciones,
--   DROP COLUMN IF EXISTS tec_nombre,
--   DROP COLUMN IF EXISTS tec_cargo,
--   DROP COLUMN IF EXISTS tec_telefono1,
--   DROP COLUMN IF EXISTS tec_telefono2,
--   DROP COLUMN IF EXISTS tec_email,
--   DROP COLUMN IF EXISTS nivel_autorizacion;

-- 7) Create index for codigo_cliente lookups
CREATE INDEX IF NOT EXISTS idx_empresas_codigo_cliente ON empresas(codigo_cliente);
