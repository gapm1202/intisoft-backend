-- Add garantia column to inventario
ALTER TABLE inventario
  ADD COLUMN IF NOT EXISTS garantia VARCHAR(50);

-- Optional: ensure existing rows have NULL/defaults handled by app code
