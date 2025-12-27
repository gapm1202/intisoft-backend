-- Add fueraDeHorario and requisitosPersonalizados to sla_configuracion
ALTER TABLE sla_configuracion
  ADD COLUMN fuera_de_horario BOOLEAN DEFAULT FALSE,
  ADD COLUMN requisitos_personalizados JSONB DEFAULT '[]';
