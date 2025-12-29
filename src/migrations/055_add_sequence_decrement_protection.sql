-- Migración 055: Agregar protección contra decremento de next_number
-- Previene que alguien accidentalmente decremente las secuencias de códigos

BEGIN;

-- Agregar constraint CHECK para prevenir que next_number sea menor a 1
ALTER TABLE activos_codigo_sequence 
  DROP CONSTRAINT IF EXISTS activos_codigo_sequence_next_number_positive;

ALTER TABLE activos_codigo_sequence 
  ADD CONSTRAINT activos_codigo_sequence_next_number_positive 
  CHECK (next_number >= 1);

-- Crear función de trigger para prevenir decrementos
CREATE OR REPLACE FUNCTION prevent_sequence_decrement()
RETURNS TRIGGER AS $$
BEGIN
  -- Si se intenta decrementar next_number, rechazar la operación
  IF NEW.next_number < OLD.next_number THEN
    RAISE EXCEPTION 
      'No se permite decrementar next_number. OLD: %, NEW: %. '
      'Los códigos de activos no deben reutilizarse después de eliminaciones.',
      OLD.next_number, NEW.next_number
      USING ERRCODE = '23514', -- check_violation
            HINT = 'Use el sistema de secuencias correctamente. next_number solo puede incrementarse.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para ejecutar la validación
DROP TRIGGER IF EXISTS trg_prevent_sequence_decrement ON activos_codigo_sequence;

CREATE TRIGGER trg_prevent_sequence_decrement
  BEFORE UPDATE ON activos_codigo_sequence
  FOR EACH ROW
  EXECUTE FUNCTION prevent_sequence_decrement();

-- Agregar comentarios para documentación
COMMENT ON CONSTRAINT activos_codigo_sequence_next_number_positive 
  ON activos_codigo_sequence IS 
  'Previene que next_number sea menor a 1. Los códigos de activos nunca deben reutilizarse.';

COMMENT ON FUNCTION prevent_sequence_decrement() IS 
  'Previene que next_number sea decrementado. Garantiza que los códigos de activos eliminados no se reutilicen.';

COMMENT ON TRIGGER trg_prevent_sequence_decrement 
  ON activos_codigo_sequence IS 
  'Ejecuta validación para prevenir decrementos de next_number que causarían reutilización de códigos.';

COMMIT;
