-- 041_add_sedes_nuevos_campos.sql
-- Add new fields to sedes table as requested by frontend team

ALTER TABLE sedes
  ADD COLUMN IF NOT EXISTS codigo_interno VARCHAR(20) UNIQUE,
  ADD COLUMN IF NOT EXISTS horario_atencion TEXT,
  ADD COLUMN IF NOT EXISTS observaciones TEXT,
  ADD COLUMN IF NOT EXISTS responsables JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS autoriza_ingreso_tecnico BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS autoriza_mantenimiento_fuera_horario BOOLEAN DEFAULT false;

-- Create index on codigo_interno for faster lookups
CREATE INDEX IF NOT EXISTS idx_sedes_codigo_interno ON sedes(codigo_interno);

COMMENT ON COLUMN sedes.codigo_interno IS 'Código interno único de la sede (ej: SED-ATE, SED-LIM). Generado automáticamente en el frontend';
COMMENT ON COLUMN sedes.horario_atencion IS 'Horario de atención de la sede (ej: Lunes a Viernes 8am-6pm)';
COMMENT ON COLUMN sedes.observaciones IS 'Notas adicionales sobre la sede';
COMMENT ON COLUMN sedes.responsables IS 'Array de responsables de la sede con estructura: [{nombre, cargo, telefono, email}]';
COMMENT ON COLUMN sedes.autoriza_ingreso_tecnico IS 'Indica si se autoriza el ingreso de técnicos';
COMMENT ON COLUMN sedes.autoriza_mantenimiento_fuera_horario IS 'Indica si se autoriza mantenimiento fuera del horario de atención';
