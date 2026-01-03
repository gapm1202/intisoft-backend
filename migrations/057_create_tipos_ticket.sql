-- Crear extensión uuid si no existe
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Crear tabla tipos_ticket
CREATE TABLE tipos_ticket (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(100) NOT NULL UNIQUE,
  descripcion TEXT,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_tipos_ticket_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tipos_ticket_updated_at
BEFORE UPDATE ON tipos_ticket
FOR EACH ROW
EXECUTE FUNCTION update_tipos_ticket_updated_at();

-- Insertar tipos iniciales
INSERT INTO tipos_ticket (nombre, descripcion, activo) VALUES
  ('Incidente', 'Problemas que requieren atención inmediata', true),
  ('Requerimiento', 'Solicitudes de servicio o cambios', true),
  ('Consulta', 'Preguntas o solicitudes de información', true)
ON CONFLICT (nombre) DO NOTHING;
