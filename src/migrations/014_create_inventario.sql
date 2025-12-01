-- Remove unified activos table (we'll recreate inventario table)
DROP TABLE IF EXISTS activos;

-- Create new detailed inventario table
CREATE TABLE IF NOT EXISTS inventario (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  sede_id INTEGER REFERENCES sedes(id) ON DELETE SET NULL,
  empresa_nombre VARCHAR(255),
  sede_nombre VARCHAR(255),
  asset_id VARCHAR(50) UNIQUE NOT NULL,
  categoria VARCHAR(255) NOT NULL,
  area VARCHAR(255),
  fabricante VARCHAR(255),
  modelo VARCHAR(255),
  serie VARCHAR(255),
  estado_activo VARCHAR(100),
  estado_operativo VARCHAR(100),
  fecha_compra DATE,
  fecha_fin_garantia DATE,
  proveedor VARCHAR(255),
  ip VARCHAR(50),
  mac VARCHAR(100),
  usuario_asignado VARCHAR(255),
  correo_usuario VARCHAR(255),
  cargo_usuario VARCHAR(255),
  campos_personalizados JSONB DEFAULT '{}'::jsonb,
  campos_personalizados_array JSONB DEFAULT '[]'::jsonb,
  observaciones TEXT,
  fotos JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventario_empresa ON inventario(empresa_id);
CREATE INDEX IF NOT EXISTS idx_inventario_sede ON inventario(sede_id);
CREATE INDEX IF NOT EXISTS idx_inventario_asset_id ON inventario(asset_id);
