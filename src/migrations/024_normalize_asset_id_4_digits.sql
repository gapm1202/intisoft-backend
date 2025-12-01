-- 024_normalize_asset_id_4_digits.sql
-- Propósito:
-- 1) Detectar posibles colisiones al normalizar asset_id a formato PREFIX-0001
-- 2) Normalizar asset_id existentes a 4 dígitos
-- 3) Instrucciones para crear índice único (CONCURRENTLY) después de validar
-- IMPORTANTE: Probar primero en staging. Hacer BACKUP antes de ejecutar en producción.

-- -----------------------------
-- 0) CHECK: Mostrar cuántas filas se normalizarían y detectar duplicados
-- -----------------------------
-- Este query muestra el asset_id normalizado y agrupa por el valor normalizado.
-- Si alguna fila en el resultado tiene count_examples > 1, hay colisión potencial
-- que debe resolverse antes de aplicar la normalización.

WITH parsed AS (
  SELECT
    id,
    asset_id,
    -- extraer prefijo y numero sin ceros a la izquierda
    regexp_replace(asset_id, '^([A-Za-z]+)-?0*([0-9]+)$', '\1') AS prefix,
    regexp_replace(asset_id, '^([A-Za-z]+)-?0*([0-9]+)$', '\2') AS num
  FROM inventario
  WHERE asset_id ~ '^[A-Za-z]+-?\d+$'
)
SELECT
  prefix || '-' || lpad(num, 4, '0') AS normalized_asset,
  COUNT(*) AS count_examples,
  array_agg(id) AS ids,
  array_agg(asset_id) AS examples
FROM parsed
GROUP BY normalized_asset
ORDER BY count_examples DESC;

-- Si el resultado muestra filas con count_examples > 1, revise `ids` y `examples`.
-- Puede optar por resolver manualmente esos casos o aplicar una estrategia automática.

-- -----------------------------
-- 1) (Opcional) Generar reporte de colisiones solo (más legible)
-- -----------------------------
-- Ejecutar solo si quiere un resumen de conflictos (IDs y ejemplos)

-- SELECT * FROM (
--   WITH parsed AS (
--     SELECT id, asset_id,
--       regexp_replace(asset_id, '^([A-Za-z]+)-?0*([0-9]+)$', '\1') AS prefix,
--       regexp_replace(asset_id, '^([A-Za-z]+)-?0*([0-9]+)$', '\2') AS num
--     FROM inventario
--     WHERE asset_id ~ '^[A-Za-z]+-?\\d+$'
--   )
--   SELECT prefix || '-' || lpad(num,4,'0') AS normalized_asset, array_agg(row_to_json(parsed)) as rows
--   FROM parsed
--   GROUP BY normalized_asset
--   HAVING COUNT(*) > 1
-- ) t;

-- -----------------------------
-- 2) NORMALIZACIÓN: actualizar asset_id a formato PREFIX-0001
-- -----------------------------
-- Ejecutar SOLO SI la comprobación anterior no devuelve colisiones, o si las colisiones
-- ya fueron resueltas manualmente.
-- Recomendación: ejecutar en batch/ventana de mantenimiento.

BEGIN;

WITH parsed AS (
  SELECT
    id,
    asset_id,
    regexp_replace(asset_id, '^([A-Za-z]+)-?0*([0-9]+)$', '\1') AS prefix,
    regexp_replace(asset_id, '^([A-Za-z]+)-?0*([0-9]+)$', '\2') AS num
  FROM inventario
  WHERE asset_id ~ '^[A-Za-z]+-?\d+$'
)
UPDATE inventario i
SET asset_id = p.prefix || '-' || lpad(p.num, 4, '0')
FROM parsed p
WHERE i.id = p.id
  -- doble-check: solo actualizar si el valor resultante difiere
  AND i.asset_id IS DISTINCT FROM (p.prefix || '-' || lpad(p.num,4,'0'));

COMMIT;

