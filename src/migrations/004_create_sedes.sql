-- Create sedes table linked to empresas
CREATE TABLE IF NOT EXISTS sedes (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nombre VARCHAR(255) NOT NULL,
  direccion TEXT NOT NULL,
  ciudad VARCHAR(100),
  provincia VARCHAR(100),
  telefono VARCHAR(100),
  email VARCHAR(255),
  tipo VARCHAR(50) DEFAULT 'principal',
  responsable VARCHAR(255),
  cargo_responsable VARCHAR(255),
  telefono_responsable VARCHAR(100),
  email_responsable VARCHAR(255),
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Optional index for faster lookup by empresa
CREATE INDEX IF NOT EXISTS idx_sedes_empresa_id ON sedes(empresa_id);
