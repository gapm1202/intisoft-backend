-- Migration 040: Remove unused legacy columns from empresas
-- Columns removed: direccion, razon_social, telefono, email, contacto_nombre, contacto_telefono, contacto_email, contactos_administrativos

ALTER TABLE empresas
  DROP COLUMN IF EXISTS direccion,
  DROP COLUMN IF EXISTS razon_social,
  DROP COLUMN IF EXISTS telefono,
  DROP COLUMN IF EXISTS email,
  DROP COLUMN IF EXISTS contacto_nombre,
  DROP COLUMN IF EXISTS contacto_telefono,
  DROP COLUMN IF EXISTS contacto_email,
  DROP COLUMN IF EXISTS contactos_administrativos;
