# 🔄 SINCRONIZACIÓN BIDIRECCIONAL USUARIO ↔ ACTIVO - IMPLEMENTACIÓN COMPLETA

## ✅ MODIFICACIONES IMPLEMENTADAS

### **🔧 Triggers de Base de Datos (CLAVE)**

Se crearon **triggers de PostgreSQL** para garantizar la sincronización bidireccional automática:

**Migración 065:** `migrations/065_create_sync_triggers.sql`

1. **`trigger_sync_usuario_to_inventario`** en `usuarios_empresas`:
   - Se activa cuando cambia `activo_asignado_id`
   - Actualiza automáticamente `inventario.usuario_asignado_id`
   - Libera activo anterior si el usuario tenía uno
   - Libera otros usuarios si el nuevo activo estaba asignado

2. **`trigger_sync_inventario_to_usuario`** en `inventario`:
   - Se activa cuando cambia `usuario_asignado_id`
   - Actualiza automáticamente `usuarios_empresas.activo_asignado_id`
   - Libera usuario anterior si el activo tenía uno
   - Libera otros activos si el nuevo usuario tenía uno

**Ejecutar triggers:**
```bash
node scripts/run_migration_065.js
```

**Verificar triggers:**
```sql
SELECT trigger_name, event_object_table, action_timing, event_manipulation
FROM information_schema.triggers 
WHERE trigger_name LIKE 'trigger_sync%';
```

---

### 1️⃣ **Endpoint Nuevo: Filtrar usuarios por sede**

**Endpoint:**
```
GET /api/empresas/:empresaId/usuarios?sedeId=:sedeId
```

**Parámetros:**
- `empresaId` (path): ID de la empresa
- `sedeId` (query, opcional): ID de la sede para filtrar
- `incluirInactivos` (query, opcional): `true` para incluir usuarios inactivos

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "_id": "1",
      "nombreCompleto": "Juan Pérez",
      "correo": "juan@ejemplo.com",
      "cargo": "Gerente",
      "sedeId": "34",
      "sedeName": "Sede Principal",
      "activoAsignadoId": "89",
      "activoCodigo": "AC-2024-0001",
      "activoNombre": "Laptop",
      "activoModelo": "Dell XPS 15",
      "activo": true
    }
  ]
}
```

**Ejemplos de uso:**
```javascript
// Todos los usuarios de la empresa 85
GET /api/empresas/85/usuarios

// Solo usuarios de la sede 34
GET /api/empresas/85/usuarios?sedeId=34

