-- Migration 073: Crear tabla tipos_correo
-- Descripción: Catálogo de tipos de correo electrónico
-- Fecha: 6 de enero de 2026

BEGIN;

-- Crear tabla tipos_correo
CREATE TABLE tipos_correo (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT NULL,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_tipos_correo_codigo ON tipos_correo(codigo);
CREATE INDEX idx_tipos_correo_activo ON tipos_correo(activo);

-- Comentarios
COMMENT ON TABLE tipos_correo IS 'Catálogo de tipos de correo electrónico (Corporativo, Personal, Compartido, etc.)';
COMMENT ON COLUMN tipos_correo.codigo IS 'Código único autogenerado (ej: TP-CORPO)';

COMMIT;
