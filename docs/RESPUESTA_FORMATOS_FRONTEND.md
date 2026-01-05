# 🔴 RESPUESTA URGENTE - FORMATOS DE CAMPOS BACKEND

## ✅ 1. REINICIO DEL SERVIDOR

**SÍ, ES CRÍTICO REINICIAR EL SERVIDOR** después de las correcciones SQL.

Los cambios en los archivos TypeScript (.ts) fueron:
- `src/modules/empresas/repositories/usuario-empresa.repository.ts`
- `src/modules/empresas/repositories/inventario.repository.ts`

**Comando para reiniciar:**
```bash
# Detener el servidor actual (Ctrl+C)
# Luego ejecutar:
npx ts-node src/server/index.ts
```

O si usan nodemon:
```bash
npm run dev
```

---

## ✅ 2. FORMATO DE CAMPOS - **100% camelCase**

### 📋 REQUEST (lo que el frontend ENVÍA al backend):

**POST /api/empresas/85/usuarios**
```json
{
  "sedeId": "123",
  "nombreCompleto": "Juan Pérez",
  "correo": "juan.perez@empresa.com",
  "cargo": "Técnico",
  "telefono": "+51987654321",
  "observaciones": "Nuevo técnico",
  "activoAsignadoId": null
}
```

**Campos requeridos:**
- ✅ `sedeId` (no sede_id)
- ✅ `nombreCompleto` (no nombre_completo)
- ✅ `correo`

**Campos opcionales:**
- ✅ `cargo`
- ✅ `telefono`
- ✅ `observaciones`
- ✅ `activoAsignadoId` (null o ID del inventario)

⚠️ **IMPORTANTE:** NO enviar `empresaId` en el body, viene de la URL: `/api/empresas/:empresaId/usuarios`

---

### 📋 RESPONSE (lo que el backend DEVUELVE):

