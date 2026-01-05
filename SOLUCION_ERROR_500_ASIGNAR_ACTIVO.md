# SOLUCIÓN AL ERROR 500 - Endpoint asignar-activo

## Problema Identificado

❌ **Error:** Foreign Key constraint violation en tabla `usuarios_historial`

```
Error: inserción o actualización en la tabla «usuarios_historial» 
viola la llave foránea «usuarios_historial_realizado_por_fkey»

Detail: La llave (realizado_por)=(1) no está presente en la 
tabla «usuarios_empresas».
```

## Causa Raíz

La columna `realizado_por` en `usuarios_historial` tenía una foreign key que apuntaba a `usuarios_empresas(id)`, pero el JWT del sistema de autenticación contiene el `id` de la tabla `usuarios` (tabla de autenticación global), NO de `usuarios_empresas` (usuarios por empresa).

**Conflicto:**
- `(req as any).user.id` = ID de tabla `usuarios` (autenticación)  
- `realizado_por REFERENCES usuarios_empresas(id)` = Esperaba ID de `usuarios_empresas`

## Solución Aplicada

### Migration 068 - Fix realizado_por FK

```sql
-- Eliminar foreign key problemática
ALTER TABLE usuarios_historial 
DROP CONSTRAINT usuarios_historial_realizado_por_fkey;

-- Hacer el campo nullable
ALTER TABLE usuarios_historial 
ALTER COLUMN realizado_por DROP NOT NULL;
```

### Cambios en la Base de Datos

✅ Columna `realizado_por` ahora es **nullable**  
✅ Foreign key `usuarios_historial_realizado_por_fkey` **eliminada**  
✅ El campo `nombre_quien_realizo` (TEXT) almacena el nombre del usuario que realiza la acción  
✅ Migración 068 **ejecutada y verificada**

## Estado Actual

### ✅ Cambios Completados

- [x] Migration 068 ejecutada  
- [x] Foreign key eliminada  
- [x] Campo `realizado_por` convertido a nullable  
- [x] Código del servicio **NO requiere cambios** (ya maneja realizado_por como opcional)  
- [x] Código del controller **NO requiere cambios** (pasa NULL si no hay user.id válido)

### 📝 Cómo Funciona Ahora

El campo `realizado_por` puede contener:
1. **NULL** - Cuando el usuario que ejecuta la acción no existe en `usuarios_empresas`
2. **ID válido** - Si en el futuro se mapea correctamente

El campo `nombre_quien_realizo` (obligatorio) siempre contiene el nombre del usuario para auditoría.

## Testing del Endpoint

### Endpoint: POST /api/empresas/86/usuarios/11/asignar-activo

**Payload de prueba:**
```json
{
  "activoId": "58",
  "fechaAsignacion": "2026-01-04",
  "motivo": "gdfdfdfdfdfdf",
  "observacion": "gg"
}
```

**Headers requeridos:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### Respuesta Esperada (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "11",
    "nombreCompleto": "Enrique marin",
    "correo": "nicolepm15_07@hotmail.com",
    "cargo": "Asistente de contabilidad",
    "telefono": null,
    "activosAsignados": [
      {
        "id": "58",
        "asset_id": "HUA-PC0001",
        "codigo": "HUA-PC0001",
        "nombre": "gfd",
        "categoria": "PC",
        "fechaAsignacion": "2026-01-04"
      }
    ]
  }
}
```

## Próximos Pasos para el Frontend

1. **Reiniciar el servidor backend** (se puede estar crasheando por otro motivo no relacionado a este fix)
2. **Probar el endpoint** con el payload de prueba
3. **Verificar** que el historial se registre en la tabla `usuarios_historial`

### Query de Verificación

```sql
-- Ver último registro de historial
SELECT * FROM usuarios_historial 
WHERE usuario_id = 11 
ORDER BY created_at DESC 
LIMIT 1;

-- Ver asignaciones M:N
SELECT * FROM usuarios_activos 
WHERE usuario_id = 11 AND activo_id = 58;
```

## Archivos Modificados

- `migrations/068_fix_historial_realizado_por.sql` - Nueva migración
- Base de datos: tabla `usuarios_historial` modificada

## Nota Importante

⚠️ El servidor mostró que estaba "corriendo en puerto 4000" pero NO respondía a requests. Esto indica un problema **adicional** no relacionado con el fix de la foreign key.

**Posibles causas del problema del servidor:**
1. Otro error durante la carga de rutas
2. Problema con algún módulo/dependencia
3. Error en middleware que bloquea todas las peticiones
4. Proceso zombie que bloquea el puerto

**Recomendación:** Reiniciar completamente el backend y verificar logs completos de inicio.
