-- Migration 018: Add 'motivo' column to historial_activos

ALTER TABLE IF EXISTS historial_activos
  ADD COLUMN IF NOT EXISTS motivo TEXT;

-- Optionally create an index if queries will filter by motivo (not required):
-- CREATE INDEX IF NOT EXISTS idx_historial_activos_motivo ON historial_activos (motivo);
