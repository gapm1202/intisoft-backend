-- Migration: Create reporte_usuario and reporte_adjuntos tables
-- Description: Tables for public asset reports submitted via /public/activos/report

-- Table for storing user reports about assets
CREATE TABLE IF NOT EXISTS reporte_usuario (
  id SERIAL PRIMARY KEY,
  asset_id VARCHAR(50) NOT NULL,
  reporter_user_id INTEGER NULL,  -- FK to users table if applicable, can be NULL
  reporter_name VARCHAR(255) NULL, -- Name if no user selected
  reporter_email VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  operational VARCHAR(10) NULL, -- "Sí" or "No"
  anydesk VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index on asset_id for faster queries
CREATE INDEX IF NOT EXISTS idx_reporte_usuario_asset_id ON reporte_usuario(asset_id);
CREATE INDEX IF NOT EXISTS idx_reporte_usuario_created_at ON reporte_usuario(created_at DESC);

-- Table for storing report attachments (images/videos)
CREATE TABLE IF NOT EXISTS reporte_adjuntos (
  id SERIAL PRIMARY KEY,
  reporte_id INTEGER NOT NULL REFERENCES reporte_usuario(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_type VARCHAR(100) NOT NULL, -- MIME type: image/jpeg, video/mp4, etc
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index on reporte_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_reporte_adjuntos_reporte_id ON reporte_adjuntos(reporte_id);

-- Optional: Add comment for documentation
COMMENT ON TABLE reporte_usuario IS 'Stores public asset reports submitted by users';
COMMENT ON TABLE reporte_adjuntos IS 'Stores file attachments for user reports';
