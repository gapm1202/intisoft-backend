-- Cambiar el tipo de usuario_id de UUID a INTEGER para coincidir con usuarios.id
-- Esto soluciona el error al guardar la 7ma sección del SLA

-- Eliminar la columna UUID existente
ALTER TABLE historial_sla DROP COLUMN IF EXISTS usuario_id;

-- Agregar la columna usuario_id como INTEGER
ALTER TABLE historial_sla ADD COLUMN usuario_id INTEGER;

-- Agregar foreign key a la tabla usuarios
ALTER TABLE historial_sla
  ADD CONSTRAINT fk_historial_sla_usuario 
  FOREIGN KEY (usuario_id) 
  REFERENCES usuarios(id) 
  ON DELETE SET NULL;

-- Crear índice para optimizar búsquedas por usuario
CREATE INDEX IF NOT EXISTS idx_historial_sla_usuario_id 
  ON historial_sla(usuario_id);
