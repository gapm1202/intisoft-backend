-- Migration: create inventario_fotos table
CREATE TABLE IF NOT EXISTS inventario_fotos (
  id serial PRIMARY KEY,
  inventario_id integer NOT NULL REFERENCES inventario(id) ON DELETE CASCADE,
  url text NOT NULL,
  descripcion text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventario_fotos_inventario_id ON inventario_fotos (inventario_id);
