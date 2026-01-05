-- Migration 064: Crear tabla usuarios_empresas y actualizar inventario

-- 1. Agregar campo usuario_asignado_id a tabla inventario
ALTER TABLE inventario
ADD COLUMN IF NOT EXISTS usuario_asignado_id INTEGER NULL;

-- Crear índice para mejorar performance
CREATE INDEX IF NOT EXISTS idx_inventario_usuario_asignado ON inventario(usuario_asignado_id);

-- 2. Crear tabla usuarios_empresas
CREATE TABLE IF NOT EXISTS usuarios_empresas (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER NOT NULL,
  sede_id INTEGER NOT NULL,
  nombre_completo VARCHAR(255) NOT NULL,
  correo VARCHAR(255) NOT NULL,
  cargo VARCHAR(255),
  telefono VARCHAR(50),
  observaciones TEXT,
  activo_asignado_id INTEGER NULL,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
  FOREIGN KEY (sede_id) REFERENCES sedes(id) ON DELETE CASCADE,
  FOREIGN KEY (activo_asignado_id) REFERENCES inventario(id) ON DELETE SET NULL
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_usuarios_empresas_empresa ON usuarios_empresas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_empresas_sede ON usuarios_empresas(sede_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_empresas_activo_asignado ON usuarios_empresas(activo_asignado_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_empresas_activo ON usuarios_empresas(activo);

-- Crear constraint de unicidad para correo por empresa
CREATE UNIQUE INDEX IF NOT EXISTS unique_correo_empresa ON usuarios_empresas(correo, empresa_id) WHERE activo = TRUE;

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_usuarios_empresas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_usuarios_empresas_updated_at
  BEFORE UPDATE ON usuarios_empresas
  FOR EACH ROW
  EXECUTE FUNCTION update_usuarios_empresas_updated_at();

-- Comentarios de documentación
COMMENT ON TABLE usuarios_empresas IS 'Usuarios finales de empresas clientes (no son usuarios del sistema)';
COMMENT ON COLUMN usuarios_empresas.activo_asignado_id IS 'ID del activo asignado al usuario (nullable)';
COMMENT ON COLUMN inventario.usuario_asignado_id IS 'ID del usuario de empresa al que está asignado el activo (nullable)';
