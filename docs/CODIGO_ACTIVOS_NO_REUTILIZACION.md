# Sistema de Códigos de Activos - No Reutilización

## 📌 Estado Actual

El sistema **YA IMPLEMENTA** correctamente el mecanismo de no reutilización de códigos mediante la tabla `activos_codigo_sequence`.

## 🔧 Cómo Funciona

### 1. Tabla de Secuencias (`activos_codigo_sequence`)

```sql
CREATE TABLE activos_codigo_sequence (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER NOT NULL,
    categoria_id INTEGER NOT NULL,
    next_number INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(empresa_id, categoria_id)
);
```

**Campo clave: `next_number`**
- Se incrementa con cada reserva de código
- **NUNCA se decrementa**, incluso si el activo se elimina
- Garantiza unicidad histórica de códigos

### 2. Flujo de Generación de Código

```
1. Frontend crea activo sin código
   ↓
2. Backend llama a codigoService.getNextCode(empresaId, categoriaId)
   ↓
3. reserveNextCode() en activos_codigo.repository.ts:
   - Lee next_number actual (ej: 5)
   - Genera código: OBR-PC0005
   - Incrementa next_number a 6
   - Crea registro en activos_codigo_reserved
   ↓
4. Backend crea activo con código OBR-PC0005
   ↓
5. confirmReservation() marca la reserva como confirmada
```

### 3. Escenario de Eliminación

**Situación:**
- OBRASIN tiene: OBR-PC0001, OBR-PC0002, OBR-PC0003
- next_number = 4
- Se elimina OBR-PC0003

**Resultado:**
- next_number sigue siendo 4 (NO decrementa)
- Siguiente código será OBR-PC0004 (NO reutiliza 0003)

## ✅ Verificación del Estado Actual

```bash
# Ver secuencias de OBRASIN (empresa_id = 72)
psql -h localhost -U postgres -d inticorp -c \
  "SELECT e.nombre, c.nombre as categoria, s.next_number 
   FROM activos_codigo_sequence s 
   JOIN empresas e ON s.empresa_id = e.id 
   JOIN categorias c ON s.categoria_id = c.id 
   WHERE s.empresa_id = 72;"
```

**Resultado actual:**
```
 empresa | categoria | next_number
---------+-----------+-------------
 OBRASIN | Laptop    |           5
 OBRASIN | PC        |           4
```

Esto significa:
- Próximo PC será: `OBR-PC0004`
- Próximo Laptop será: `OBR-LA0005`

## ⚠️ Función Legacy: createInventarioWithGeneratedAsset

**IMPORTANTE:** Existe una función en `inventario.repository.ts` que usa `MAX()`:

```typescript
export const createInventarioWithGeneratedAsset = async (
  prefix: string, 
  inv: Inventario
): Promise<Inventario>
```

**Estado:**
- ❌ NO se usa en el flujo normal de creación
- ❌ Solo existe en scripts de prueba
- ⚠️ Esta función SÍ reutilizaría códigos si se usara

**Recomendación:**
- Marcar como `@deprecated`
- Eliminar o actualizar para usar el sistema de secuencias

## 🔐 Protecciones Implementadas

### 1. Transacciones Serializables
```typescript
await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');
```
Previene condiciones de carrera en ambientes concurrentes.

### 2. Row Locking (FOR UPDATE)
```typescript
SELECT * FROM activos_codigo_sequence 
WHERE empresa_id = $1 AND categoria_id = $2 
FOR UPDATE
```
Bloquea la fila durante la transacción.

### 3. Validación de Unicidad
```typescript
const exists = await repo.checkAssetIdExists(finalAssetId);
if (exists) {
  throw new Error("assetId ya existe (conflicto 409)");
}
```

## 📊 Diagnóstico del Problema Reportado

Si se reporta reutilización de códigos, verificar:

### 1. ¿Se está usando el flujo correcto?
```bash
# Buscar en logs del servidor
grep "Código oficial reservado automáticamente" logs/*.log
```

Debe aparecer:
```
🔐 Código oficial reservado automáticamente: OBR-PC0004 (reservation_id: 15)
```

### 2. ¿La secuencia está sincronizada?
```sql
-- Obtener el máximo código existente
SELECT MAX(
  regexp_replace(asset_id, '^.*-(\\d+)$', '\\1')::INTEGER
) 
FROM inventario 
WHERE empresa_id = 72 AND categoria = 'PC';

-- Comparar con next_number
SELECT next_number 
FROM activos_codigo_sequence 
WHERE empresa_id = 72 AND categoria_id = 27;
```

**next_number debe ser >= MAX + 1**

### 3. ¿Se eliminaron registros de activos_codigo_sequence?

```sql
-- Verificar historial de actualizaciones
SELECT * FROM activos_codigo_sequence 
WHERE empresa_id = 72 
ORDER BY updated_at DESC;
```

## 🛠️ Script de Reparación (Si es necesario)

Si se detecta desincronización:

```sql
-- Para cada empresa/categoría
DO $$
DECLARE
  rec RECORD;
  max_num INTEGER;
BEGIN
  FOR rec IN 
    SELECT DISTINCT empresa_id, categoria_id 
    FROM activos_codigo_sequence
  LOOP
    -- Obtener máximo número usado
    EXECUTE format(
      'SELECT COALESCE(MAX((regexp_replace(asset_id, ''^.*-(\\d+)$'', ''\\1''))::INTEGER), 0)
       FROM inventario i
       JOIN empresas e ON i.empresa_id = e.id
       JOIN categorias c ON i.categoria = c.nombre
       WHERE i.empresa_id = %s AND c.id = %s',
      rec.empresa_id, rec.categoria_id
    ) INTO max_num;
    
    -- Actualizar next_number si es menor
    UPDATE activos_codigo_sequence 
    SET next_number = GREATEST(next_number, max_num + 1),
        updated_at = CURRENT_TIMESTAMP
    WHERE empresa_id = rec.empresa_id 
      AND categoria_id = rec.categoria_id
      AND next_number <= max_num;
      
    RAISE NOTICE 'Empresa % Categoria %: max_num = %, next_number actualizado', 
      rec.empresa_id, rec.categoria_id, max_num;
  END LOOP;
END $$;
```

## 📝 Conclusión

El sistema **ESTÁ CORRECTAMENTE IMPLEMENTADO** para no reutilizar códigos. La tabla `activos_codigo_sequence` garantiza que cada código es único en el histórico, incluso si los activos se eliminan.

Si se observa reutilización:
1. Verificar que se está usando el flujo correcto (no `createInventarioWithGeneratedAsset`)
2. Verificar sincronización de secuencias
3. Ejecutar script de reparación si es necesario
