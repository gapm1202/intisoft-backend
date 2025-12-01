-- 028_create_uploads_table.sql
-- Tabla para registrar metadatos de ficheros subidos

CREATE TABLE IF NOT EXISTS uploads (
  id SERIAL PRIMARY KEY,
  original_name VARCHAR(255) NOT NULL,
  s3_key TEXT NOT NULL,
  url TEXT NOT NULL,
  mime VARCHAR(100),
  size INTEGER,
  uploader_id INTEGER,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_uploads_uploader_id ON uploads (uploader_id);
