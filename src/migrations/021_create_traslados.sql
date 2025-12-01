-- Migration 021: Create traslados table for tracking asset transfers between locations

CREATE TABLE IF NOT EXISTS traslados (
  id SERIAL PRIMARY KEY,
  activo_id INTEGER NOT NULL REFERENCES inventario(id) ON DELETE CASCADE,
  empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  sede_origen_id INTEGER REFERENCES sedes(id) ON DELETE SET NULL,
  sede_destino_id INTEGER REFERENCES sedes(id) ON DELETE SET NULL,
  area_destino VARCHAR(255),
  fecha_traslado DATE NOT NULL,
  responsable_envia VARCHAR(255) NOT NULL,
  responsable_recibe VARCHAR(255) NOT NULL,
  motivo TEXT NOT NULL,
  estado_equipo VARCHAR(50) NOT NULL,
  especificar_falla TEXT,
  observaciones TEXT,
  fotos JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_traslados_activo_id ON traslados(activo_id);
CREATE INDEX IF NOT EXISTS idx_traslados_empresa_id ON traslados(empresa_id);
CREATE INDEX IF NOT EXISTS idx_traslados_fecha ON traslados(fecha_traslado);
CREATE INDEX IF NOT EXISTS idx_traslados_sede_origen ON traslados(sede_origen_id);
CREATE INDEX IF NOT EXISTS idx_traslados_sede_destino ON traslados(sede_destino_id);
