# 🔴 FIX: Procesamiento M:N en Endpoints de Inventario

## Problema Identificado

El frontend enviaba correctamente `usuariosAsignadosIds` pero los endpoints **no lo procesaban**:

```
✅ REQUEST  → usuariosAsignadosIds: ['11', '12']
❌ RESPONSE → usuarios_asignados_m2n: []
              cantidad_usuarios_asignados: '0'
```

## Solución Implementada

Se agregó procesamiento M:N en **3 endpoints** de inventario:

### 1. **UPDATE** - `PUT /api/empresas/:empresaId/sedes/:sedeId/inventario/:activoId`

```typescript
// DESPUÉS de actualizar campos del activo
const usuariosAsignadosIds = data.usuariosAsignadosIds || data.usuariosAsignados;
if (usuariosAsignadosIds && Array.isArray(usuariosAsignadosIds)) {
  // 1. Eliminar asignaciones antiguas
  await pool.query(
    'DELETE FROM usuarios_activos WHERE activo_id = $1 AND activo = true',
    [activoId]
  );
  
  // 2. Insertar nuevas asignaciones
  for (const usuarioId of usuariosAsignadosIds) {
    await pool.query(
      `INSERT INTO usuarios_activos 
       (usuario_id, activo_id, fecha_asignacion, asignado_por, motivo, activo)
       VALUES ($1, $2, NOW(), $3, $4, true)`,
      [parseInt(usuarioId), activoId, authenticatedUserId || null, motivo]
    );
  }
}
```

### 2. **CREATE** - `POST /api/empresas/:empresaId/inventario`

```typescript
// DESPUÉS de crear el activo
const usuariosAsignadosIds = data.usuariosAsignadosIds || data.usuariosAsignados;
if (usuariosAsignadosIds && Array.isArray(usuariosAsignadosIds) && inventario.id) {
  const activoId = inventario.id;
  
  for (const usuarioId of usuariosAsignadosIds) {
    await pool.query(
      `INSERT INTO usuarios_activos 
       (usuario_id, activo_id, fecha_asignacion, asignado_por, motivo, activo)
       VALUES ($1, $2, NOW(), $3, $4, true)`,
      [parseInt(usuarioId), activoId, authenticatedUserId || null, motivo]
    );
  }
}
```

### 3. **CREATE SEDE** - `POST /api/empresas/:empresaId/sedes/:sedeId/inventario`

Misma lógica que CREATE pero con logs específicos para sede.

---

## Comportamiento

### Campo del Payload
- **Acepta:** `usuariosAsignadosIds` o `usuariosAsignados`
- **Tipo:** Array de strings (IDs de usuarios)
- **Ejemplo:** `["11", "12", "13"]`

### Proceso UPDATE
1. **Elimina** todas las asignaciones antiguas del activo
2. **Inserta** las nuevas asignaciones desde el array

### Proceso CREATE
1. **Crea** el activo primero
2. **Inserta** las asignaciones en `usuarios_activos`

### Respuesta
Después del procesamiento M:N, se re-consulta el activo completo que **ya incluye**:
```json
{
  "usuarios_asignados_m2n": [
    {
      "id": 11,
      "nombreCompleto": "Juan Pérez",
      "correo": "juan@example.com",
      "fechaAsignacion": "2024-01-04T12:30:00.000Z"
    }
  ],
  "cantidad_usuarios_asignados": "1"
}
```

---

## Testing

### Caso de Prueba
```bash
# UPDATE activo 58 con usuarios [11, 12]
PUT /api/empresas/1/sedes/1/inventario/58
{
  "usuariosAsignadosIds": ["11", "12"],
  "modelo": "ThinkPad X1"
}

# CREATE nuevo activo con usuarios [11, 12]
POST /api/empresas/1/sedes/1/inventario
{
  "usuariosAsignadosIds": ["11", "12"],
  "categoria": "Laptop",
  "modelo": "ThinkPad X1"
}
```

### Logs Esperados
```
updateInventarioSede - procesando usuariosAsignadosIds: ['11', '12']
updateInventarioSede - 2 usuarios asignados correctamente
```

---

## Archivos Modificados

- [src/modules/empresas/controllers/inventario.controller.ts](src/modules/empresas/controllers/inventario.controller.ts)
  - `updateInventarioSede()` - línea ~732
  - `createInventario()` - línea ~435
  - `createInventarioSede()` - línea ~605

---

## Notas Técnicas

1. **Manejo de errores:** Si falla M:N, NO bloquea la operación principal (create/update)
2. **Logs completos:** Cada operación M:N registra en consola para debugging
3. **Re-fetch:** Después de procesar M:N, se vuelve a consultar el activo para retornar datos actualizados
4. **Tabla:** `usuarios_activos` (Migration 066)
5. **Campos opcionales:** Si no viene `usuariosAsignadosIds`, no hace nada (no borra asignaciones existentes)

---

## Estado

✅ **IMPLEMENTADO** - 2024-01-04  
✅ **TypeScript compilado sin errores**  
⏳ **Pendiente testing en servidor**

---

## Siguiente Paso

El frontend debe probar con activo ID 58 y usuarios [11, 12] como indicaron.
