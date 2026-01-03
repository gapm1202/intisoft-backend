# Corrección: Campo estado_contrato en empresas

## Problema Original

Al crear una nueva empresa, el campo `estado_contrato` se guardaba automáticamente como "Activo" debido a un valor por defecto en la base de datos. Esto causaba que empresas sin contrato configurado permitieran incorrectamente la creación de tickets.

## Solución Implementada

### 1. Eliminación del valor por defecto en la base de datos
**Archivo**: `migrations/059_remove_default_estado_contrato.sql`
- Removido el DEFAULT 'Activo' de la columna `estado_contrato` en tabla `empresas`
- Actualizado empresas existentes sin contrato a `estado_contrato = NULL`

### 2. Actualización del constraint CHECK
**Archivo**: `migrations/060_update_estado_contrato_constraint.sql`
- Actualizado constraint para aceptar valores en minúscula: `'activo'`, `'suspendido'`, `'vencido'`, `'historico'`
- Convertido valores existentes de mayúscula inicial a minúscula para consistencia con tabla `contracts`
- Permitido `NULL` como valor válido

### 3. Modificación del repository de empresas
**Archivo**: `src/modules/empresas/repositories/empresa.repository.ts`
- Removido el campo `estado_contrato` del INSERT al crear empresas
- Las empresas nuevas ahora se crean con `estado_contrato = NULL`

### 4. Cálculo automático del estado en contracts
**Archivo**: `src/modules/empresas/services/contract.service.ts`
- Mejorada lógica de cálculo en `createContract()`:
  - Si `estadoContrato` manual = 'suspendido' → se respeta
  - Si `fechaFin < hoy` → 'vencido'
  - Si `fechaInicio <= hoy <= fechaFin` → 'activo'
  - Normalización de fechas a medianoche para comparaciones precisas

### 5. Sincronización de estado_contrato entre tablas
**Archivo**: `src/modules/empresas/repositories/contract.repository.ts`

Agregadas actualizaciones de `estado_contrato` en tabla `empresas` en:

1. **Al crear contrato** (`createContract`):
   ```sql
   UPDATE empresas SET estado_contrato = $1 WHERE id = $2
   ```

2. **Al cambiar estado manualmente** (`updateEstado`):
   ```sql
   UPDATE empresas SET estado_contrato = $1 WHERE id = $2
   ```

3. **Al vencer automáticamente** (`expireIfNeeded`):
   ```sql
   UPDATE empresas SET estado_contrato = 'vencido' WHERE id = $1
   ```

## Flujo de Trabajo Corregido

### Creación de Empresa
1. Usuario crea empresa desde frontend
2. Backend inserta registro sin especificar `estado_contrato`
3. Base de datos asigna `NULL` (sin valor por defecto)
4. ✅ Empresa creada con `estado_contrato = NULL`

### Configuración de Contrato
1. Usuario abre pestaña "Contrato" y configura fechas
2. Frontend envía datos del contrato
3. Backend calcula `estado_contrato`:
   - Valida fechas (fechaFin >= fechaInicio)
   - Normaliza a medianoche
   - Aplica lógica: vencido/activo/suspendido
4. Backend inserta en tabla `contracts` con estado calculado
5. Backend actualiza tabla `empresas` con el mismo estado
6. ✅ Ambas tablas sincronizadas con estado correcto

### Validación Frontend
El frontend ahora puede validar correctamente:
```javascript
if (empresa.estadoContrato === null) {
  // Empresa sin contrato - BLOQUEAR creación de tickets
  mostrarMensaje("Configure el contrato antes de crear tickets");
} else if (empresa.estadoContrato === 'activo') {
  // Contrato activo - PERMITIR tickets
} else {
  // Contrato vencido/suspendido - BLOQUEAR
}
```

## Archivos Modificados

### Migraciones SQL
- `migrations/059_remove_default_estado_contrato.sql` - Remover DEFAULT
- `migrations/060_update_estado_contrato_constraint.sql` - Actualizar constraint

### Código TypeScript
- `src/modules/empresas/repositories/empresa.repository.ts` - Remover campo del INSERT
- `src/modules/empresas/services/contract.service.ts` - Mejorar cálculo de estado
- `src/modules/empresas/repositories/contract.repository.ts` - Sincronizar con tabla empresas

### Scripts de Prueba
- `scripts/run_migration_059.js` - Ejecutar migración 059
- `scripts/run_migration_060.js` - Ejecutar migración 060
- `scripts/test_estado_db.js` - Verificar funcionamiento completo

## Resultados de Pruebas

```
✅ TODOS LOS TESTS PASARON

📝 Resumen de la corrección implementada:
   1. ✅ Campo estado_contrato removido del INSERT de empresas
   2. ✅ Empresas nuevas tienen estado_contrato = NULL
   3. ✅ estado_contrato se actualiza en empresas al crear contrato
   4. ✅ Cálculo: fechaFin < hoy → vencido, en rango → activo
```

## Lógica de Cálculo del Estado

### Estados Posibles
- `null` - Empresa sin contrato configurado
- `'activo'` - Contrato vigente (hoy entre fechaInicio y fechaFin)
- `'vencido'` - Contrato expirado (fechaFin < hoy)
- `'suspendido'` - Estado manual establecido por usuario
- `'historico'` - Contrato archivado

### Reglas de Cálculo
1. **Manual = Suspendido**: Si usuario establece manualmente como suspendido, se respeta
2. **Vencido**: Si `fechaFin < hoy` → automáticamente 'vencido'
3. **Activo**: Si `fechaInicio <= hoy <= fechaFin` → 'activo'
4. **Sin fechas**: Sin `fechaFin` no se asigna estado automático

### Sincronización Automática
- Al crear contrato → se actualiza `empresas.estado_contrato`
- Al cambiar estado → se actualiza `empresas.estado_contrato`
- Al vencer (job automático) → se actualiza `empresas.estado_contrato`

## Impacto en el Sistema

### ✅ Ventajas
1. **Validación precisa**: Frontend puede bloquear tickets sin contrato
2. **Consistencia**: Valores minúsculas en todas las tablas
3. **Transparencia**: Estado NULL indica explícitamente "sin contrato"
4. **Sincronización**: Tablas `contracts` y `empresas` siempre alineadas

### ⚠️ Consideraciones
- Empresas existentes sin contrato fueron actualizadas a `estado_contrato = NULL`
- El constraint ahora solo acepta minúsculas ('activo' no 'Activo')
- El estado se calcula automáticamente, no se puede establecer manualmente excepto 'suspendido'

## Comandos de Migración

```bash
# Ejecutar migración 059 (remover DEFAULT)
node scripts/run_migration_059.js

# Ejecutar migración 060 (actualizar constraint)
node scripts/run_migration_060.js

# Verificar con test
node scripts/test_estado_db.js
```

## Validación Post-Migración

```sql
-- Verificar que el DEFAULT fue removido
SELECT column_default 
FROM information_schema.columns 
WHERE table_name = 'empresas' AND column_name = 'estado_contrato';
-- Resultado esperado: NULL

-- Verificar constraint actualizado
SELECT pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'chk_estado_contrato';
-- Debe incluir: 'activo', 'suspendido', 'vencido', 'historico' OR NULL

-- Contar empresas sin contrato
SELECT COUNT(*) 
FROM empresas 
WHERE estado_contrato IS NULL;
```
