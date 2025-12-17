# Sistema de Códigos de Activos - Documentación Técnica

## Descripción General

Se ha implementado un sistema de reserva y asignación de códigos de activos con lock transaccional para prevenir colisiones concurrentes.

**Formato de código:** `<CODIGO_EMPRESA>-<CODIGO_CATEGORIA><NNNN>`
**Ejemplo:** `IME-PC0001`

- `IME` = código de empresa (ej. primeras 3 letras de "Empresa ABC")
- `PC` = código de categoría (ej. primeras 2 letras de "Personal Computer")
- `0001` = número secuencial (4 dígitos, iniciando en 0001)

El contador es **global por empresa** (no se reinicia por sede) y **por categoría**.

---

## Tablas de Base de Datos

### 1. `activos_codigo_sequence`
Almacena el próximo número disponible para cada combinación empresa/categoría.

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

### 2. `activos_codigo_reserved`
Almacena códigos reservados (en espera de confirmación) con TTL de expiración.

```sql
CREATE TABLE activos_codigo_reserved (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER NOT NULL,
  codigo TEXT NOT NULL UNIQUE,
  categoria_id INTEGER NOT NULL,
  sequence_number INTEGER NOT NULL,
  reserved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,           -- TTL (default: 15 minutos)
  user_id INTEGER,
  confirmed BOOLEAN DEFAULT FALSE,         -- Se marca TRUE cuando se crea el activo
  activo_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. Cambios en `empresas`
Se agregó campo:
- `codigo VARCHAR(10) UNIQUE NOT NULL` - Código corto para identificar la empresa

### 4. Cambios en `categorias`
Se agregó campo:
- `codigo VARCHAR(5) UNIQUE NOT NULL` - Código corto para identificar la categoría

---

## Migraciones SQL

Se crearon 3 nuevas migraciones:

1. **036_create_activos_codigo_sequence.sql** - Crea las tablas de secuencias y reservas
2. **037_add_codigo_empresas.sql** - Agrega campo `codigo` a tabla `empresas`
3. **038_add_codigo_categorias.sql** - Agrega campo `codigo` a tabla `categorias`

### Para ejecutar las migraciones:
```bash
# Opción 1: Ejecutar manualmente en psql
psql $DATABASE_URL -f src/migrations/036_create_activos_codigo_sequence.sql
psql $DATABASE_URL -f src/migrations/037_add_codigo_empresas.sql
psql $DATABASE_URL -f src/migrations/038_add_codigo_categorias.sql

