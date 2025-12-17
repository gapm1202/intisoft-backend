-- MONITOREO Y DEBUGGING - QUERIES ÚTILES
-- Ejecutar estos SELECTs en psql para inspeccionar el sistema

-- ============================================
-- 1. ESTADO ACTUAL DE SECUENCIAS
-- ============================================

-- Ver próximo número para cada empresa/categoría
SELECT 
  acs.id,
  e.nombre as empresa,
  e.codigo as emp_codigo,
  c.nombre as categoria,
  c.codigo as cat_codigo,
  acs.next_number as proximo_numero,
  acs.created_at,
  acs.updated_at
FROM activos_codigo_sequence acs
JOIN empresas e ON acs.empresa_id = e.id
JOIN categorias c ON acs.categoria_id = c.id
ORDER BY e.nombre, c.nombre;

-- Ver secuencias para una empresa específica
SELECT 
  acs.id,
  c.nombre as categoria,
  c.codigo,
  acs.next_number
FROM activos_codigo_sequence acs
JOIN categorias c ON acs.categoria_id = c.id
WHERE acs.empresa_id = 1  -- <-- cambiar empresa_id
ORDER BY c.nombre;

-- ============================================
-- 2. RESERVAS ACTIVAS (no expiradas, no confirmadas)
-- ============================================

-- Todas las reservas pendientes
SELECT 
  acr.id,
  acr.codigo,
  e.nombre as empresa,
  c.nombre as categoria,
  acr.sequence_number,
  acr.reserved_at,
  acr.expires_at,
  acr.confirmed,
  EXTRACT(EPOCH FROM (acr.expires_at - CURRENT_TIMESTAMP)) / 60 as minutos_restantes
FROM activos_codigo_reserved acr
JOIN empresas e ON acr.empresa_id = e.id
JOIN categorias c ON acr.categoria_id = c.id
WHERE acr.confirmed = FALSE
  AND acr.expires_at > CURRENT_TIMESTAMP
ORDER BY acr.expires_at ASC;

-- Reservas próximas a expirar (< 5 minutos)
SELECT 
  acr.id,
  acr.codigo,
  e.nombre as empresa,
  EXTRACT(EPOCH FROM (acr.expires_at - CURRENT_TIMESTAMP)) / 60 as minutos_restantes
FROM activos_codigo_reserved acr
JOIN empresas e ON acr.empresa_id = e.id
WHERE acr.confirmed = FALSE
  AND acr.expires_at > CURRENT_TIMESTAMP
  AND acr.expires_at < CURRENT_TIMESTAMP + INTERVAL '5 minutes'
ORDER BY acr.expires_at ASC;

-- ============================================
-- 3. CÓDIGOS UTILIZADOS / CONFIRMADOS
-- ============================================

-- Todos los códigos confirmados (ya utilizados)
SELECT 
  acr.id,
  acr.codigo,
  e.nombre as empresa,
  c.nombre as categoria,
  acr.sequence_number,
  acr.activo_id,
  acr.confirmed,
  acr.updated_at as fecha_confirmacion
FROM activos_codigo_reserved acr
JOIN empresas e ON acr.empresa_id = e.id
JOIN categorias c ON acr.categoria_id = c.id
WHERE acr.confirmed = TRUE
ORDER BY acr.updated_at DESC
LIMIT 50;

-- Códigos utilizados por empresa
SELECT 
  e.nombre as empresa,
  COUNT(*) as total_codigos_utilizados,
  MIN(acr.updated_at) as primer_codigo,
  MAX(acr.updated_at) as ultimo_codigo
FROM activos_codigo_reserved acr
JOIN empresas e ON acr.empresa_id = e.id
WHERE acr.confirmed = TRUE
GROUP BY e.id, e.nombre
ORDER BY total_codigos_utilizados DESC;

-- ============================================
-- 4. RESERVAS EXPIRADAS (sin confirmar)
-- ============================================

-- Códigos expirados que pueden ser limpiados
SELECT 
  acr.id,
  acr.codigo,
  e.nombre as empresa,
  acr.expires_at,
  EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - acr.expires_at)) / 60 as minutos_expirados
