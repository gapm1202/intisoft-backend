-- Migration: Agregar columna servicios_personalizados a contracts
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS servicios_personalizados JSONB DEFAULT '[]'::jsonb;