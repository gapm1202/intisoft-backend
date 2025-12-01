-- 030_add_antiguedad_inventario.sql
-- Añade campos de antigüedad al inventario: años, meses y texto legible

ALTER TABLE inventario
  ADD COLUMN IF NOT EXISTS antiguedad_anios INTEGER,
  ADD COLUMN IF NOT EXISTS antiguedad_meses INTEGER,
  ADD COLUMN IF NOT EXISTS antiguedad_text VARCHAR(50);

-- Índices opcionales para consultas por antigüedad (no estrictamente necesarios)
-- CREATE INDEX IF NOT EXISTS idx_inventario_antiguedad_anios ON inventario (antiguedad_anios);
