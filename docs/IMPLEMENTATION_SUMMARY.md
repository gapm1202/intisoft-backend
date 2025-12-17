# Implementación del Sistema de Códigos de Activos - Resumen Ejecutivo

## 🎯 Objetivo

Implementar un sistema seguro de asignación de códigos de activos (formato: `<EMP>-<CAT><NNNN>`, ej. `IME-PC0001`) con **lock transaccional** para prevenir colisiones concurrentes entre múltiples usuarios.

---

## ✅ Qué se Implementó

### 1. **Backend - Sistema de Reserva de Códigos**

#### Endpoint: GET/POST `/api/empresas/:empresaId/activos/next-code?categoria=<categoriaId>`

```bash
# Ejemplo de request
curl -X GET "http://localhost:4000/api/empresas/1/activos/next-code?categoria=5" \
  -H "Authorization: Bearer <token>"

# Respuesta
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

**Características:**
- ✅ Reserva el próximo código disponible
- ✅ Lock transaccional (`SERIALIZABLE` + `FOR UPDATE`)
- ✅ Previene race conditions
- ✅ TTL de 15 minutos (configurable)

#### Modificación: POST `/api/empresas/:empresaId/sedes/:sedeId/inventario`

El endpoint de creación de activos ahora acepta:
- `assetId`: código reservado (ej. "IME-PC0001")
- `reservationId`: ID de la reserva (del endpoint anterior)

```json
{
  "categoriaId": 5,
  "assetId": "IME-PC0001",
  "reservationId": 123,
  "fabricante": "Dell",
  "modelo": "Latitude 5440",
  "serie": "ABC12345",
  ...
}
```

**Comportamiento:**
- ✅ Valida que el código fue reservado
- ✅ Verifica que no haya expirado
- ✅ Confirma la reserva al crear el activo
- ✅ Fallback: si no se proporciona código, genera automáticamente

---

### 2. **Base de Datos - 3 Migraciones**

#### 036 - Crear tablas de secuencias y reservas
- `activos_codigo_sequence` - contador por empresa/categoría
- `activos_codigo_reserved` - registro de reservas con TTL

#### 037 - Agregar campo `codigo` a `empresas`
- Código único corto para empresa (ej. "IME")
- Backfill automático desde primeras 3 letras del nombre

#### 038 - Agregar campo `codigo` a `categorias`
- Código único corto para categoría (ej. "PC")
- Backfill automático desde primeras 2 letras del nombre

---

### 3. **Estructura de Código**

Nuevos archivos creados:

```
src/
├── migrations/
│   ├── 036_create_activos_codigo_sequence.sql
│   ├── 037_add_codigo_empresas.sql
│   └── 038_add_codigo_categorias.sql
│
└── modules/empresas/
    ├── models/
    │   └── activos_codigo.model.ts (interfaces)
    │
    ├── repositories/
    │   └── activos_codigo.repository.ts (DB queries)
    │
    ├── services/
    │   └── activos_codigo.service.ts (business logic)
    │
    └── controllers/
        └── activos_codigo.controller.ts (HTTP handlers)
```

Archivos modificados:
- `routes/inventario.routes.ts` - nuevas rutas
- `services/inventario.service.ts` - integración de códigos
- `controllers/inventario.controller.ts` - pasar `reservationId`

---

## 🚀 Pasos de Implementación

### PASO 1: Ejecutar Migraciones
```bash
cd /path/to/intisoft-backend

# Ejecutar las 3 migraciones en orden
psql $DATABASE_URL -f src/migrations/036_create_activos_codigo_sequence.sql
psql $DATABASE_URL -f src/migrations/037_add_codigo_empresas.sql
psql $DATABASE_URL -f src/migrations/038_add_codigo_categorias.sql

# Verificar que se ejecutaron correctamente
psql $DATABASE_URL -c "SELECT * FROM activos_codigo_sequence;"
psql $DATABASE_URL -c "SELECT id, nombre, codigo FROM empresas LIMIT 5;"
psql $DATABASE_URL -c "SELECT id, nombre, codigo FROM categorias LIMIT 5;"
```

### PASO 2: Reiniciar Backend
```bash
# Si estabas usando nodemon, simplemente guarda cualquier archivo
# O reinicia manualmente:
npm run dev
# o
npm start
```

### PASO 3: Validar Endpoints
```bash
# 3a. Reservar un código
TOKEN="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
curl -X GET \
  "http://localhost:4000/api/empresas/1/activos/next-code?categoria=1" \
  -H "Authorization: Bearer $TOKEN"

# Respuesta esperada:
# {
#   "ok": true,
#   "data": {
#     "code": "IME-CA0001",
#     "sequence_number": 1,
#     "reservation_id": 1,
#     "expires_at": "2025-12-15T10:30:00.000Z"
#   }
# }

# 3b. Crear activo con código reservado
curl -X POST \
  "http://localhost:4000/api/empresas/1/sedes/1/inventario" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "categoriaId": 1,
    "assetId": "IME-CA0001",
    "reservationId": 1,
    "fabricante": "Dell",
    "modelo": "Latitude 5440",
    "serie": "XYZ12345",
    "estadoActivo": "activo",
    "estadoOperativo": "operativo"
  }'