-- -----------------------------
-- 3) CREAR ÍNDICE ÚNICO (RECOMENDADO CONCURRENTLY)
-- -----------------------------
-- Nota: CREATE INDEX CONCURRENTLY NO puede ejecutarse dentro de una transacción.
-- Ejecutar esta sentencia por separado, fuera del bloque BEGIN/COMMIT.

-- Verificar antes que no existan duplicados después de normalizar:
-- SELECT normalized_asset, count(*) FROM (
--   SELECT prefix || '-' || lpad(num,4,'0') AS normalized_asset
--   FROM (
--     SELECT regexp_replace(asset_id, '^([A-Za-z]+)-?0*([0-9]+)$', '\1') AS prefix,
--            regexp_replace(asset_id, '^([A-Za-z]+)-?0*([0-9]+)$', '\2') AS num
--     FROM inventario
--     WHERE asset_id ~ '^[A-Za-z]+-?\\d+$'
--   ) sub
-- ) t GROUP BY normalized_asset HAVING COUNT(*) > 1;

-- Si el check anterior NO devuelve filas, puede crear el índice único:
-- (ejecutar en ventana de mantenimiento o en modo CONCURRENTLY)

-- CREATE UNIQUE INDEX CONCURRENTLY idx_inventario_asset_id_unique ON inventario (asset_id);

-- Si su versión de Postgres o la política del equipo no permite CONCURRENTLY, 
-- coordinar ventana de mantenimiento y ejecutar sin CONCURRENTLY.

-- -----------------------------
-- 4) Estrategia para colisiones detectadas
-- -----------------------------
-- Si detecta colisiones (varias filas que normalizan al mismo asset), generar
-- un reporte y resolver manualmente. Ejemplo de reporte:

-- WITH parsed AS (
--   SELECT id, asset_id,
--     regexp_replace(asset_id, '^([A-Za-z]+)-?0*([0-9]+)$', '\1') AS prefix,
--     regexp_replace(asset_id, '^([A-Za-z]+)-?0*([0-9]+)$', '\2') AS num
--   FROM inventario
--   WHERE asset_id ~ '^[A-Za-z]+-?\\d+$'
-- )
-- SELECT prefix || '-' || lpad(num,4,'0') AS normalized_asset, array_agg(id) AS ids, array_agg(asset_id) AS examples
-- FROM parsed
-- GROUP BY normalized_asset
-- HAVING COUNT(*) > 1;

-- Resolución manual sugerida:
-- - Revisar cada grupo, decidir renombrado (ej. PREFIX-0001A temporal) o consolidar
-- - Actualizar tablas relacionadas si fuera necesario
-- - Re-ejecutar el UPDATE de normalización

-- -----------------------------
-- 5) Registro de cambios / rollback
-- -----------------------------
-- Antes de ejecutar la normalización, crear una tabla temporal para mapping antiguo->nuevo
-- (útil para rollback manual o para scripts de revisión)

-- CREATE TABLE IF NOT EXISTS asset_id_mapping (
--   id integer PRIMARY KEY,
--   old_asset_id varchar,
--   new_asset_id varchar,
--   changed_at timestamp default now()
-- );

-- Luego, antes del UPDATE, insertar en mapping:
-- INSERT INTO asset_id_mapping (id, old_asset_id, new_asset_id)
-- SELECT p.id, p.asset_id, p.prefix || '-' || lpad(p.num,4,'0')
-- FROM (
--  SELECT id, asset_id, regexp_replace(asset_id, '^([A-Za-z]+)-?0*([0-9]+)$', '\1') AS prefix,
--         regexp_replace(asset_id, '^([A-Za-z]+)-?0*([0-9]+)$', '\2') AS num
--  FROM inventario
--  WHERE asset_id ~ '^[A-Za-z]+-?\\d+$'
-- ) p;

-- Luego ejecutar el UPDATE normalizador.

-- Fin del archivo.
