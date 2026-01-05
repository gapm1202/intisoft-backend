-- Migration 068: Fix usuarios_historial.realizado_por foreign key issue
-- =================================================================
-- Problema: realizado_por referenciaba usuarios_empresas(id) pero 
--           el JWT contiene el ID de la tabla usuarios (autenticacion)
-- Solucion: Eliminar FK y hacer el campo nullable, usar solo nombre_quien_realizo
-- =================================================================

-- Ya ejecutado manualmente, este archivo documenta el cambio:
-- ALTER TABLE usuarios_historial DROP CONSTRAINT usuarios_historial_realizado_por_fkey;
-- ALTER TABLE usuarios_historial ALTER COLUMN realizado_por DROP NOT NULL;

-- Verificar que los cambios estan aplicados
DO $$
BEGIN
  -- Verificar que realizado_por es nullable
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'usuarios_historial'
    AND column_name = 'realizado_por'
    AND is_nullable = 'YES'
  ) THEN
    RAISE NOTICE 'Columna realizado_por es nullable - OK';
  ELSE
    RAISE EXCEPTION 'Columna realizado_por NO es nullable';
  END IF;

  -- Verificar que no existe la FK a usuarios_empresas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'usuarios_historial'
    AND constraint_name = 'usuarios_historial_realizado_por_fkey'
  ) THEN
    RAISE NOTICE 'Foreign key realizado_por eliminada - OK';
  ELSE
    RAISE EXCEPTION 'Foreign key realizado_por aun existe';
  END IF;

  RAISE NOTICE 'Migration 068 - Cambios verificados correctamente';
END $$;
