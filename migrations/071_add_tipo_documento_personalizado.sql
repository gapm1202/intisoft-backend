-- Migration 071: Agregar campo tipo_documento_personalizado
-- Descripción: Permite almacenar tipos de documento personalizados cuando tipo_documento = 'Otro'
-- Fecha: 6 de enero de 2026

BEGIN;

-- Agregar columna tipo_documento_personalizado
ALTER TABLE usuarios_empresas 
ADD COLUMN tipo_documento_personalizado VARCHAR(100) NULL;

-- Crear índice para búsquedas
CREATE INDEX idx_usuarios_empresas_tipo_doc_personalizado 
ON usuarios_empresas(tipo_documento_personalizado);

-- Agregar comentario de documentación
COMMENT ON COLUMN usuarios_empresas.tipo_documento_personalizado 
IS 'Tipo de documento personalizado cuando tipo_documento = "Otro". Ejemplos: Cédula Profesional, Licencia de Conducir, Documento Migratorio';

COMMIT;
