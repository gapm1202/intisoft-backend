-- Add responsable column to areas
ALTER TABLE areas
  ADD COLUMN IF NOT EXISTS responsable VARCHAR(255);
