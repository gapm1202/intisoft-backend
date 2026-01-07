-- Migration 074: Crear tabla protocolos_correo
-- Descripción: Catálogo de protocolos de correo electrónico
-- Fecha: 6 de enero de 2026

BEGIN;

-- Crear tabla protocolos_correo
CREATE TABLE protocolos_correo (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT NULL,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_protocolos_correo_codigo ON protocolos_correo(codigo);
CREATE INDEX idx_protocolos_correo_activo ON protocolos_correo(activo);

-- Comentarios
COMMENT ON TABLE protocolos_correo IS 'Catálogo de protocolos de correo electrónico (Exchange, IMAP, POP3, etc.)';
COMMENT ON COLUMN protocolos_correo.codigo IS 'Código único autogenerado (ej: PROT-EXCH)';

COMMIT;
