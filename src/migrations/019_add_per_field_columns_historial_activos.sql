-- Migration 019: Add per-field columns to historial_activos to record one row per changed field

ALTER TABLE IF EXISTS historial_activos
  ADD COLUMN IF NOT EXISTS activo_id INTEGER,
  ADD COLUMN IF NOT EXISTS campo_modificado TEXT,
  ADD COLUMN IF NOT EXISTS valor_anterior TEXT,
  ADD COLUMN IF NOT EXISTS valor_nuevo TEXT,
  ADD COLUMN IF NOT EXISTS usuario_id INTEGER,
  ADD COLUMN IF NOT EXISTS fecha_modificacion TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Note: This preserves existing columns (inventario_id, cambios, etc.).
-- Run this migration after ensuring the DB backup if needed.
