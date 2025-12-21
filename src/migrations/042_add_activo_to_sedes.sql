-- Migration 042: Add soft delete support to sedes table
-- Adds activo field to support deactivation instead of hard deletion
-- Adds motivo field to record why a sede was deactivated

ALTER TABLE sedes
  ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true NOT NULL,
  ADD COLUMN IF NOT EXISTS motivo VARCHAR(500);

-- Index for filtering active sedes
CREATE INDEX IF NOT EXISTS idx_sedes_activo ON sedes(activo, empresa_id);

-- Comments for documentation
COMMENT ON COLUMN sedes.activo IS 'Boolean flag: true = active sede, false = deactivated sede';
COMMENT ON COLUMN sedes.motivo IS 'Reason for deactivation/reactivation of the sede';
