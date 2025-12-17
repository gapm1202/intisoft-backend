-- Migration 043: Expand allowed values for historial.accion
-- Allows new actions for sede toggle and empresa edits
ALTER TABLE historial DROP CONSTRAINT IF EXISTS historial_accion_check;
ALTER TABLE historial
  ADD CONSTRAINT historial_accion_check
  CHECK (
    accion IN (
      'EDITAR_EMPRESA',
      'EDITAR_SEDE',
      'ELIMINAR_SEDE',
      'DESACTIVAR_SEDE',
      'REACTIVAR_SEDE',
      'desactivar_sede',
      'activar_sede',
      'editar_empresa'
    )
  );
