-- 035_create_reporte_tables.sql
-- Create tables for public reports and attachments

-- Table: reporte_usuario
CREATE TABLE IF NOT EXISTS reporte_usuario (
  id UUID PRIMARY KEY,
  asset_id TEXT NULL,
  etiqueta_token TEXT NULL,
  reporter_user_id BIGINT NULL,
  reporter_name TEXT NULL,
  reporter_email TEXT NOT NULL,
  description TEXT NULL,
  operational TEXT NULL,
  anydesk VARCHAR(64) NULL,
  ip_address VARCHAR(128) NULL,
  user_agent TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast lookup and filtering
CREATE INDEX IF NOT EXISTS idx_reporte_usuario_asset_id ON reporte_usuario(asset_id);
CREATE INDEX IF NOT EXISTS idx_reporte_usuario_etiqueta_token ON reporte_usuario(etiqueta_token);
CREATE INDEX IF NOT EXISTS idx_reporte_usuario_reporter_email ON reporte_usuario(reporter_email);

-- Table: reporte_adjuntos
CREATE TABLE IF NOT EXISTS reporte_adjuntos (
  id UUID PRIMARY KEY,
  reporte_id UUID NOT NULL,
  filename TEXT NOT NULL,
  mime_type TEXT NULL,
  size_bytes BIGINT NULL,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_reporte_adjuntos_reporte FOREIGN KEY (reporte_id) REFERENCES reporte_usuario (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_reporte_adjuntos_reporte_id ON reporte_adjuntos(reporte_id);

-- Optional: ensure operational uses expected values (simple check)
DO $$
BEGIN
  -- add a check constraint only if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid WHERE t.relname = 'reporte_usuario' AND c.conname = 'chk_reporte_usuario_operational'
  ) THEN
    ALTER TABLE reporte_usuario
      ADD CONSTRAINT chk_reporte_usuario_operational CHECK (operational IS NULL OR operational IN ('Sí','No','A veces'));
  END IF;
END$$;

-- Note: UUID values are expected to be provided by the application (e.g., crypto.randomUUID()).
-- If you prefer generating UUIDs in DB, enable an extension such as "pgcrypto" or "uuid-ossp" and set DEFAULT gen_random_uuid().

COMMENT ON TABLE reporte_usuario IS 'Registro de reportes públicos recibidos via /public/activos/report';
COMMENT ON TABLE reporte_adjuntos IS 'Metadatos de adjuntos subidos asociados a reporte_usuario';