FROM activos_codigo_reserved acr
JOIN empresas e ON acr.empresa_id = e.id
WHERE acr.confirmed = FALSE
  AND acr.expires_at < CURRENT_TIMESTAMP
ORDER BY acr.expires_at DESC;

-- Contar códigos expirados
SELECT 
  COUNT(*) as total_expirados,
  MIN(expires_at) as mas_antiguo,
  MAX(expires_at) as mas_reciente
FROM activos_codigo_reserved
WHERE confirmed = FALSE AND expires_at < CURRENT_TIMESTAMP;

-- ============================================
-- 5. ESTADÍSTICAS GLOBALES
-- ============================================

-- Dashboard general
SELECT 
  'Total secuencias' as metrica,
  COUNT(*) as valor
FROM activos_codigo_sequence
UNION ALL
SELECT 
  'Reservas pendientes',
  COUNT(*) 
FROM activos_codigo_reserved
WHERE confirmed = FALSE AND expires_at > CURRENT_TIMESTAMP
UNION ALL
SELECT 
  'Códigos utilizados',
  COUNT(*) 
FROM activos_codigo_reserved
WHERE confirmed = TRUE
UNION ALL
SELECT 
  'Códigos expirados',
  COUNT(*) 
FROM activos_codigo_reserved
WHERE confirmed = FALSE AND expires_at < CURRENT_TIMESTAMP;

-- ============================================
-- 6. VALIDACIÓN DE INTEGRIDAD
-- ============================================

-- Verificar que empresas tienen código
SELECT 
  id,
  nombre,
  codigo,
  CASE WHEN codigo IS NULL THEN '❌ SIN CÓDIGO' ELSE '✅ OK' END as estado
FROM empresas
ORDER BY nombre;

-- Verificar que categorías tienen código
SELECT 
  id,
  nombre,
  codigo,
  CASE WHEN codigo IS NULL THEN '❌ SIN CÓDIGO' ELSE '✅ OK' END as estado
FROM categorias
ORDER BY nombre;

-- Verificar códigos duplicados en empresas
SELECT 
  codigo,
  COUNT(*) as duplicados
FROM empresas
WHERE codigo IS NOT NULL
GROUP BY codigo
HAVING COUNT(*) > 1;

-- Verificar códigos duplicados en categorías
SELECT 
  codigo,
  COUNT(*) as duplicados
FROM categorias
WHERE codigo IS NOT NULL
GROUP BY codigo
HAVING COUNT(*) > 1;

-- ============================================
-- 7. DEBUGGING - CORRELACIÓN CON INVENTARIO
-- ============================================

-- Ver activos creados con códigos reservados
SELECT 
  inv.id,
  inv.assetId,
  e.nombre as empresa,
  c.nombre as categoria,
  inv.fabricante,
  inv.modelo,
  inv.creado_en,
  acr.codigo as codigo_reservado,
  acr.sequence_number
FROM inventario inv
LEFT JOIN activos_codigo_reserved acr ON inv.assetId = acr.codigo
LEFT JOIN empresas e ON inv.empresaId = e.id
LEFT JOIN categorias c ON inv.categoriaId = c.id
WHERE inv.assetId LIKE '%-' -- formato reservado (contiene guión)
ORDER BY inv.creado_en DESC
LIMIT 50;

-- Ver hueco de secuencias (si existen gaps)
SELECT 
  empresa_id,
  categoria_id,
  sequence_number,
  sequence_number - LAG(sequence_number, 1) 
    OVER (PARTITION BY empresa_id, categoria_id ORDER BY sequence_number) as gap
FROM activos_codigo_reserved
WHERE confirmed = TRUE
ORDER BY empresa_id, categoria_id, sequence_number;

-- ============================================
-- 8. PERFORMANCE / ÍNDICES
-- ============================================

-- Verificar índices existentes
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('activos_codigo_sequence', 'activos_codigo_reserved')
ORDER BY tablename, indexname;

-- Verificar tamaño de tablas
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE tablename IN ('activos_codigo_sequence', 'activos_codigo_reserved')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ============================================
-- 9. OPERACIONES ADMINISTRATIVAS
-- ============================================

