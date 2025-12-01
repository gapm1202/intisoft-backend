CREATE TABLE IF NOT EXISTS historial_activos (
  id SERIAL PRIMARY KEY,
  inventario_id INTEGER,
  empresa_id INTEGER,
  sede_id INTEGER,
  asset_id TEXT,
  cambios JSONB DEFAULT '[]'::jsonb,
  usuario_id INTEGER,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_historial_activos_inventario_id ON historial_activos(inventario_id);
CREATE INDEX IF NOT EXISTS idx_historial_activos_empresa_id ON historial_activos(empresa_id);