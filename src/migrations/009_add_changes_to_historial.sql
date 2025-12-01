-- Add JSONB column 'changes' to historial to store fields changed
ALTER TABLE historial
  ADD COLUMN IF NOT EXISTS changes JSONB;

-- Optional index to speed queries filtering by keys inside changes (not strictly necessary)
CREATE INDEX IF NOT EXISTS idx_historial_changes ON historial USING gin (changes);
