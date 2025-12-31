-- Migration 055: Agregar campos fuera_de_horario y requisitos_personalizados a sla_configuracion
-- Date: 2024
-- Description: Agrega soporte para configuración de atención fuera de horario
--             y requisitos personalizados de SLA

BEGIN;

-- Agregar columna fuera_de_horario (indica si se atiende fuera de horario)
ALTER TABLE sla_configuracion 
ADD COLUMN IF NOT EXISTS fuera_de_horario BOOLEAN DEFAULT false;

-- Agregar columna requisitos_personalizados (array de requisitos custom)
ALTER TABLE sla_configuracion 
ADD COLUMN IF NOT EXISTS requisitos_personalizados JSONB DEFAULT '[]'::jsonb;

-- Comentarios
COMMENT ON COLUMN sla_configuracion.fuera_de_horario IS 
'Indica si la empresa atiende incidentes fuera del horario laboral';

COMMENT ON COLUMN sla_configuracion.requisitos_personalizados IS 
'Lista de requisitos personalizados adicionales para el SLA en formato JSON';

COMMIT;
