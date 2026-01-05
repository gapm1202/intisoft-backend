-- ============================================
-- TRIGGERS PARA SINCRONIZACIÓN BIDIRECCIONAL
-- USUARIO ↔ ACTIVO
-- ============================================

-- 1️⃣ TRIGGER: Cuando se actualiza usuarios_empresas.activo_asignado_id
--    Sincronizar → inventario.usuario_asignado_id

CREATE OR REPLACE FUNCTION sync_usuario_to_inventario()
RETURNS TRIGGER AS $$
DECLARE
  v_old_activo_id INTEGER;
  v_new_activo_id INTEGER;
  v_usuario_id INTEGER;
BEGIN
  v_usuario_id := NEW.id;
  v_old_activo_id := OLD.activo_asignado_id;
  v_new_activo_id := NEW.activo_asignado_id;
  
  -- Solo procesar si el activo_asignado_id cambió
  IF v_old_activo_id IS DISTINCT FROM v_new_activo_id THEN
    
    -- Liberar activo anterior (si existía)
    IF v_old_activo_id IS NOT NULL THEN
      UPDATE inventario 
      SET usuario_asignado_id = NULL 
      WHERE id = v_old_activo_id;
    END IF;
    
    -- Asignar nuevo activo (si se especificó)
    IF v_new_activo_id IS NOT NULL THEN
      -- Primero, liberar cualquier otro usuario que tuviera este activo
      UPDATE usuarios_empresas 
      SET activo_asignado_id = NULL 
      WHERE activo_asignado_id = v_new_activo_id 
        AND id != v_usuario_id;
      
      -- Asignar el activo al usuario
      UPDATE inventario 
      SET usuario_asignado_id = v_usuario_id 
      WHERE id = v_new_activo_id;
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_usuario_to_inventario ON usuarios_empresas;

CREATE TRIGGER trigger_sync_usuario_to_inventario
AFTER UPDATE OF activo_asignado_id ON usuarios_empresas
FOR EACH ROW
EXECUTE FUNCTION sync_usuario_to_inventario();


-- 2️⃣ TRIGGER: Cuando se actualiza inventario.usuario_asignado_id
--    Sincronizar → usuarios_empresas.activo_asignado_id

CREATE OR REPLACE FUNCTION sync_inventario_to_usuario()
RETURNS TRIGGER AS $$
DECLARE
  v_old_usuario_id INTEGER;
  v_new_usuario_id INTEGER;
  v_activo_id INTEGER;
BEGIN
  v_activo_id := NEW.id;
  v_old_usuario_id := OLD.usuario_asignado_id;
  v_new_usuario_id := NEW.usuario_asignado_id;
  
  -- Solo procesar si el usuario_asignado_id cambió
  IF v_old_usuario_id IS DISTINCT FROM v_new_usuario_id THEN
    
    -- Liberar usuario anterior (si existía)
    IF v_old_usuario_id IS NOT NULL THEN
      UPDATE usuarios_empresas 
      SET activo_asignado_id = NULL 
      WHERE id = v_old_usuario_id;
    END IF;
    
    -- Asignar nuevo usuario (si se especificó)
    IF v_new_usuario_id IS NOT NULL THEN
      -- Primero, liberar el activo anterior que tuviera este usuario
      UPDATE inventario 
      SET usuario_asignado_id = NULL 
      WHERE usuario_asignado_id = v_new_usuario_id 
        AND id != v_activo_id;
      
      -- Asignar el usuario al activo
      UPDATE usuarios_empresas 
      SET activo_asignado_id = v_activo_id 
      WHERE id = v_new_usuario_id;
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_inventario_to_usuario ON inventario;

CREATE TRIGGER trigger_sync_inventario_to_usuario
AFTER UPDATE OF usuario_asignado_id ON inventario
FOR EACH ROW
EXECUTE FUNCTION sync_inventario_to_usuario();

-- Verificar que los triggers se crearon
SELECT 
  trigger_name, 
  event_object_table, 
  action_timing, 
  event_manipulation
FROM information_schema.triggers 
WHERE trigger_name LIKE 'trigger_sync%'
ORDER BY event_object_table;
