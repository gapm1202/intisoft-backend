-- Cambiar restricción UNIQUE de asset_id para permitir códigos duplicados en diferentes sedes
-- Los códigos ahora serán únicos por combinación (empresa_id, sede_id, asset_id)

-- 1. Eliminar la restricción UNIQUE actual de asset_id
ALTER TABLE inventario DROP CONSTRAINT IF EXISTS inventario_asset_id_key;

-- 2. Agregar nueva restricción UNIQUE compuesta (empresa_id, sede_id, asset_id)
ALTER TABLE inventario ADD CONSTRAINT inventario_empresa_sede_asset_unique 
  UNIQUE (empresa_id, sede_id, asset_id);

-- Nota: Esto permite que LPT-001 exista en Sede 16 y en Sede 17 de la misma empresa
-- pero no permite duplicados dentro de la misma sede
