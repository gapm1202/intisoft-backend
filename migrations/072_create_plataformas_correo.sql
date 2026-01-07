-- Migration 072: Crear tabla plataformas_correo
-- Descripción: Catálogo de plataformas de correo electrónico
-- Fecha: 6 de enero de 2026

BEGIN;

-- Crear tabla plataformas_correo
CREATE TABLE plataformas_correo (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  tipo_plataforma VARCHAR(50) NOT NULL,
  tipo_plataforma_personalizado VARCHAR(100) NULL,
  permite_reasignar BOOLEAN DEFAULT true,
  permite_conservar BOOLEAN DEFAULT true,
  observaciones TEXT NULL,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_plataformas_correo_codigo ON plataformas_correo(codigo);
CREATE INDEX idx_plataformas_correo_activo ON plataformas_correo(activo);
CREATE INDEX idx_plataformas_correo_tipo ON plataformas_correo(tipo_plataforma);

-- Comentarios
COMMENT ON TABLE plataformas_correo IS 'Catálogo de plataformas de correo electrónico (Microsoft 365, Google Workspace, etc.)';
COMMENT ON COLUMN plataformas_correo.codigo IS 'Código único autogenerado (ej: PLAT-MICRO)';
COMMENT ON COLUMN plataformas_correo.tipo_plataforma IS 'Cloud, On-Premise, u Otro';
COMMENT ON COLUMN plataformas_correo.tipo_plataforma_personalizado IS 'Tipo personalizado cuando tipo_plataforma = "Otro"';
COMMENT ON COLUMN plataformas_correo.permite_reasignar IS 'Indica si la plataforma permite reasignar correos a otros usuarios';
COMMENT ON COLUMN plataformas_correo.permite_conservar IS 'Indica si la plataforma permite conservar correos de usuarios desactivados';

COMMIT;
