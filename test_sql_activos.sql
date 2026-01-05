-- Verificar que la query devuelve activosAsignados correctamente
SELECT 
  u.id,
  u.nombre_completo,
  COALESCE(
    (SELECT JSON_AGG(
      JSON_BUILD_OBJECT(
        'id', inv.id,
        'assetId', inv.asset_id,
        'codigo', inv.asset_id,
        'categoria', inv.categoria,
        'fechaAsignacion', ua.fecha_asignacion
      )
    )
    FROM usuarios_activos ua
    INNER JOIN inventario inv ON ua.activo_id = inv.id
    WHERE ua.usuario_id = u.id AND ua.activo = TRUE),
    '[]'::json
  ) as activos_asignados
FROM usuarios_empresas u
WHERE u.id IN (16, 18, 19, 20, 21, 22)
ORDER BY u.id;
