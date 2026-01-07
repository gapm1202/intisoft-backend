-- Migration 070: Agregar campos de documento y área a usuarios_empresas
-- Fecha: 2026-01-06
-- Autor: Sistema

BEGIN;

-- 1. Agregar campo codigo_usuario (autogenerado)
ALTER TABLE usuarios_empresas 
ADD COLUMN IF NOT EXISTS codigo_usuario VARCHAR(50);

-- 2. Agregar campo tipo_documento (DNI, CE, Pasaporte, etc.)
ALTER TABLE usuarios_empresas 
ADD COLUMN IF NOT EXISTS tipo_documento VARCHAR(50);

-- 3. Agregar campo numero_documento
ALTER TABLE usuarios_empresas 
ADD COLUMN IF NOT EXISTS numero_documento VARCHAR(20);

-- 4. Agregar campo area_id (FK a tabla areas)
ALTER TABLE usuarios_empresas 
ADD COLUMN IF NOT EXISTS area_id INTEGER;

-- 5. Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_usuarios_empresas_codigo_usuario 
ON usuarios_empresas(codigo_usuario);

CREATE INDEX IF NOT EXISTS idx_usuarios_empresas_numero_documento 
ON usuarios_empresas(numero_documento);

CREATE INDEX IF NOT EXISTS idx_usuarios_empresas_area_id 
ON usuarios_empresas(area_id);

-- 6. Agregar constraint único para codigo_usuario por empresa
CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_empresas_codigo_unico 
ON usuarios_empresas(empresa_id, codigo_usuario) 
WHERE codigo_usuario IS NOT NULL;

-- 7. Agregar Foreign Key a tabla areas
ALTER TABLE usuarios_empresas 
ADD CONSTRAINT fk_usuarios_empresas_area 
FOREIGN KEY (area_id) REFERENCES areas(id) 
ON DELETE SET NULL;

-- 8. Agregar comentarios para documentación
COMMENT ON COLUMN usuarios_empresas.codigo_usuario IS 
'Código autogenerado del usuario, formato: {EMPRESA_PREFIX}-USR-{CONTADOR}. Ejemplo: HUA-USR-0001';

COMMENT ON COLUMN usuarios_empresas.tipo_documento IS 
'Tipo de documento de identidad. Valores comunes: DNI, CE, Pasaporte';

COMMENT ON COLUMN usuarios_empresas.numero_documento IS 
'Número del documento de identidad del usuario';

COMMENT ON COLUMN usuarios_empresas.area_id IS 
'Referencia al área/departamento al que pertenece el usuario';

COMMIT;

-- Verificación
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'usuarios_empresas' 
  AND column_name IN ('codigo_usuario', 'tipo_documento', 'numero_documento', 'area_id')
ORDER BY ordinal_position;
