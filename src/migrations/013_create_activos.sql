-- Drop legacy inventario tables if they exist
DROP TABLE IF EXISTS inventario_fotos CASCADE;
DROP TABLE IF EXISTS inventario_ram CASCADE;
DROP TABLE IF EXISTS inventario_storage CASCADE;
DROP TABLE IF EXISTS inventario CASCADE;
DROP TABLE IF EXISTS activos CASCADE;

-- Create unified activos table for persistent inventory
CREATE TABLE IF NOT EXISTS activos (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  sede_id INTEGER REFERENCES sedes(id) ON DELETE SET NULL,
  area VARCHAR(255),
  categoria VARCHAR(255) NOT NULL,
  asset_id VARCHAR(50) UNIQUE NOT NULL,
  fabricante VARCHAR(255),
  modelo VARCHAR(255),
  serie VARCHAR(255),
  usuario_asignado VARCHAR(255),
  correo_usuario VARCHAR(255),
  cargo_usuario VARCHAR(255),
  estado_activo VARCHAR(100),
  proveedor VARCHAR(255),
  campos_dinamicos JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activos_empresa ON activos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_activos_sede ON activos(sede_id);
CREATE INDEX IF NOT EXISTS idx_activos_asset_id ON activos(asset_id);
-- Table de activos (simplificada para persistencia de inventario)
CREATE TABLE IF NOT EXISTS activos (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  sede_id INTEGER REFERENCES sedes(id) ON DELETE SET NULL,
  area VARCHAR(255),
  categoria VARCHAR(255) NOT NULL,
  asset_id VARCHAR(50) UNIQUE NOT NULL,
  fabricante VARCHAR(255),
  modelo VARCHAR(255),
  serie VARCHAR(255),
  usuario_asignado VARCHAR(255),
  correo_usuario VARCHAR(255),
  cargo_usuario VARCHAR(255),
  estado_activo VARCHAR(100),
  proveedor VARCHAR(255),
  campos_dinamicos JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activos_empresa ON activos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_activos_sede ON activos(sede_id);
CREATE INDEX IF NOT EXISTS idx_activos_asset_id ON activos(asset_id);
