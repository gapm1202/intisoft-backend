-- Migration: Remove correo_usuario and cargo_usuario from inventario
ALTER TABLE inventario
  DROP COLUMN IF EXISTS correo_usuario,
  DROP COLUMN IF EXISTS cargo_usuario;

-- Note: this migration is irreversible in this script (data loss for those columns).
