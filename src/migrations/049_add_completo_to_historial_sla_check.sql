-- Agregar 'completo' a la restricción CHECK de seccion en historial_sla
-- Esto permite registrar un evento cuando el SLA se completa por primera vez

-- Eliminar la restricción existente
ALTER TABLE historial_sla 
  DROP CONSTRAINT IF EXISTS historial_sla_seccion_check;

-- Recrear la restricción con 'completo' incluido
ALTER TABLE historial_sla 
  ADD CONSTRAINT historial_sla_seccion_check 
  CHECK (
    seccion IN ('alcance', 'incidentes', 'tiempos', 'horarios', 'requisitos', 'exclusiones', 'alertas', 'completo')
  );
