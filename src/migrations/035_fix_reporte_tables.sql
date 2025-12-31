-- Migration: Fix reporte_usuario id column to use SERIAL
-- Description: Convert id from UUID to SERIAL with auto-increment

-- Drop the existing table and recreate with correct schema
DROP TABLE IF EXISTS reporte_adjuntos CASCADE;
DROP TABLE IF EXISTS reporte_usuario CASCADE;

-- Recreate reporte_usuario with SERIAL id
CREATE TABLE reporte_usuario (
  id SERIAL PRIMARY KEY,
  asset_id VARCHAR(50) NOT NULL,
  reporter_user_id INTEGER NULL,
  reporter_name VARCHAR(255) NULL,
  reporter_email VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  operational VARCHAR(10) NULL,
  anydesk VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recreate indexes
CREATE INDEX idx_reporte_usuario_asset_id ON reporte_usuario(asset_id);
CREATE INDEX idx_reporte_usuario_created_at ON reporte_usuario(created_at DESC);

-- Recreate reporte_adjuntos table
CREATE TABLE reporte_adjuntos (
  id SERIAL PRIMARY KEY,
  reporte_id INTEGER NOT NULL REFERENCES reporte_usuario(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on reporte_id
CREATE INDEX idx_reporte_adjuntos_reporte_id ON reporte_adjuntos(reporte_id);

-- Add comments
COMMENT ON TABLE reporte_usuario IS 'Stores public asset reports submitted by users';
COMMENT ON TABLE reporte_adjuntos IS 'Stores file attachments for user reports';