// Usuarios inactivos de la sede 34
GET /api/empresas/85/usuarios?sedeId=34&incluirInactivos=true
```

---

### 2️⃣ **Sincronización Bidireccional desde Inventario**

**Endpoint:**
```
PUT /api/empresas/:empresaId/inventario/:sedeId/:activoId
```

**Body (camelCase):**
```json
{
  "usuarioAsignadoId": "15"
}
```

**¿Qué hace el backend automáticamente?**

1. ✅ Actualiza `inventario.usuario_asignado_id = 15`
2. ✅ Actualiza `usuarios_empresas.activo_asignado_id = :activoId` WHERE `id = 15`
3. ✅ **Si el usuario YA tenía otro activo asignado**, libera la relación anterior:
   - `usuarios_empresas.activo_asignado_id` del usuario 15 se actualiza
   - El activo anterior (si existía) queda con `usuario_asignado_id = NULL`
4. ✅ **Si otro usuario tenía este activo**, lo libera:
   - Encuentra usuarios con `activo_asignado_id = :activoId`
   - Los actualiza a `activo_asignado_id = NULL`

**Logs que verán:**
```
[INVENTARIO-SYNC] 🔄 Sincronización bidireccional activo ↔ usuario
[INVENTARIO-SYNC] Usuario anterior: null
[INVENTARIO-SYNC] Usuario nuevo: 15
[INVENTARIO-SYNC] 🔍 Verificando si otro usuario tenía este activo: 89
[INVENTARIO-SYNC] ✅ Asignando activo a usuario: 15
[INVENTARIO-SYNC] 🎉 Sincronización completada exitosamente
```

---

### 3️⃣ **Sincronización Bidireccional desde Usuario (MEJORADA)**

**Endpoint:**
```
PUT /api/empresas/:empresaId/usuarios/:usuarioId
```

**Body (camelCase):**
```json
{
  "activoAsignadoId": "89"
}
```

**¿Qué hace el backend automáticamente?**

1. ✅ Actualiza `usuarios_empresas.activo_asignado_id = 89`
2. ✅ Actualiza `inventario.usuario_asignado_id = :usuarioId` WHERE `id = 89`
3. ✅ **Si el usuario YA tenía otro activo asignado**, libera el activo anterior:
   - Busca el `activo_asignado_id` anterior del usuario
   - Actualiza `inventario.usuario_asignado_id = NULL` en el activo anterior
4. ✅ **Si el nuevo activo YA estaba asignado a otro usuario**, lo libera:
   - Busca el `usuario_asignado_id` del activo 89
   - Actualiza `usuarios_empresas.activo_asignado_id = NULL` en ese usuario

**Logs que verán:**
```
[USUARIO-EMPRESA] 🔄 Iniciando transacción UPDATE, usuario ID: 5
[USUARIO-EMPRESA] 🔓 Liberando activo anterior ID: 50
[USUARIO-EMPRESA] ✅ Activo anterior liberado
[USUARIO-EMPRESA] 📤 Nuevo activo ya estaba asignado a usuario: 10 - Liberando...
[USUARIO-EMPRESA] ✅ Otro usuario liberado
[USUARIO-EMPRESA] 🔗 Asignando nuevo activo ID: 89 a usuario ID: 5
[USUARIO-EMPRESA] ✅ Nuevo activo asignado
[USUARIO-EMPRESA] ✅ Transacción UPDATE completada
```

---

### 4️⃣ **Sincronización en Creación de Usuario (MEJORADA)**

**Endpoint:**
```
POST /api/empresas/:empresaId/usuarios
```

**Body:**
```json
{
  "sedeId": "34",
  "nombreCompleto": "Carlos López",
  "correo": "carlos@empresa.com",
  "cargo": "Técnico",
  "activoAsignadoId": "89"
}
```

**¿Qué hace el backend automáticamente?**

1. ✅ Crea el usuario en `usuarios_empresas` con `activo_asignado_id = 89`
2. ✅ **Si el activo YA estaba asignado a otro usuario**, lo libera primero:
   - Busca el `usuario_asignado_id` del activo 89
   - Actualiza `usuarios_empresas.activo_asignado_id = NULL` en ese usuario
3. ✅ Actualiza `inventario.usuario_asignado_id = nuevo_usuario_id` WHERE `id = 89`

**Logs que verán:**
```
[USUARIO-EMPRESA] 🔄 Iniciando transacción CREATE
[USUARIO-EMPRESA] ✅ Usuario insertado, ID: 15
[USUARIO-EMPRESA] 🎯 Activo asignado: 89
[USUARIO-EMPRESA] 📤 Activo ya estaba asignado a usuario: 10 - Liberando...
[USUARIO-EMPRESA] ✅ Usuario anterior liberado
[USUARIO-EMPRESA] ✅ Activo asignado en inventario
[USUARIO-EMPRESA] 🎉 Transacción CREATE completada exitosamente
```

---

## 📋 LÓGICA DE NEGOCIO IMPLEMENTADA

### ✅ Reglas de Sincronización (AUTOMÁTICAS via Triggers)

1. **Un usuario puede tener solo 1 activo asignado**
   - Si se le asigna un nuevo activo, el anterior se libera **AUTOMÁTICAMENTE**
   - Funciona con UPDATE directo a la BD o via API

2. **Un activo puede tener solo 1 usuario asignado**
   - Si se asigna a un nuevo usuario, el anterior se libera **AUTOMÁTICAMENTE**
   - Funciona con UPDATE directo a la BD o via API

3. **Las asignaciones funcionan desde ambas entidades:**
   - Actualizar `usuarios_empresas.activo_asignado_id` → trigger sincroniza `inventario.usuario_asignado_id`
   - Actualizar `inventario.usuario_asignado_id` → trigger sincroniza `usuarios_empresas.activo_asignado_id`

4. **Liberación automática:**
   - Al asignar, si había relaciones anteriores, se limpian automáticamente
   - Los triggers garantizan consistencia sin necesidad de transacciones en el backend

5. **Backend también sincroniza:**
   - El service de inventario tiene código de sincronización adicional
   - El repository de usuarios tiene código de sincronización adicional
   - Esto es una capa extra de seguridad, pero los triggers ya lo garantizan

---

## 🧪 EJEMPLOS DE FLUJOS

### **Escenario 1: Asignar activo a usuario nuevo**

```
Estado inicial:
- Usuario A: sin activo
- Activo X: sin usuario

