-- Migration: convert usuario_asignado (text) -> usuarios_asignados (jsonb)
-- 1) add new jsonb column `usuarios_asignados`
-- 2) try to parse/convert existing `usuario_asignado` values into jsonb
-- 3) record any rows that could not be parsed into a helper table for manual review
-- 4) drop old `usuario_asignado` column

BEGIN;

-- 1) add new column with default empty array
ALTER TABLE inventario ADD COLUMN IF NOT EXISTS usuarios_asignados jsonb DEFAULT '[]'::jsonb;

-- 2) create audit table to record problematic rows that cannot be parsed as json
CREATE TABLE IF NOT EXISTS migration_inventario_usuario_asignado_invalid (
  id integer PRIMARY KEY,
  usuario_asignado text,
  migrated_at timestamptz DEFAULT now()
);

-- 3) iterate rows and attempt to convert
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT id, usuario_asignado FROM inventario LOOP
    IF r.usuario_asignado IS NULL OR trim(r.usuario_asignado) = '' THEN
      UPDATE inventario SET usuarios_asignados = '[]'::jsonb WHERE id = r.id;
    ELSE
      BEGIN
        -- try to cast the text to jsonb
        UPDATE inventario SET usuarios_asignados = r.usuario_asignado::jsonb WHERE id = r.id;
      EXCEPTION WHEN others THEN
        -- if casting fails, record the row for manual inspection and preserve the original value as a single-element array
        INSERT INTO migration_inventario_usuario_asignado_invalid (id, usuario_asignado) VALUES (r.id, r.usuario_asignado)
          ON CONFLICT (id) DO UPDATE SET usuario_asignado = EXCLUDED.usuario_asignado, migrated_at = now();
        UPDATE inventario SET usuarios_asignados = jsonb_build_array(r.usuario_asignado) WHERE id = r.id;
      END;
    END IF;
  END LOOP;
END
$$;

-- 4) drop old columna de texto (keep only if migration succeeded)
ALTER TABLE inventario DROP COLUMN IF EXISTS usuario_asignado;

COMMIT;
