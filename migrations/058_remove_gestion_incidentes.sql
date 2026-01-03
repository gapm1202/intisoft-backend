-- Eliminar columna gestion_incidentes de sla_configuracion
ALTER TABLE sla_configuracion DROP COLUMN IF EXISTS gestion_incidentes;
