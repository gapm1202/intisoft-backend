-- Simular creación de usuario con activosIds
BEGIN;

-- 1. Crear usuario
INSERT INTO usuarios_empresas (
  empresa_id, sede_id, nombre_completo, correo, cargo, activo
) VALUES (
  86, 35, 'Test SQL ActivosIds', 'testsql@test.co', 'Tester', TRUE
) RETURNING id;

-- Asumiendo que devuelve ID = 28 (ajustar según resultado)
-- 2. Asignar activos 61 y 62
INSERT INTO usuarios_activos (usuario_id, activo_id, fecha_asignacion, motivo, activo)
VALUES 
  (28, 61, NOW(), 'Asignación inicial al crear usuario', TRUE),
  (28, 62, NOW(), 'Asignación inicial al crear usuario', TRUE);

COMMIT;

-- 3. Verificar resultado
SELECT 
  u.id,
  u.nombre_completo,
  (SELECT COUNT(*) FROM usuarios_activos WHERE usuario_id = u.id AND activo = TRUE) as cantidad,
  COALESCE(
    (SELECT JSON_AGG(
      JSON_BUILD_OBJECT(
        'id', inv.id,
        'codigo', inv.asset_id,
        'categoria', inv.categoria
      )
    )
    FROM usuarios_activos ua
    INNER JOIN inventario inv ON ua.activo_id = inv.id
    WHERE ua.usuario_id = u.id AND ua.activo = TRUE),
    '[]'::json
  ) as activos
FROM usuarios_empresas u
WHERE u.id = 28;