**GET /api/empresas/85/usuarios**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "_id": "1",
      "empresaId": "85",
      "sedeId": "123",
      "nombreCompleto": "Juan Pérez",
      "correo": "juan.perez@empresa.com",
      "cargo": "Técnico",
      "telefono": "+51987654321",
      "observaciones": "Nuevo técnico",
      "activoAsignadoId": "456",
      "activo": true,
      "createdAt": "2026-01-03T...",
      "updatedAt": "2026-01-03T...",
      "sedeName": "Sede Principal",
      "empresaName": "Mi Empresa",
      "activoCodigo": "AC-2024-0001",
      "activoNombre": "Laptop",
      "activoModelo": "Dell XPS 15"
    }
  ]
}
```

**POST /api/empresas/85/usuarios (response 201)**
```json
{
  "success": true,
  "message": "Usuario creado exitosamente",
  "data": {
    "id": 1,
    "_id": "1",
    "empresaId": "85",
    "sedeId": "123",
    "nombreCompleto": "Juan Pérez",
    ...
  }
}
```

---

## ✅ 3. MAPEO COMPLETO DE CAMPOS

| Campo Frontend (camelCase) | Campo DB (snake_case) | Tipo | Requerido |
|----------------------------|----------------------|------|-----------|
| `id` | `id` | number | Auto |
| `_id` | `id` (convertido) | string | Auto |
| `empresaId` | `empresa_id` | string | Sí |
| `sedeId` | `sede_id` | string | Sí |
| `nombreCompleto` | `nombre_completo` | string | Sí |
| `correo` | `correo` | string | Sí |
| `cargo` | `cargo` | string | No |
| `telefono` | `telefono` | string | No |
| `observaciones` | `observaciones` | string | No |
| `activoAsignadoId` | `activo_asignado_id` | string\|null | No |
| `activo` | `activo` | boolean | Auto (true) |
| `createdAt` | `created_at` | Date | Auto |
| `updatedAt` | `updated_at` | Date | Auto |

**Campos JOIN (solo en response):**
- `sedeName` - nombre de la sede
- `empresaName` - nombre de la empresa
- `activoCodigo` - asset_id del inventario
- `activoNombre` - categoria del inventario
- `activoModelo` - modelo del inventario

---

## ✅ 4. LOGS QUE DEBERÍAN VER

Si todo está correcto después de reiniciar, deberían ver:

### GET /api/empresas/85/usuarios
```
[Logs esperados: sin errores, devuelve array de usuarios]
```

### POST /api/empresas/85/usuarios
```
[USUARIO-EMPRESA] 🔄 Iniciando transacción CREATE
[USUARIO-EMPRESA] 📝 Usuario data: {nombreCompleto: 'Juan Pérez', correo: '...', ...}
[USUARIO-EMPRESA] ✅ Usuario insertado, ID: X
[USUARIO-EMPRESA] 🎯 Activo asignado: null (o ID si aplica)
[USUARIO-EMPRESA] 💾 Inventario actualizado (si activoAsignadoId != null)
[USUARIO-EMPRESA] ✅ Usuario obtenido después de creación
[USUARIO-EMPRESA] 🎉 Transacción CREATE completada exitosamente
```

**Si ven errores:**
```
[USUARIO-EMPRESA] ❌ Error en transacción CREATE, ROLLBACK ejecutado: [mensaje]
```

---

## ✅ 5. EJEMPLOS DE PAYLOADS CORRECTOS

### Crear usuario SIN activo asignado:
```json
{
  "sedeId": "123",
  "nombreCompleto": "Ana García",
  "correo": "ana.garcia@empresa.com",
  "cargo": "Analista",
  "activoAsignadoId": null
}
```

### Crear usuario CON activo asignado:
```json
{
  "sedeId": "123",
  "nombreCompleto": "Carlos López",
  "correo": "carlos.lopez@empresa.com",
  "cargo": "Gerente",
  "activoAsignadoId": "789"
}
```

### Actualizar solo el cargo:
```json
{
  "cargo": "Gerente Senior"
}
```

### Reasignar activo:
```json
{
  "activoAsignadoId": "999"
}
```

### Liberar activo:
```json
{
  "activoAsignadoId": null
}
```

---

## ✅ 6. ERRORES COMUNES Y SOLUCIONES

### ❌ Error: "no existe la columna i.nombre"
**Causa:** Servidor no reiniciado después de las correcciones
**Solución:** Reiniciar servidor con `npx ts-node src/server/index.ts`

### ❌ Error: "la referencia a la columna empresa_id es ambigua"
**Causa:** Servidor no reiniciado después de las correcciones
**Solución:** Reiniciar servidor

### ❌ Error: "El correo ya está registrado..."
**Causa:** Ya existe usuario con ese correo en esa empresa
**Solución:** Usar otro correo o incluir `?incluirInactivos=true` para verificar

### ❌ Error: "La sede no pertenece a la empresa"
**Causa:** sedeId no corresponde a empresaId
**Solución:** Verificar que la sede pertenece a la empresa 85

### ❌ Error: "El activo ya está asignado..."
**Causa:** Otro usuario tiene ese activo
**Solución:** Usar otro activo o liberar el actual primero

---

## ✅ 7. CHECKLIST PARA EL FRONTEND

Antes de probar:
- [ ] Reiniciar backend server
- [ ] Confirmar que el server arrancó sin errores
- [ ] Verificar que usan camelCase en todos los campos
- [ ] Confirmar que NO envían `empresaId` en el body (viene de la URL)
- [ ] Si no asignan activo, usar `null` no `""` (string vacío)

Endpoints a probar:
- [ ] GET /api/empresas/85/usuarios (debería devolver array vacío o con usuarios)
- [ ] POST /api/empresas/85/usuarios (con payload correcto)
- [ ] GET /api/empresas/85/usuarios/:id (debería devolver el usuario creado)

---

## ✅ 8. COMPARTIR ESTOS LOGS

Por favor copien y peguen:

1. **Log de inicio del servidor:**
```
[Al ejecutar npx ts-node src/server/index.ts]
```

2. **Log del GET:**
```
[Al hacer GET /api/empresas/85/usuarios]
```

3. **Log del POST:**
```
[Al hacer POST /api/empresas/85/usuarios con el payload correcto]
```

4. **Payload exacto que están enviando:**
```json
{
  "sedeId": "...",
  "nombreCompleto": "...",
  ...
}
```

---

## 🎯 RESUMEN EJECUTIVO

**FORMATOS:**
- ✅ **REQUEST:** camelCase → `sedeId`, `nombreCompleto`, `activoAsignadoId`
- ✅ **RESPONSE:** camelCase → `sedeId`, `nombreCompleto`, `activoAsignadoId`
- ❌ **NUNCA:** snake_case → `sede_id`, `nombre_completo`, `activo_asignado_id`

**ACCIÓN INMEDIATA:**
1. Reiniciar servidor backend
2. Usar payload en camelCase
3. Compartir logs completos si hay error

**UBICACIÓN DEL CÓDIGO:**
- Controller: `src/modules/empresas/controllers/usuario-empresa.controller.ts`
- Repository: `src/modules/empresas/repositories/usuario-empresa.repository.ts`
- Models: `src/modules/empresas/models/usuario-empresa.model.ts`
- Routes: Registradas en `src/server/index.ts` línea ~38
