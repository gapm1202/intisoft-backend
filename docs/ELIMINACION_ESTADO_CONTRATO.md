# Eliminación de estado_contrato de tabla empresas

## Cambio Implementado

Se eliminó **completamente** el campo `estado_contrato` de la tabla `empresas`. El estado del contrato ahora reside únicamente en la tabla `contracts`, donde pertenece lógicamente.

## Razón del Cambio

Una empresa puede tener múltiples contratos a lo largo del tiempo (históricos, renovaciones, etc.). El estado del contrato es una propiedad del **contrato específico**, no de la empresa en sí. Mantener `estado_contrato` en la tabla `empresas` causaba:

1. **Redundancia de datos** - Información duplicada en dos tablas
2. **Inconsistencias** - Posibilidad de desincronización entre tablas
3. **Diseño incorrecto** - Violación de principios de normalización

## Archivos Modificados

### 1. Migración SQL
**Archivo**: `migrations/061_drop_estado_contrato_from_empresas.sql`
```sql
-- Eliminar constraint relacionado
ALTER TABLE empresas 
  DROP CONSTRAINT IF EXISTS chk_estado_contrato;

-- Eliminar la columna
ALTER TABLE empresas 
  DROP COLUMN IF EXISTS estado_contrato;
```

### 2. Modelo de Datos
**Archivo**: `src/modules/empresas/models/empresa.model.ts`

**Antes**:
```typescript
export interface Empresa {
  id?: number;
  nombre: string;
  ...
  estadoContrato?: 'Activo' | 'Suspendido' | 'No renovado';
  ...
}
```

**Después**:
```typescript
export interface Empresa {
  id?: number;
  nombre: string;
  ...
  // estadoContrato REMOVIDO
  ...
}
```

### 3. Repository de Empresas
**Archivo**: `src/modules/empresas/repositories/empresa.repository.ts`

**Cambios**:
- Removido `estado_contrato` de `RETURNING_FIELDS`
- Removido de la función `updateById()` (query y parámetros)

**Antes**:
```typescript
const RETURNING_FIELDS = `..., estado_contrato AS "estadoContrato", ...`;
```

**Después**:
```typescript
const RETURNING_FIELDS = `..., pagina_web AS "paginaWeb", contactos_admin ...`;
```

### 4. Service de Empresas
**Archivo**: `src/modules/empresas/services/empresa.service.ts`

**Agregado** - Incluir contrato activo al obtener empresa:

```typescript
export const getEmpresa = async (id: number): Promise<Empresa | null> => {
  const empresa = await repo.getById(id);
  if (!empresa) return null;
  
  // attach sedes (ya existía)
  try {
    const sedes = await sedeService.listSedes(id);
    (empresa as any).sedes = sedes;
  } catch (err) {
    console.error('Could not load sedes for empresa', id, err);
  }
  
  // ✅ NUEVO: attach contrato activo (incluye estado_contrato)
  try {
    const contratoActivoId = await contractRepo.getActiveByEmpresa(id);
    if (contratoActivoId) {
      const contrato = await contractRepo.getByIdWithDetails(contratoActivoId);
      (empresa as any).contrato = contrato;
    } else {
      (empresa as any).contrato = null;
    }
  } catch (err) {
    console.error('Could not load contrato for empresa', id, err);
    (empresa as any).contrato = null;
  }
  
  return empresa;
};
```

### 5. Repository de Contratos
**Archivo**: `src/modules/empresas/repositories/contract.repository.ts`

**Removido** - Las 3 sincronizaciones de `estado_contrato` con tabla empresas:
1. En `createContract()` - Ya no actualiza `empresas.estado_contrato`
2. En `updateEstado()` - Ya no sincroniza el estado
3. En `expireIfNeeded()` - Ya no actualiza cuando vence

Estas actualizaciones eran innecesarias porque el estado ahora solo vive en `contracts`.

## Estructura de Respuesta de la API

### GET /api/empresas/:id

**Respuesta con contrato activo**:
```json
{
  "id": 85,
  "nombre": "OBRASIN SAC",
  "codigo": "OBR",
  "codigoCliente": "CLI-001",
  "ruc": "2056235667",
  "ciudad": "Lima",
  "contrato": {
    "id": 67,
    "empresaId": 85,
    "tipoContrato": "servicios",
    "estadoContrato": "activo",
    "fechaInicio": "2025-12-30",
    "fechaFin": "2026-02-28",
    "renovacionAutomatica": false,
    "responsableComercial": "Juan Pérez"
  },
  "sedes": [...]
}
```

**Respuesta sin contrato activo**:
```json
{
  "id": 86,
  "nombre": "Empresa Nueva",
  "codigo": "NUE",
  "codigoCliente": "CLI-002",
  "ciudad": "Quito",
  "contrato": null,
  "sedes": []
}
```

## Validación Frontend

El frontend ahora puede validar correctamente el estado del contrato:

```typescript
interface EmpresaResponse {
  id: number;
  nombre: string;
  // ... otros campos
  contrato: {
    estadoContrato: 'activo' | 'suspendido' | 'vencido' | 'historico';
    fechaInicio: string;
    fechaFin: string;
    // ... otros campos del contrato
  } | null;
}

// Validación para permitir/bloquear creación de tickets
function puedeCrearTickets(empresa: EmpresaResponse): boolean {
  if (empresa.contrato === null) {
    // Sin contrato configurado - BLOQUEAR
    return false;
  }
  
  if (empresa.contrato.estadoContrato === 'activo') {
    // Contrato activo - PERMITIR
    return true;
  }
  
  // Contrato vencido o suspendido - BLOQUEAR
  return false;
}
```

## Migración de Datos

La migración fue ejecutada exitosamente:

```bash
node scripts/run_migration_061.js
```

**Resultado**:
```
✅ Conectado a la base de datos
📋 Ejecutando migración 061: Eliminar estado_contrato de empresas...
✅ Migración 061 completada exitosamente
✅ Columna estado_contrato eliminada correctamente de tabla empresas

📋 Columnas actuales en tabla empresas:
   - id
   - nombre
   - creado_en
   - ruc
   - ciudad
   - provincia
   - tipo_empresa
   - direccion_fiscal
   - direccion_operativa
   - pagina_web
   - contactos_tecnicos
   - codigo
   - codigo_cliente
   - observaciones_generales
   - autorizacion_facturacion
   - contactos_admin
```

## Verificación

### Test de Base de Datos
```bash
node scripts/verify_estado_removed.js
```

✅ Confirma que `estado_contrato` no existe en tabla `empresas`

### Test de Estructura API
```bash
node scripts/test_api_response_estructura.js
```

✅ Confirma que:
- `empresa.estadoContrato` = `undefined`
- `empresa.contrato` existe como objeto o `null`
- `empresa.contrato.estadoContrato` contiene el estado cuando hay contrato activo

## Impacto en el Sistema

### ✅ Beneficios
1. **Diseño correcto**: Estado del contrato donde pertenece (tabla `contracts`)
2. **Sin redundancia**: Eliminada duplicación de datos
3. **Sin inconsistencias**: Imposible desincronización
4. **Flexibilidad**: Soporta múltiples contratos históricos por empresa
5. **Claridad**: El frontend recibe explícitamente el contrato activo

### ⚠️ Cambios Requeridos en Frontend
El frontend debe actualizar la validación de estado de contrato:

**Antes**:
```typescript
if (empresa.estadoContrato === 'Activo') {
  // Permitir crear ticket
}
```

**Después**:
```typescript
if (empresa.contrato?.estadoContrato === 'activo') {
  // Permitir crear ticket
}
```

## Endpoints Afectados

### GET /api/empresas/:id
- ✅ Ahora incluye objeto `contrato` con el contrato activo
- ✅ `contrato = null` cuando no hay contrato activo
- ✅ Ya NO incluye campo `estadoContrato` en la empresa

### POST /api/empresas
- ✅ Ya NO inicializa `estado_contrato`
- ✅ Empresa creada sin contrato (validación correcta)

### PUT /api/empresas/:id
- ✅ Ya NO permite actualizar `estado_contrato`
- ✅ El estado solo se gestiona desde `/contracts`

## Estado en Tabla Contracts

El campo `estado_contrato` permanece en la tabla `contracts` con su lógica completa:

- ✅ Se calcula automáticamente según fechas
- ✅ Valores: `'activo'`, `'vencido'`, `'suspendido'`, `'historico'`
- ✅ Job automático vence contratos expirados
- ✅ Historial de cambios registrado en `contract_history`

## Resumen de Cambios

| Aspecto | Antes | Después |
|---------|-------|---------|
| **Columna en DB** | `empresas.estado_contrato` existe | Columna eliminada |
| **Modelo TypeScript** | `Empresa.estadoContrato` | Campo removido |
| **API Response** | `{ estadoContrato: "Activo" }` | `{ contrato: { estadoContrato: "activo" } }` |
| **Sin contrato** | `estadoContrato = "Activo"` (incorrecto) | `contrato = null` (correcto) |
| **Validación FE** | `empresa.estadoContrato === "Activo"` | `empresa.contrato?.estadoContrato === "activo"` |

## Comandos de Ejecución

```bash
# Ejecutar migración
node scripts/run_migration_061.js

# Verificar eliminación de columna
node scripts/verify_estado_removed.js

# Verificar estructura de respuesta API
node scripts/test_api_response_estructura.js
```

## Reversión (No Recomendada)

Si por alguna razón se necesita revertir:

```sql
-- NO RECOMENDADO: Agregar nuevamente la columna
ALTER TABLE empresas 
  ADD COLUMN estado_contrato VARCHAR(50) DEFAULT NULL;

ALTER TABLE empresas 
  ADD CONSTRAINT chk_estado_contrato 
  CHECK (estado_contrato IN ('activo', 'suspendido', 'vencido', 'historico') OR estado_contrato IS NULL);
```

**Nota**: La reversión requeriría también revertir todos los cambios de código.
