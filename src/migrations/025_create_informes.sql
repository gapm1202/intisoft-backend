-- 025_create_informes.sql
-- Tabla para almacenar metadatos de informes generados
CREATE TABLE IF NOT EXISTS informes (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER REFERENCES empresas(id),
  asset_id VARCHAR(200) NOT NULL,
  empresa_nombre VARCHAR(200) NOT NULL,
  sede_nombre VARCHAR(200) NOT NULL,
  pdf_url TEXT NOT NULL,
  s3_key TEXT NOT NULL,
  filename VARCHAR(255) NOT NULL,
  metadata JSONB,
  payload JSONB,
  created_by INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_informes_asset_id ON informes (asset_id);
CREATE INDEX IF NOT EXISTS idx_informes_empresa_id ON informes (empresa_id);
