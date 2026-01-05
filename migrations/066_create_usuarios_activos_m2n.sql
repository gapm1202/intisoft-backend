-- ============================================
-- MIGRACIÓN 066: RELACIÓN M:N USUARIOS ↔ ACTIVOS
-- ============================================

-- 1️⃣ Crear tabla de unión para relación muchos-a-muchos
CREATE TABLE IF NOT EXISTS usuarios_activos (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios_empresas(id) ON DELETE CASCADE,
  activo_id INTEGER NOT NULL REFERENCES inventario(id) ON DELETE CASCADE,
  fecha_asignacion TIMESTAMP DEFAULT NOW(),
  asignado_por VARCHAR(255),
  motivo TEXT,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(usuario_id, activo_id, activo) -- Evitar duplicados activos
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_usuarios_activos_usuario ON usuarios_activos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_activos_activo ON usuarios_activos(activo_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_activos_activo_flag ON usuarios_activos(activo) WHERE activo = true;

-- 2️⃣ Migrar datos existentes de usuarios_empresas.activo_asignado_id
-- Solo migrar si AMBOS (usuario y activo) existen
INSERT INTO usuarios_activos (usuario_id, activo_id, fecha_asignacion, motivo, activo)
SELECT 
  ue.id AS usuario_id,
  ue.activo_asignado_id AS activo_id,
  ue.created_at AS fecha_asignacion,
  'Migración automática de relación 1:1 desde usuarios_empresas' AS motivo,
  TRUE AS activo
FROM usuarios_empresas ue
WHERE ue.activo_asignado_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM inventario WHERE id = ue.activo_asignado_id)
ON CONFLICT (usuario_id, activo_id, activo) DO NOTHING;

-- 3️⃣ Migrar datos existentes de inventario.usuario_asignado_id
-- Solo migrar si AMBOS (usuario y activo) existen
INSERT INTO usuarios_activos (usuario_id, activo_id, fecha_asignacion, motivo, activo)
SELECT 
  i.usuario_asignado_id AS usuario_id,
  i.id AS activo_id,
  i.created_at AS fecha_asignacion,
  'Migración automática de relación 1:1 desde inventario' AS motivo,
  TRUE AS activo
FROM inventario i
WHERE i.usuario_asignado_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM usuarios_empresas WHERE id = i.usuario_asignado_id)
ON CONFLICT (usuario_id, activo_id, activo) DO NOTHING;

-- 4️⃣ Marcar columnas antiguas como deprecated (NO ELIMINAR aún para compatibilidad)
COMMENT ON COLUMN usuarios_empresas.activo_asignado_id IS 'DEPRECATED - Usar tabla usuarios_activos para relación M:N';
COMMENT ON COLUMN inventario.usuario_asignado_id IS 'DEPRECATED - Usar tabla usuarios_activos para relación M:N';

-- 5️⃣ Eliminar triggers antiguos de sincronización 1:1 (ya no son necesarios)
DROP TRIGGER IF EXISTS trigger_sync_usuario_to_inventario ON usuarios_empresas;
DROP TRIGGER IF EXISTS trigger_sync_inventario_to_usuario ON inventario;
DROP FUNCTION IF EXISTS sync_usuario_to_inventario();
DROP FUNCTION IF EXISTS sync_inventario_to_usuario();

-- 6️⃣ Verificar migración
SELECT 
  'usuarios_activos' as tabla,
  COUNT(*) as total_asignaciones,
  COUNT(DISTINCT usuario_id) as usuarios_con_activos,
  COUNT(DISTINCT activo_id) as activos_asignados
FROM usuarios_activos
WHERE activo = TRUE;
