-- Migration 054: add codigo_acceso_remoto column to inventario
BEGIN;

-- Add nullable varchar column for remote access codes (AnyDesk, TeamViewer, etc.)
ALTER TABLE inventario
    ADD COLUMN IF NOT EXISTS codigo_acceso_remoto VARCHAR(255);

COMMIT;