Acción: PUT /api/empresas/85/usuarios/A { "activoAsignadoId": "X" }

Estado final:
- Usuario A: activo_asignado_id = X
- Activo X: usuario_asignado_id = A
```

### **Escenario 2: Cambiar activo de un usuario**

```
Estado inicial:
- Usuario A: activo_asignado_id = X
- Usuario B: sin activo
- Activo X: usuario_asignado_id = A
- Activo Y: sin usuario

Acción: PUT /api/empresas/85/usuarios/A { "activoAsignadoId": "Y" }

Estado final:
- Usuario A: activo_asignado_id = Y
- Usuario B: sin activo
- Activo X: usuario_asignado_id = NULL (liberado)
- Activo Y: usuario_asignado_id = A
```

### **Escenario 3: Reasignar activo desde inventario**

```
Estado inicial:
- Usuario A: activo_asignado_id = X
- Usuario B: sin activo
- Activo X: usuario_asignado_id = A

Acción: PUT /api/empresas/85/inventario/sede123/X { "usuarioAsignadoId": "B" }

Estado final:
- Usuario A: activo_asignado_id = NULL (liberado)
- Usuario B: activo_asignado_id = X
- Activo X: usuario_asignado_id = B
```

### **Escenario 4: Liberar asignación**

```
Estado inicial:
- Usuario A: activo_asignado_id = X
- Activo X: usuario_asignado_id = A

Acción: PUT /api/empresas/85/usuarios/A { "activoAsignadoId": null }

Estado final:
- Usuario A: activo_asignado_id = NULL
- Activo X: usuario_asignado_id = NULL
```

---

## 🔍 VERIFICACIÓN

### Script de Pruebas

**IMPORTANTE:** Primero ejecutar la migración de triggers:
```bash
node scripts/run_migration_065.js
```

Luego ejecutar las pruebas:
```bash
node scripts/test_sincronizacion_usuario_activo.js
```

Este script prueba:
- ✅ Asignar activo desde usuario (UPDATE directo a usuarios_empresas)
- ✅ Asignar usuario desde inventario (UPDATE directo a inventario)
- ✅ Liberación automática al cambiar
- ✅ Sincronización bidireccional completa via triggers
- ✅ Manejo de NULL

### Logs Esperados

**Si todo está correcto:**
```
🧪 INICIANDO PRUEBAS DE SINCRONIZACIÓN BIDIRECCIONAL

📋 SETUP: Creando datos de prueba...
✅ Empresa: 85, Sede: 34
✅ Usuario 1 creado: ID 6
✅ Usuario 2 creado: ID 7
✅ Activo 1 creado: ID 55 (TEST-SYNC-001)
✅ Activo 2 creado: ID 56 (TEST-SYNC-002)

🧪 PRUEBA 1: Asignar Activo 1 a Usuario 1 desde usuarios_empresas
✅ PASÓ: Usuario 1 → Activo 1 (bidireccional)

🧪 PRUEBA 2: Asignar Usuario 2 a Activo 1 desde inventario (debe liberar Usuario 1)
✅ PASÓ: Usuario 1 liberado, Usuario 2 → Activo 1

🧪 PRUEBA 3: Asignar Activo 2 a Usuario 1 (debe liberar Activo 1 de Usuario 2)
✅ PASÓ: Usuario 1 → Activo 2, Usuario 2 → Activo 1

🧪 PRUEBA 4: Liberar Usuario 1 poniendo activo_asignado_id = NULL
✅ PASÓ: Usuario 1 y Activo 2 liberados correctamente

