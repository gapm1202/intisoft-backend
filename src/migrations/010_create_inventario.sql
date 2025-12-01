-- Crear tabla categorias
CREATE TABLE IF NOT EXISTS categorias (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nombre VARCHAR(100) NOT NULL,
  subcategorias TEXT[] DEFAULT '{}',
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(empresa_id, nombre)
);

-- Crear tabla areas
CREATE TABLE IF NOT EXISTS areas (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  sede_id INTEGER REFERENCES sedes(id) ON DELETE CASCADE,
  nombre VARCHAR(100) NOT NULL,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(empresa_id, nombre)
);

-- Crear tabla inventario (activos)
CREATE TABLE IF NOT EXISTS inventario (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  sede_id INTEGER REFERENCES sedes(id) ON DELETE CASCADE,
  categoria_id INTEGER REFERENCES categorias(id) ON DELETE SET NULL,
  area_id INTEGER REFERENCES areas(id) ON DELETE SET NULL,
  asset_id VARCHAR(100) UNIQUE NOT NULL,
  fabricante VARCHAR(100),
  modelo VARCHAR(100),
  serie VARCHAR(100),
  estado_activo VARCHAR(50) CHECK (estado_activo IN ('Activo', 'Inactivo', 'Mantenimiento', 'Descartado')),
  estado_operativo VARCHAR(50) CHECK (estado_operativo IN ('Operativo', 'No Operativo', 'Reparación')),
  fecha_compra DATE,
  proveedor VARCHAR(100),
  ip VARCHAR(15),
  mac VARCHAR(17),
  usuario_asignado VARCHAR(100),
  observaciones TEXT,
  especificacion JSONB,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla inventario_ram
CREATE TABLE IF NOT EXISTS inventario_ram (
  id SERIAL PRIMARY KEY,
  inventario_id INTEGER NOT NULL REFERENCES inventario(id) ON DELETE CASCADE,
  tipo VARCHAR(50),
  capacidad VARCHAR(50)
);

-- Crear tabla inventario_storage
CREATE TABLE IF NOT EXISTS inventario_storage (
  id SERIAL PRIMARY KEY,
  inventario_id INTEGER NOT NULL REFERENCES inventario(id) ON DELETE CASCADE,
  tipo VARCHAR(50),
  capacidad VARCHAR(50)
);

-- Crear tabla inventario_fotos
CREATE TABLE IF NOT EXISTS inventario_fotos (
  id SERIAL PRIMARY KEY,
  inventario_id INTEGER NOT NULL REFERENCES inventario(id) ON DELETE CASCADE,
  url VARCHAR(500),
  descripcion TEXT,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_inventario_empresa ON inventario(empresa_id);
CREATE INDEX IF NOT EXISTS idx_inventario_sede ON inventario(sede_id);
CREATE INDEX IF NOT EXISTS idx_inventario_asset_id ON inventario(asset_id);
CREATE INDEX IF NOT EXISTS idx_areas_empresa ON areas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_categorias_empresa ON categorias(empresa_id);
