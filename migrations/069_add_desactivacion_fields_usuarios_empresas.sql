-- Migration 069: Add motivo_desactivacion and fecha_desactivacion to usuarios_empresas
-- =================================================================================
-- Propósito: Agregar campos necesarios para el soft delete de usuarios
-- =================================================================================

-- Agregar columna motivo_desactivacion
ALTER TABLE usuarios_empresas 
ADD COLUMN IF NOT EXISTS motivo_desactivacion TEXT;

-- Agregar columna fecha_desactivacion
ALTER TABLE usuarios_empresas 
ADD COLUMN IF NOT EXISTS fecha_desactivacion TIMESTAMP WITHOUT TIME ZONE;

-- Crear índice para consultas por usuarios activos/inactivos
CREATE INDEX IF NOT EXISTS idx_usuarios_empresas_fecha_desactivacion 
ON usuarios_empresas(fecha_desactivacion);

-- Verificación
DO $$
BEGIN
  -- Verificar que motivo_desactivacion existe
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'usuarios_empresas'
    AND column_name = 'motivo_desactivacion'
  ) THEN
    RAISE NOTICE 'Columna motivo_desactivacion creada - OK';
  ELSE
    RAISE EXCEPTION 'Columna motivo_desactivacion NO fue creada';
  END IF;

  -- Verificar que fecha_desactivacion existe
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'usuarios_empresas'
    AND column_name = 'fecha_desactivacion'
  ) THEN
    RAISE NOTICE 'Columna fecha_desactivacion creada - OK';
  ELSE
    RAISE EXCEPTION 'Columna fecha_desactivacion NO fue creada';
  END IF;

  -- Verificar índice
  IF EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'usuarios_empresas'
    AND indexname = 'idx_usuarios_empresas_fecha_desactivacion'
  ) THEN
    RAISE NOTICE 'Índice idx_usuarios_empresas_fecha_desactivacion creado - OK';
  ELSE
    RAISE EXCEPTION 'Índice NO fue creado';
  END IF;

  RAISE NOTICE 'Migration 069 - Completada exitosamente';
END $$;
