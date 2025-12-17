# Cambios Backend - Soft Delete de Sedes

**Fecha:** 16 de Diciembre, 2025
**Versión de migración:** 042_add_activo_to_sedes.sql

---

## Resumen de Cambios

Se implementó un sistema de **soft delete** para sedes en lugar de eliminación física. Ahora las sedes se pueden desactivar/reactivar sin ser eliminadas de la base de datos.

---

## 1. Nuevos Campos en Tabla `sedes`

Se agregaron 2 nuevos campos a la tabla:

```sql
- activo: BOOLEAN (default: true)
- motivo: VARCHAR(500) - Razón de desactivación/reactivación
```

**En el modelo:**
```typescript
interface Sede {
  // ... campos existentes ...
  activo?: boolean;        // Soft delete: true = active, false = inactive
  motivo?: string;         // Reason for deactivation/reactivation
}
```

---

## 2. Cambios en Endpoints

### ❌ DELETE /api/empresas/:empresaId/sedes/:sedeId
Ya **no se usa** para eliminar. Solo acepta desactivación mediante PATCH.

### ✅ PATCH /api/empresas/:empresaId/sedes/:sedeId
**Nuevo endpoint para desactivar/reactivar sedes**

**Request Body:**
```json
{
  "activo": false,
  "motivo": "Razón de la desactivación"
}
```

**O para reactivar:**
```json
{
  "activo": true,
  "motivo": "Razón de la reactivación"
}
```

**Response (200 OK):**
```json
{
  "message": "Sede desactivada",
  "data": {
    "id": 23,
    "nombre": "Sede Ate",
    "activo": false,
    "motivo": "Cierre temporal para mantenimiento",
    // ... otros campos ...
  }
}
```

---

## 3. Comportamiento del Listado de Sedes

### GET /api/empresas/:empresaId/sedes

**Por defecto solo retorna sedes ACTIVAS** (`activo = true`)

Respuesta:
```json
[
  {
    "id": 23,
    "nombre": "Sede Ate",
    "activo": true,
    "motivo": null,
    // ... otros campos ...
  },
  {
    "id": 24,
    "nombre": "Sucursal Lima",
    "activo": true,
    "motivo": null,
  }
]
```

**Si una sede está desactivada, NO aparecerá en este listado.**

---

## 4. Flujo de Uso en Frontend

### Desactivar una sede:

```javascript
// PATCH a /api/empresas/62/sedes/23
{
  "activo": false,
  "motivo": "Sede en mantenimiento"
}

// Respuesta 200 OK
{
  "message": "Sede desactivada",
  "data": { ... }
}
```

### Reactivar una sede:

```javascript
// PATCH a /api/empresas/62/sedes/23
{
  "activo": true,
  "motivo": "Mantenimiento completado"
}

// Respuesta 200 OK
{
  "message": "Sede reactivada",
  "data": { ... }
}
```

---

## 5. Validaciones Requeridas

El backend valida:
- ✅ `activo` debe ser `boolean` (true o false)
- ✅ `motivo` es requerido y no puede estar vacío
- ✅ No permite togglear a estado actual (ej: si activo=true, no permite PATCH con activo=true)

**Errores esperados:**

```json
// Si falta activo
{
  "message": "activo es requerido y debe ser boolean (true/false)"
}

// Si falta motivo
{
  "message": "motivo es requerido y no puede estar vacío"
}

// Si ya está en ese estado
{
  "message": "Sede ya está activa"
}
```

---

## 6. Historial de Cambios

Se registran en la tabla `historial`:
- `DESACTIVAR_SEDE` - Cuando se desactiva
- `REACTIVAR_SEDE` - Cuando se reactiva

Con los siguientes detalles:
```json
{
  "sedeId": 23,
  "anterior": {
    "activo": true,
    "motivo": null
  },
  "nuevo": {
    "activo": false,
    "motivo": "Cierre temporal"
  }
}
```

---

## 7. Cambios en Frontend Necesarios

### 7.1 - Cambiar botón "Eliminar" por "Desactivar/Reactivar"

**Anterior:**
```javascript
// DELETE /api/empresas/:empresaId/sedes/:sedeId
```

**Ahora:**
```javascript
async function toggleSedeActivo(empresaId, sedeId, activo, motivo) {
  const response = await fetch(
    `/api/empresas/${empresaId}/sedes/${sedeId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        activo: activo,  // true para activar, false para desactivar
        motivo: motivo   // Razón del cambio (requerida)
      })
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    console.error('Error:', error.message);
    return;
  }
  
  const result = await response.json();
  console.log(result.message);
  return result.data;
}
```

### 7.2 - Mostrar estado de sede

En el componente de sedes, mostrar el estado:
```tsx
<Sede
  nombre={sede.nombre}
  estado={sede.activo ? 'Activa' : 'Inactiva'}
  motivo={sede.motivo}
  onToggle={() => toggleSedeActivo(empresaId, sede.id, !sede.activo, 'Razón...')}
/>
```

### 7.3 - Filtrar en UI

Si quieres mostrar sedes inactivas (para auditoría), debes hacer un query parameter:
```javascript
// GET /api/empresas/:empresaId/sedes?includeInactive=true
```
*(Esta opción está disponible en el backend pero solo retorna activas por defecto)*

---

## 8. Estado de la Migración

✅ **Aplicada exitosamente** en base de datos

```sql
ALTER TABLE sedes ADD COLUMN activo BOOLEAN DEFAULT true;
ALTER TABLE sedes ADD COLUMN motivo VARCHAR(500);
CREATE INDEX idx_sedes_activo ON sedes(activo, empresa_id);
```

---

## 9. Testing

Endpoint PATCH:
```bash
curl -X PATCH http://localhost:4000/api/empresas/62/sedes/23 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "activo": false,
    "motivo": "Mantenimiento preventivo"
  }'
```

---

## 10. Notas Importantes

1. **No se eliminan datos**: Las sedes desactivadas permanecen en la BD con sus activos asociados
2. **Auditoría**: Se registra quién, cuándo y por qué se desactivó/reactivó
3. **Backward compatible**: El modelo anterior sigue funcionando, solo se agregan campos opcionales
4. **Restricciones**: No se pueden desactivar si tienen responsables críticos (validación futura)

---

## Contacto

Para preguntas o bugs, revisar los logs del servidor en `server_stdout.txt` y `server_stderr.txt`.