# Opción 2: Si existe un script de migraciones, integrarlo allí
```

---

## API Endpoints

### 1. GET/POST - Reservar Próximo Código

**Endpoint:**
```
GET /api/empresas/:empresaId/activos/next-code?categoria=<categoriaId>
POST /api/empresas/:empresaId/activos/next-code?categoria=<categoriaId>
```

**Parámetros:**
- `empresaId` (path) - ID de la empresa
- `categoria` (query) - ID de la categoría

**Respuesta (201):**
```json
{
  "ok": true,
  "data": {
    "code": "IME-PC0001",
    "sequence_number": 1,
    "reservation_id": 123,
    "expires_at": "2025-12-15T10:45:00Z"
  }
}
```

**Descripción:**
- Reserva el próximo código disponible para una empresa/categoría
- Increments el contador secuencial
- La reserva expira en 15 minutos (TTL configurable)
- `reservation_id` se usa para confirmar la reserva cuando se crea el activo

**Errores:**
- `400` - empresaId o categoriaId inválidos
- `404` - Empresa o categoría no encontrada
- `500` - Error en el servidor

---

### 2. POST - Crear Activo con Código Reservado

**Endpoint:**
```
POST /api/empresas/:empresaId/sedes/:sedeId/inventario
```

**Payload (con código reservado):**
```json
{
  "categoriaId": 5,
  "assetId": "IME-PC0001",          // Código reservado
  "reservationId": 123,              // ID de la reserva (del endpoint anterior)
  "fabricante": "Dell",
  "modelo": "Latitude 5440",
  "serie": "ABC12345",
  "estadoActivo": "activo",
  // ... otros campos ...
}
```

**Comportamiento:**
1. Valida que el código fue reservado y aún no ha expirado
2. Valida que la reserva corresponde a la empresa y categoría correctas
3. Valida que el código no haya sido ya utilizado
4. Crea el activo con el código asignado
5. Marca la reserva como confirmada

**Fallback (sin código reservado):**
Si `assetId` y `reservationId` no se proporcionan, el sistema genera automáticamente un código.

---

## Flujo de Uso Recomendado

### Frontend

1. **Mostrar preview del código:**
   ```javascript
   // Usuario selecciona categoría y hace clic en "Generar"
   const response = await fetch(
     `/api/empresas/${empresaId}/activos/next-code?categoria=${categoriaId}`,
     { method: 'GET' }
   );
   const { data } = await response.json();
   // Mostrar: "Tu código será: IME-PC0001" (expira en 15 min)
   // Guardar: data.reservation_id y data.code
   ```

2. **Crear activo con código reservado:**
   ```javascript
   const activoData = {
     categoriaId: 5,
     assetId: data.code,          // "IME-PC0001"
     reservationId: data.reservation_id,  // 123
     fabricante: "Dell",
     // ... más campos ...
   };

   const response = await fetch(
     `/api/empresas/${empresaId}/sedes/${sedeId}/inventario`,
     {
       method: 'POST',
       body: JSON.stringify(activoData)
     }
   );
   ```

---

## Seguridad y Concurrencia

### Lock Transaccional
- **Nivel de aislamiento:** `SERIALIZABLE`
- **Aplicación:** `FOR UPDATE` en tabla `activos_codigo_sequence`
- **Scope:** Por empresa y categoría
- **Efecto:** Previene race conditions al incrementar el contador

### Validación de Reserva
Antes de usar un código, se verifica:
1. ✅ La reserva existe
2. ✅ No ha expirado
3. ✅ Pertenece a la empresa correcta
4. ✅ No ha sido ya confirmada/usada

---

## Limpieza de Reservas Expiradas

Las reservas expiradas (>15 min sin confirmar) se pueden limpiar automáticamente:

```typescript
// En src/modules/empresas/services/activos_codigo.service.ts
export const cleanupExpiredCodes = async (): Promise<number> => {
  return repo.cleanupExpiredReservations();
};
```

**Recomendación:** Ejecutar vía cron job cada 30 minutos:
```bash
# crontab
*/30 * * * * curl http://localhost:4000/api/internal/cleanup-codes
```

---

## Archivos Modificados/Creados

### Creados:
- `src/migrations/036_create_activos_codigo_sequence.sql`
- `src/migrations/037_add_codigo_empresas.sql`
- `src/migrations/038_add_codigo_categorias.sql`
- `src/modules/empresas/models/activos_codigo.model.ts`
- `src/modules/empresas/repositories/activos_codigo.repository.ts`
- `src/modules/empresas/services/activos_codigo.service.ts`
- `src/modules/empresas/controllers/activos_codigo.controller.ts`

### Modificados:
- `src/modules/empresas/routes/inventario.routes.ts` - Añadidas rutas para next-code
- `src/modules/empresas/services/inventario.service.ts` - Integrada lógica de códigos reservados
- `src/modules/empresas/controllers/inventario.controller.ts` - Pasada `reservationId` en ambos endpoints

---

## Consideraciones Importantes

1. **Códigos de Empresa y Categoría:**
   - Asegurar que sean únicos y significativos
   - Se recomenda establecerlos al crear empresas/categorías
   - Backfill automático usa primeras 3 letras de nombre (empresa) o 2 (categoría)

2. **TTL de Reserva:**
   - Default: 15 minutos
   - Configurable en llamada a `getNextCode()` en el servicio
   - Suficiente para que frontend muestre preview y usuario complete el formulario

3. **Reintentos:**
   - Si una reserva expira, el usuario puede solicitar un nuevo código
   - No genera duplicados porque el contador ya fue incrementado

4. **Migración de Códigos Existentes:**
   - Los activos existentes mantienen su `assetId` anterior
   - Los nuevos activos usarán el nuevo formato
   - Considerar data migration si se requiere unificar

---

## Testing

### Caso 1: Reservar código exitosamente
```bash
curl -X GET "http://localhost:4000/api/empresas/1/activos/next-code?categoria=5" \
  -H "Authorization: Bearer <token>"
```

### Caso 2: Intentar usar código expirado
```bash
# Esperar >15 min y luego intentar crear activo con ese código
# Debe devolver 400: "La reserva de código ha expirado"
```

### Caso 3: Crear activo sin reservar código (fallback)
```bash
curl -X POST "http://localhost:4000/api/empresas/1/sedes/1/inventario" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"categoriaId": 5, "fabricante": "Dell"}'
# Sistema genera código automáticamente
```

---

## Monitoreo

### Queries útiles para monitoreo:

```sql
-- Ver secuencias actuales
SELECT * FROM activos_codigo_sequence ORDER BY empresa_id, categoria_id;

-- Ver reservas pendientes de confirmación
SELECT * FROM activos_codigo_reserved 
WHERE confirmed = FALSE 
  AND expires_at > CURRENT_TIMESTAMP
ORDER BY expires_at DESC;

-- Ver códigos ya usados
SELECT * FROM activos_codigo_reserved 
WHERE confirmed = TRUE
ORDER BY updated_at DESC;

-- Estadísticas por empresa
SELECT 
  e.id, e.nombre, e.codigo,
  COUNT(CASE WHEN acr.confirmed = TRUE THEN 1 END) as total_codigos_usados,
  COUNT(CASE WHEN acr.confirmed = FALSE AND acr.expires_at > CURRENT_TIMESTAMP THEN 1 END) as reservas_activas,
  COUNT(CASE WHEN acr.expires_at < CURRENT_TIMESTAMP THEN 1 END) as reservas_expiradas
FROM empresas e
LEFT JOIN activos_codigo_reserved acr ON e.id = acr.empresa_id
GROUP BY e.id, e.nombre, e.codigo
ORDER BY e.nombre;
```
