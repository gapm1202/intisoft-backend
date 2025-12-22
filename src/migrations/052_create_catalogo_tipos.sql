BEGIN;

-- Tabla para tipos del catálogo (valores únicos para 'tipo_ticket')
CREATE TABLE IF NOT EXISTS catalogo_tipos (
  tipo VARCHAR(120) PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Backfill desde categorías y subcategorías (si existen)
INSERT INTO catalogo_tipos (tipo)
SELECT DISTINCT tipo_ticket FROM catalogo_categorias WHERE tipo_ticket IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO catalogo_tipos (tipo)
SELECT DISTINCT tipo_ticket FROM catalogo_subcategorias WHERE tipo_ticket IS NOT NULL
ON CONFLICT DO NOTHING;

COMMIT;