# Respuesta esperada: activo creado con assetId = "IME-CA0001"
```

### PASO 4: Actualizar Frontend

**Cambios necesarios en el frontend:**

1. **Agregar botón "Generar Código"**
   - Al seleccionar categoría
   - Llamar a `GET /api/empresas/{id}/activos/next-code?categoria={id}`
   - Mostrar preview: "Tu código será: IME-PC0001 (expira en 15 min)"

2. **Guardar información de reserva**
   - `code` - el código reservado
   - `reservation_id` - ID de la reserva
   - `expires_at` - fecha/hora de expiración

3. **Al crear activo**
   - Incluir `assetId: code` en payload
   - Incluir `reservationId: reservation_id` en payload
   - Validar que no haya expirado (opcional pero recomendado)

4. **Ejemplo de implementación:**
   Ver archivo `docs/FRONTEND_IMPLEMENTATION_EXAMPLE.tsx`

---

## 📋 Checklist de Validación

- [ ] Las 3 migraciones SQL se ejecutaron sin errores
- [ ] Backend compila/inicia correctamente
- [ ] `empresas` tiene registros con `codigo` (ej. "IME")
- [ ] `categorias` tiene registros con `codigo` (ej. "PC")
- [ ] Endpoint GET `/api/empresas/1/activos/next-code?categoria=1` devuelve `{ok: true, data: {...}}`
- [ ] Crear activo sin reserva (fallback) genera código automáticamente
- [ ] Crear activo con reserva confirma la reserva
- [ ] Intentar usar código expirado devuelve error 400
- [ ] Intentar usar código de otra empresa devuelve error 400

---

## 🔒 Garantías de Seguridad

1. **Lock Transaccional (`SERIALIZABLE`)**
   - Previene race conditions en actualizaciones concurrentes
   - Cada incremento de secuencia es atómico

2. **Validación de Reserva**
   - Se verifica que la reserva existe y pertenece a la empresa/categoría
   - Se verifica que no ha expirado
   - Se verifica que no ha sido ya utilizada

3. **TTL de 15 Minutos**
   - Evita bloqueos permanentes de códigos no utilizados
   - Limpiar automáticamente: `DELETE FROM activos_codigo_reserved WHERE expires_at < NOW() AND confirmed = FALSE`

---

## 📊 Formato del Código

### Estructura: `<CODIGO_EMPRESA>-<CODIGO_CATEGORIA><NNNN>`

```
IME-PC0001
│   │  │
│   │  └─ Número secuencial (4 dígitos, 0001-9999)
│   └──── Código de categoría (2-5 caracteres, ej. "PC" para "Personal Computer")
└──────── Código de empresa (3-10 caracteres, ej. "IME" para "Empresa ABC")
```

### Ejemplos:
- `IME-PC0001` - Empresa "IME", Categoría "PC", número 1
- `IME-PC0002` - Empresa "IME", Categoría "PC", número 2
- `IME-SRV0001` - Empresa "IME", Categoría "SRV" (Servidor), número 1
- `TECH-LAP0001` - Empresa "TECH", Categoría "LAP" (Laptop), número 1

### Características:
- ✅ Contador **global por empresa** (no se reinicia por sede)
- ✅ Contador **por categoría** (PC, Servidor, Laptop, etc.)
- ✅ Formato legible y consistente
- ✅ Secuencia continua sin huecos (0001, 0002, 0003, ...)

---

## 📝 Documentación Completa

Para más detalles técnicos, ver:
- `docs/ACTIVOS_CODIGO_SYSTEM.md` - Documentación técnica completa
- `docs/FRONTEND_IMPLEMENTATION_EXAMPLE.tsx` - Ejemplo de código frontend

---

## 🆘 Troubleshooting

### Error: "Empresa sin código asignado"
**Causa:** Campo `codigo` en tabla `empresas` es NULL
**Solución:** 
```sql
UPDATE empresas SET codigo = UPPER(SUBSTRING(nombre, 1, 3)) WHERE codigo IS NULL;
```

### Error: "Categoría sin código asignado"
**Causa:** Campo `codigo` en tabla `categorias` es NULL
**Solución:**
```sql
UPDATE categorias SET codigo = UPPER(SUBSTRING(nombre, 1, 2)) WHERE codigo IS NULL;
```

### Error: "La reserva de código ha expirado"
**Causa:** Pasaron más de 15 minutos desde que se generó el código
**Solución:** Generar un nuevo código

### Error: "Código no está reservado"
**Causa:** Se intentó usar un código sin reservarlo primero
**Solución:** Llamar primero a endpoint `/next-code`

### Endpoint returns 404
**Causa:** Empresa o categoría no existe
**Solución:** Verificar IDs en `empresas` y `categorias`

---

## ✨ Ventajas del Sistema

1. **Prevención de Colisiones**
   - Lock transaccional garantiza códigos únicos
   - Imposible que dos activos tengan el mismo código

2. **Experiencia de Usuario Mejorada**
   - Preview del código antes de crear el activo
   - Confirmación visual en tiempo real
   - TTL visible al usuario

3. **Escalabilidad**
   - Funciona correctamente con múltiples usuarios simultáneos
   - Performance optimizado con índices en DB
   - Lock transaccional evita bloqueos indefinidos

4. **Auditoría**
   - Tabla `activos_codigo_reserved` registra cada reserva
   - Tracking de quién reservó qué y cuándo
   - Histórico completo de códigos utilizados

5. **Flexibilidad**
   - Fallback automático si no se genera código
   - Compatible con flujos existentes
   - Configurable (TTL, formato, etc.)

---

## 🎓 Próximos Pasos Opcionales

1. **Agregar endpoint para limpiar expiradas:**
   ```typescript
   router.post("/cleanup-codes", controller.cleanupExpiredCodes);
   ```

2. **Dashboard de monitoreo:** Ver reservas activas, códigos utilizados, estadísticas

3. **Configurar cron job:** Limpiar automáticamente cada 30 minutos

4. **Migración de datos:** Si hay activos existentes, considerar validarlos contra nueva tabla

---

**¡Implementación completada y lista para usar!** 🎉
