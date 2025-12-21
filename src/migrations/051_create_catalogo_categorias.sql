BEGIN;

-- Catálogo de categorías para tickets y otros módulos
CREATE TABLE IF NOT EXISTS catalogo_categorias (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(60) NOT NULL UNIQUE,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  tipo_ticket VARCHAR(120),
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  visible_en_tickets BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Subcategorías asociadas a categorías del catálogo
CREATE TABLE IF NOT EXISTS catalogo_subcategorias (
  id SERIAL PRIMARY KEY,
  categoria_id INTEGER NOT NULL REFERENCES catalogo_categorias(id) ON DELETE CASCADE,
  codigo VARCHAR(80) NOT NULL UNIQUE,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  tipo_ticket VARCHAR(120),
  hereda_tipo BOOLEAN NOT NULL DEFAULT TRUE,
  requiere_validacion BOOLEAN NOT NULL DEFAULT FALSE,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_catalogo_categorias_activo_visible
  ON catalogo_categorias(activo, visible_en_tickets);

CREATE INDEX IF NOT EXISTS idx_catalogo_subcategorias_categoria_id
  ON catalogo_subcategorias(categoria_id);

CREATE INDEX IF NOT EXISTS idx_catalogo_subcategorias_activo
  ON catalogo_subcategorias(activo);

COMMIT;
