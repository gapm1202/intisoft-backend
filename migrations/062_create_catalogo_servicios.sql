-- Migration 062: Crear tablas para catálogo de servicios

-- Tabla tipos_servicio (tabla auxiliar)
CREATE TABLE IF NOT EXISTS tipos_servicio (
  id SERIAL PRIMARY KEY,
  tipo VARCHAR(100) UNIQUE NOT NULL,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insertar tipos predefinidos
INSERT INTO tipos_servicio (tipo, activo) VALUES
  ('Infraestructura', true),
  ('Aplicacion', true),
  ('Comunicaciones', true),
  ('Seguridad', true),
  ('Soporte general', true)
ON CONFLICT (tipo) DO NOTHING;

-- Tabla servicios
CREATE TABLE IF NOT EXISTS servicios (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  tipo_servicio VARCHAR(100) NOT NULL,
  activo BOOLEAN DEFAULT true,
  visible_en_tickets BOOLEAN DEFAULT true,
  creado_por VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Foreign key con tipos_servicio (opcional, permite custom types)
  CONSTRAINT fk_tipo_servicio FOREIGN KEY (tipo_servicio) 
    REFERENCES tipos_servicio(tipo) ON DELETE RESTRICT
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_servicios_codigo ON servicios(codigo);
CREATE INDEX IF NOT EXISTS idx_servicios_activo ON servicios(activo);
CREATE INDEX IF NOT EXISTS idx_servicios_visible_tickets ON servicios(visible_en_tickets);
CREATE INDEX IF NOT EXISTS idx_servicios_tipo ON servicios(tipo_servicio);

-- Trigger para updated_at en tipos_servicio
CREATE OR REPLACE FUNCTION update_tipos_servicio_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_tipos_servicio_updated_at
  BEFORE UPDATE ON tipos_servicio
  FOR EACH ROW
  EXECUTE FUNCTION update_tipos_servicio_updated_at();

-- Trigger para updated_at en servicios
CREATE OR REPLACE FUNCTION update_servicios_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_servicios_updated_at
  BEFORE UPDATE ON servicios
  FOR EACH ROW
  EXECUTE FUNCTION update_servicios_updated_at();

-- Insertar algunos servicios de ejemplo
INSERT INTO servicios (codigo, nombre, descripcion, tipo_servicio, activo, visible_en_tickets, creado_por) VALUES
  ('INFRA-001', 'Mantenimiento de Servidores', 'Mantenimiento preventivo y correctivo de infraestructura de servidores', 'Infraestructura', true, true, 'system'),
  ('APP-001', 'Soporte Aplicaciones ERP', 'Soporte técnico para sistemas ERP', 'Aplicacion', true, true, 'system'),
  ('COM-001', 'Soporte de Red', 'Diagnóstico y resolución de problemas de red', 'Comunicaciones', true, true, 'system'),
  ('SEG-001', 'Gestión de Seguridad', 'Administración de políticas de seguridad y accesos', 'Seguridad', true, true, 'system'),
  ('SOP-001', 'Mesa de Ayuda', 'Atención general de usuarios', 'Soporte general', true, true, 'system')
ON CONFLICT (codigo) DO NOTHING;
