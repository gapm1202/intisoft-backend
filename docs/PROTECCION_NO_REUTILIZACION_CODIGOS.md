# � Sistema de Reutilización de Códigos de Activos

## ✅ Estado Actual (Diciembre 29, 2025)

El sistema **REUTILIZA automáticamente** los códigos eliminados para evitar saltos en la numeración.

### 🎯 Comportamiento Actual

El sistema encuentra el **primer número disponible** en lugar de siempre incrementar.

## 📊 Ejemplo Real: OBRASIN / PC

### Escenario:
```
Activos existentes:
- OBR-PC0001 (ID: 19)
- OBR-PC0002 (ID: 20) <- Se elimina con DELETE
- OBR-PC0003 (ID: 21)
- OBR-PC0004 (ID: 22)
```

### ✅ Comportamiento:
```
1. Usuario elimina OBR-PC0002: DELETE FROM inventario WHERE id = 20
2. Activos restantes: 0001, 0003, 0004
3. Se crea nuevo activo → Sistema busca primer hueco
4. Próximo código generado: OBR-PC0002 ✅ (reutiliza el hueco)
5. Se crea otro activo → Próximo código: OBR-PC0005 ✅ (continúa secuencia)
```

## 🔍 Algoritmo de Generación

```typescript
// 1. Obtener todos los números usados
const usedNumbers = [1, 3, 4]; // (eliminamos el 2)

// 2. Ordenar
usedNumbers.sort(); // [1, 3, 4]

// 3. Buscar primer hueco
for (let i = 1; i <= usedNumbers.length + 1; i++) {
  if (!usedNumbers.includes(i)) {
    return i; // Retorna 2 ✅
  }
}
```

## 🛠️ Ventajas del Sistema

✅ **Sin saltos** - Los códigos siempre son consecutivos  
✅ **Eficiente** - Reutiliza números en lugar de desperdiciarlos  
✅ **Predecible** - Siempre el número más bajo disponible  
✅ **Automático** - No requiere intervención manual

## ⚠️ Consideraciones

### Reservas Temporales
Las reservas en `activos_codigo_reserved` tienen TTL (15 minutos por defecto).
Si se elimina un activo cuyo código está reservado, se debe eliminar la reserva:

```sql
DELETE FROM activos_codigo_reserved 
WHERE codigo = 'OBR-PC0002';
```

O esperar a que expire automáticamente (15 min).

### Tabla de Secuencias
La tabla `activos_codigo_sequence` **ya no se usa** para generar códigos.
Se mantiene solo por compatibilidad pero el campo `next_number` no se actualiza.

## 🔧 Implementación Técnica

Archivo: `src/modules/empresas/repositories/activos_codigo.repository.ts`

```typescript
// Buscar todos los códigos existentes
const existingCodes = await client.query(
  `SELECT asset_id FROM inventario 
   WHERE empresa_id = $1 
   AND asset_id LIKE $2`,
  [empresaId, pattern]
);

// Extraer números usados
const usedNumbers = existingCodes.rows
  .map(row => parseInt(row.asset_id.match(/(\d+)$/)[1]))
  .filter(n => n > 0)
  .sort((a, b) => a - b);

// Encontrar primer hueco
let sequenceNumber = 1;
for (let i = 1; i <= usedNumbers.length + 1; i++) {
  if (!usedNumbers.includes(i)) {
    sequenceNumber = i;
    break;
  }
}
```

## 📝 Logs del Sistema

El sistema registra cada generación de código:

```
🔍 Buscando códigos existentes: pattern=OBR-PC%
🔢 Código generado: OBR-PC0002 (número: 2, usados: [1,3,4])
```

## ✅ Conclusión

El sistema **SIEMPRE reutiliza** los códigos eliminados, garantizando una numeración continua sin saltos.