🎉 PRUEBAS COMPLETADAS
```

---

## 📄 ARCHIVOS MODIFICADOS/CREADOS

### Database:

1. **Migrations:**
   - `migrations/064_create_usuarios_empresas.sql` - Tabla usuarios_empresas + campo usuario_asignado_id en inventario
   - `migrations/065_create_sync_triggers.sql` - **Triggers de sincronización bidireccional automática**

2. **Scripts:**
   - `scripts/run_migration_064.js` - Ejecutar migración de tablas
   - `scripts/run_migration_065.js` - **Ejecutar migración de triggers (IMPORTANTE)**
   - `scripts/test_sincronizacion_usuario_activo.js` - Script de pruebas completas

### Backend Files:

1. **Models:**
   - `src/modules/empresas/models/usuario-empresa.model.ts` - 3 interfaces con _id field
   - `src/modules/empresas/models/inventario.model.ts` - Agregado `usuarioAsignadoId` y `usuarioAsignadoData`

2. **Controllers:**
   - `src/modules/empresas/controllers/usuario-empresa.controller.ts` - Agregado filtro `sedeId`

3. **Services:**
   - `src/modules/empresas/services/usuario-empresa.service.ts` - Agregado parámetro `sedeId`
   - `src/modules/empresas/services/inventario.service.ts` - Agregada sincronización bidireccional (capa extra)

4. **Repositories:**
   - `src/modules/empresas/repositories/usuario-empresa.repository.ts`:
     - Agregado filtro dinámico por sede
     - Sincronización en CREATE (libera usuario anterior del activo)
     - Sincronización en UPDATE (libera usuario anterior del activo)
   - `src/modules/empresas/repositories/inventario.repository.ts`:
     - Agregado LEFT JOIN usuarios_empresas en 3 queries
     - Agregado campos usuarioAsignadoId y usuarioAsignadoData
   
5. **Docs:**
   - `docs/SINCRONIZACION_USUARIO_ACTIVO.md` - **Este documento (documentación completa)**
   - `docs/RESPUESTA_FORMATOS_FRONTEND.md` - Formatos de campos esperados

---

## 🚀 ACCIÓN INMEDIATA PARA EL FRONTEND

### ⚠️ PASO CRÍTICO: Ejecutar migración de triggers

**ANTES DE PROBAR**, ejecutar:
```bash
node scripts/run_migration_065.js
```

Esto instala los triggers de PostgreSQL que garantizan la sincronización bidireccional automática.

### 1. Verificar triggers instalados:
```sql
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name LIKE 'trigger_sync%';
```

Deben aparecer:
- `trigger_sync_usuario_to_inventario` en `usuarios_empresas`
- `trigger_sync_inventario_to_usuario` en `inventario`

### 2. Reiniciar el servidor backend:
```bash
npx ts-node src/server/index.ts
```

### 3. Probar el endpoint nuevo:
```bash
GET /api/empresas/85/usuarios?sedeId=34
```

### 4. Probar sincronización desde inventario:
```bash
PUT /api/empresas/85/inventario/sedeId/activoId
Body: { "usuarioAsignadoId": "15" }
```

### 5. Probar sincronización desde usuario:
```bash
PUT /api/empresas/85/usuarios/15
Body: { "activoAsignadoId": "89" }
```

### 6. Verificar logs en consola del backend:
- Deben ver emojis: 🔄, ✅, 📤, 🔗, 🎯
- Deben ver "Sincronización completada exitosamente"
- No deben ver errores ni ROLLBACK

### 7. Ejecutar script de pruebas:
```bash
node scripts/test_sincronizacion_usuario_activo.js
```

Todas las pruebas deben mostrar: ✅ PASÓ

---

## ⚠️ IMPORTANTE

- **Formato de campos:** TODO en camelCase (`usuarioAsignadoId`, `activoAsignadoId`, `sedeId`)
- **Transacciones:** Todo se ejecuta en transacciones, si falla algo se hace ROLLBACK
- **NULL vs ""**: Para liberar una asignación, usar `null` NO string vacío `""`
- **IDs:** Siempre strings en el JSON, el backend los convierte a integers

---

## 📞 SOPORTE

Si algo no funciona:

1. Reiniciar el servidor backend
2. Compartir los logs completos de la consola
3. Compartir el payload exacto que están enviando
4. Ejecutar `node scripts/test_sincronizacion_usuario_activo.js` y compartir resultado
