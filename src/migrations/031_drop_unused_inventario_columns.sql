-- 031_drop_unused_inventario_columns.sql
-- Eliminar columnas no usadas de la tabla inventario: empresa_nombre, sede_nombre, fecha_fin_garantia
ALTER TABLE inventario
  DROP COLUMN IF EXISTS empresa_nombre CASCADE,
  DROP COLUMN IF EXISTS sede_nombre CASCADE,
  DROP COLUMN IF EXISTS fecha_fin_garantia CASCADE;

-- Nota: CASCADE se incluye para evitar errores si existen dependencias menores. Revisar si hay objetos dependientes.