-- LIMPIAR: Eliminar todas las reservas expiradas
DELETE FROM activos_codigo_reserved
WHERE confirmed = FALSE AND expires_at < CURRENT_TIMESTAMP;
-- Resultado: X rows deleted

-- RESET: Resetear secuencia para una empresa/categoría (usar con cuidado)
-- UPDATE activos_codigo_sequence
-- SET next_number = 1
-- WHERE empresa_id = 1 AND categoria_id = 1;
-- ⚠️ SOLO SI REALMENTE NECESARIO (borra histórico)

-- BACKUP: Exportar códigos utilizados antes de hacer limpieza
-- pg_dump -Fc -t activos_codigo_reserved $DATABASE_URL > backup_codigos.dump

-- ============================================
-- 10. MONITOREO CONTINUO
-- ============================================

-- Query para monitorear cada 5 minutos
-- Muestra estado actual de reservas
SELECT 
  'Secuencias activas' as categoria,
  COUNT(*) as cantidad
FROM activos_codigo_sequence
UNION ALL
SELECT 
  'Reservas pendientes',
  COUNT(*) 
FROM activos_codigo_reserved
WHERE confirmed = FALSE AND expires_at > CURRENT_TIMESTAMP
UNION ALL
SELECT 
  'Códigos confirmados',
  COUNT(*) 
FROM activos_codigo_reserved
WHERE confirmed = TRUE
UNION ALL
SELECT 
  'Códigos expirados (limpiar)',
  COUNT(*) 
FROM activos_codigo_reserved
WHERE confirmed = FALSE AND expires_at < CURRENT_TIMESTAMP;

-- ============================================
-- EJEMPLO: Usar en query de monitoreo periódica
-- ============================================

-- Guion para monitorear salud del sistema
-- Ejecutar cada 30 minutos con cron o similar:

/*
#!/bin/bash
psql $DATABASE_URL << EOF
-- 1. Limpiar expiradas
DELETE FROM activos_codigo_reserved 
WHERE confirmed = FALSE AND expires_at < CURRENT_TIMESTAMP;

-- 2. Reportar estado
SELECT 
  TO_CHAR(CURRENT_TIMESTAMP, 'YYYY-MM-DD HH24:MI:SS') as timestamp,
  (SELECT COUNT(*) FROM activos_codigo_reserved WHERE confirmed = FALSE AND expires_at > CURRENT_TIMESTAMP) as reservas_activas,
  (SELECT COUNT(*) FROM activos_codigo_reserved WHERE confirmed = TRUE) as codigos_usados,
  (SELECT COUNT(*) FROM activos_codigo_reserved WHERE confirmed = FALSE and expires_at < CURRENT_TIMESTAMP) as expiradas;
EOF
*/

-- ============================================
-- ALERTAS: Queries para detectar problemas
-- ============================================

-- ALERTA: Empresas sin código
SELECT 'ALERTA' as tipo, 'Empresa sin código' as problema, nombre, id
FROM empresas WHERE codigo IS NULL;

-- ALERTA: Categorías sin código
SELECT 'ALERTA' as tipo, 'Categoría sin código' as problema, nombre, id
FROM categorias WHERE codigo IS NULL;

-- ALERTA: Códigos duplicados
SELECT 'ALERTA' as tipo, 'Código duplicado en empresas' as problema, codigo, COUNT(*) as repeticiones
FROM empresas WHERE codigo IS NOT NULL GROUP BY codigo HAVING COUNT(*) > 1
UNION ALL
SELECT 'ALERTA' as tipo, 'Código duplicado en categorías' as problema, codigo, COUNT(*) as repeticiones
FROM categorias WHERE codigo IS NOT NULL GROUP BY codigo HAVING COUNT(*) > 1;

-- ALERTA: Inconsistencias en reservas
SELECT 'ALERTA' as tipo, 'Reserva sin empresa' as problema, id
FROM activos_codigo_reserved
WHERE empresa_id NOT IN (SELECT id FROM empresas);

SELECT 'ALERTA' as tipo, 'Reserva sin categoría' as problema, id
FROM activos_codigo_reserved
WHERE categoria_id NOT IN (SELECT id FROM categorias);
