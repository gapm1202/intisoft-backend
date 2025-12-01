-- Add soft-delete columns to sedes table
ALTER TABLE sedes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE sedes ADD COLUMN IF NOT EXISTS motivo_eliminacion TEXT;

-- Optional: Create index for soft-delete queries
CREATE INDEX IF NOT EXISTS idx_sedes_deleted_at ON sedes(deleted_at);
