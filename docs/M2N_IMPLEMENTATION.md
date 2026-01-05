# 🔄 RELACIÓN M:N - USUARIOS ↔ ACTIVOS

## 📋 Resumen de Cambios

La relación entre usuarios y activos ha evolucionado de **1:1** a **M:N (muchos a muchos)**:

- **Antes (1:1):** Un usuario podía tener UN activo asignado, y un activo podía tener UN usuario.
- **Ahora (M:N):** Un usuario puede tener MÚLTIPLES activos, y un activo puede tener MÚLTIPLES usuarios.

**Motivo del cambio:** Casos de uso reales requieren esta flexibilidad:
- Un usuario puede tener laptop + mouse + teclado
- Un activo compartido (impresora de oficina, proyector de sala) puede tener múltiples usuarios

## 🗄️ Arquitectura de Base de Datos

### Tabla de Unión: `usuarios_activos`

```sql
CREATE TABLE usuarios_activos (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios_empresas(id) ON DELETE CASCADE,
  activo_id INTEGER NOT NULL REFERENCES inventario(id) ON DELETE CASCADE,
  fecha_asignacion TIMESTAMP DEFAULT NOW(),
  asignado_por VARCHAR(255),
  motivo TEXT,
  activo BOOLEAN DEFAULT TRUE,  -- Soft delete
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(usuario_id, activo_id, activo) -- Evitar duplicados activos
);
```

**Características:**
- **Soft Delete:** `activo = FALSE` marca desasignación sin borrar historial
- **Auditoría:** `fecha_asignacion`, `asignado_por`, `motivo` para trazabilidad
- **Constraint UNIQUE:** Evita asignaciones duplicadas activas

### Migración de Datos

✅ **Migración 066 completada:**
- Total asignaciones migradas: **2**
- Usuarios con activos: **2**
- Activos asignados: **2**

🗑️ **Triggers 1:1 eliminados:**
- `trigger_sync_usuario_to_inventario`
- `trigger_sync_inventario_to_usuario`

⚠️ **Columnas DEPRECATED (mantienen compatibilidad temporal):**
- `usuarios_empresas.activo_asignado_id`
- `inventario.usuario_asignado_id`

## 🔌 Nuevos Endpoints M:N

### 1️⃣ Asignar Usuarios a un Activo

```http
POST /api/inventario/:activoId/usuarios
Authorization: Bearer <token>

{
  "usuarioIds": ["123", "456"],
  "motivo": "Usuarios compartiendo impresora de oficina",
  "asignadoPor": "Admin Principal"
}
```

**Respuesta:**
```json
{
  "mensaje": "Se asignaron 2 usuario(s) al activo",
  "asignaciones": [
    {
      "id": "1",
      "usuarioId": "123",
      "activoId": "789",
      "fechaAsignacion": "2024-01-15T10:30:00Z",
      "usuarioData": {
        "id": "123",
        "nombreCompleto": "Juan Pérez",
        "correo": "juan@empresa.com",
        "cargo": "Desarrollador"
      }
    }
  ],
  "errores": []
}
```

**Validaciones:**
- Máximo 10 usuarios por activo (configurable en `MAX_USUARIOS_POR_ACTIVO`)
- Usuario debe existir y estar activo
- Activo debe existir
- No permite duplicados (si ya está asignado, retorna error)

---

### 2️⃣ Desasignar Usuario de un Activo

```http
DELETE /api/inventario/:activoId/usuarios/:usuarioId
Authorization: Bearer <token>

{
  "motivo": "Usuario cambió de departamento"
}
```

**Respuesta:**
```json
{
  "mensaje": "Usuario desasignado del activo correctamente"
}
```

**Comportamiento:**
- Soft delete (`activo = FALSE`)
- Preserva historial para auditoría
- Si no existe asignación activa, retorna 404

---

### 3️⃣ Obtener Usuarios de un Activo

```http
GET /api/inventario/:activoId/usuarios
Authorization: Bearer <token>
```

**Respuesta:**
```json
{
  "activoId": "789",
  "totalUsuarios": 2,
  "usuarios": [
    {
      "asignacionId": "1",
      "usuarioId": "123",
      "nombreCompleto": "Juan Pérez",
      "correo": "juan@empresa.com",
      "cargo": "Desarrollador",
      "telefono": "+1234567890",
      "fechaAsignacion": "2024-01-15T10:30:00Z",
      "asignadoPor": "Admin Principal",
      "motivo": "Asignación inicial"
    }
  ]
}
```

---

### 4️⃣ Asignar Activos a un Usuario

```http
POST /api/usuarios/:usuarioId/activos
Authorization: Bearer <token>

{
  "activoIds": ["789", "790", "791"],
  "motivo": "Asignación de equipo completo (laptop + mouse + teclado)",
  "asignadoPor": "Jefe de IT"
}
```

**Respuesta:**
```json
{
  "mensaje": "Se asignaron 3 activo(s) al usuario",
  "asignaciones": [
    {
      "id": "1",
      "usuarioId": "123",
      "activoId": "789",
      "fechaAsignacion": "2024-01-15T10:30:00Z",
      "activoData": {
        "id": "789",
        "assetId": "LPT-001",
        "nombre": "Laptop Dell Inspiron 15",
        "categoria": "Laptop"
      }
    }
  ]
}
```

**Validaciones:**
- Máximo 20 activos por usuario (configurable en `MAX_ACTIVOS_POR_USUARIO`)
- Activos deben existir
- Usuario debe existir y estar activo

---

### 5️⃣ Desasignar Activo de un Usuario

```http
DELETE /api/usuarios/:usuarioId/activos/:activoId
Authorization: Bearer <token>

{
  "motivo": "Fin de proyecto temporal"
}
```

**Respuesta:**
```json
{
  "mensaje": "Activo desasignado del usuario correctamente"
}
```

---

### 6️⃣ Obtener Activos de un Usuario

```http
GET /api/usuarios/:usuarioId/activos
Authorization: Bearer <token>
```

**Respuesta:**
```json
{
  "usuarioId": "123",
  "totalActivos": 3,
  "activos": [
    {
      "asignacionId": "1",
      "activoId": "789",
      "assetId": "LPT-001",
      "nombre": "Laptop Dell Inspiron 15",
      "categoria": "Laptop",
      "fechaAsignacion": "2024-01-15T10:30:00Z",
      "asignadoPor": "Jefe de IT",
      "motivo": "Asignación de equipo completo"
    }
  ]
}
```

---

### 7️⃣ BONUS: Historial de Asignaciones de un Activo

```http
GET /api/inventario/:activoId/usuarios/historial
Authorization: Bearer <token>
```

**Respuesta:**
```json
{
  "activoId": "789",
  "totalEventos": 4,
  "historial": [
    {
      "id": 1,
      "usuarioId": 123,
      "usuarioNombre": "Juan Pérez",
      "evento": "ASIGNACION",
      "fechaEvento": "2024-01-15T10:30:00Z",
      "asignadoPor": "Admin Principal",
      "motivo": "Asignación inicial"
    },
    {
      "id": 1,
      "usuarioId": 123,
      "usuarioNombre": "Juan Pérez",
      "evento": "DESASIGNACION",
      "fechaEvento": "2024-02-20T14:00:00Z",
      "motivo": "Usuario cambió de departamento"
    }
  ]
}
```

## 📤 Cambios en Endpoints Existentes

### GET /api/inventario/:id (Obtener Activo Individual)

**NUEVOS CAMPOS en respuesta:**
```json
{
  "id": "789",
  "assetId": "LPT-001",
  
  // ===== CAMPOS LEGACY (compatibilidad) =====
  "usuarioAsignadoId": "123",  // Primer usuario del array
  "usuarioAsignadoData": {     // Datos del primer usuario
    "id": "123",
    "nombreCompleto": "Juan Pérez",
    "correo": "juan@empresa.com",
    "cargo": "Desarrollador"
  },
  
  // ===== CAMPOS M:N NUEVOS =====
  "usuariosAsignados": [  // ⬅️ NUEVO: Array de TODOS los usuarios
    {
      "id": 123,
      "nombreCompleto": "Juan Pérez",
      "correo": "juan@empresa.com",
      "cargo": "Desarrollador",
      "telefono": "+1234567890",
      "fechaAsignacion": "2024-01-15T10:30:00Z"
    },
    {
      "id": 456,
      "nombreCompleto": "María López",
      "correo": "maria@empresa.com",
      "cargo": "Diseñadora",
      "telefono": "+9876543210",
      "fechaAsignacion": "2024-01-16T09:00:00Z"
    }
  ],
  "cantidadUsuariosAsignados": 2  // ⬅️ NUEVO: Contador
}
```

### GET /api/empresas/:empresaId/inventario (Listar Activos)

**Mismo formato que arriba** - cada activo en el array incluye `usuariosAsignados` y `cantidadUsuariosAsignados`.

### GET /api/empresas/:empresaId/usuarios (Listar Usuarios)

**NUEVOS CAMPOS en respuesta:**
```json
{
  "id": "123",
  "_id": "123",
  "nombreCompleto": "Juan Pérez",
  
  // ===== CAMPOS LEGACY (compatibilidad) =====
  "activoAsignadoId": "789",  // Primer activo del array
  "activoCodigo": "LPT-001",
  "activoNombre": "Laptop",
  
  // ===== CAMPOS M:N NUEVOS =====
  "activosAsignados": [  // ⬅️ NUEVO: Array de TODOS los activos
    {
      "id": 789,
      "assetId": "LPT-001",
      "nombre": "Laptop Dell Inspiron 15",
      "categoria": "Laptop",
      "fabricante": "Dell",
      "modelo": "Inspiron 15",
      "fechaAsignacion": "2024-01-15T10:30:00Z"
    },
    {
      "id": 790,
      "assetId": "MSE-042",
      "nombre": "Mouse Logitech",
      "categoria": "Periférico",
      "fechaAsignacion": "2024-01-15T10:35:00Z"
    }
  ],
  "cantidadActivosAsignados": 2  // ⬅️ NUEVO: Contador
}
```

## 🔄 Estrategia de Compatibilidad

### Período de Transición (Dual Format)

Durante la transición, el backend retorna **AMBOS FORMATOS**:

1. **Formato Legacy** (`usuarioAsignadoId`, `usuarioAsignadoData`):
   - Contiene el **primer usuario** del array `usuariosAsignados`
   - Mantiene compatibilidad con frontend antiguo
   - ⚠️ **NO USAR en nuevo código**

2. **Formato M:N** (`usuariosAsignados`, `cantidadUsuariosAsignados`):
   - Array completo de usuarios/activos asignados
   - ✅ **USAR ESTE en frontend nuevo**

### Migración del Frontend

**Paso 1: Actualizar componentes para usar arrays**
```typescript
// ❌ ANTIGUO (1:1)
const usuario = inventario.usuarioAsignadoData;

// ✅ NUEVO (M:N)
const usuarios = inventario.usuariosAsignados || [];
const primerUsuario = usuarios[0]; // Si necesitas solo el primero
```

**Paso 2: Usar nuevos endpoints**
```typescript
// Asignar múltiples usuarios a un activo
await api.post(`/inventario/${activoId}/usuarios`, {
  usuarioIds: ['123', '456'],
  motivo: 'Equipo compartido',
  asignadoPor: 'Admin'
});

// Obtener todos los usuarios de un activo
const { usuarios } = await api.get(`/inventario/${activoId}/usuarios`);
```

**Paso 3: Mostrar múltiples asignaciones en UI**
```tsx
<ul>
  {inventario.usuariosAsignados.map(u => (
    <li key={u.id}>
      {u.nombreCompleto} - {u.cargo}
      <small>{u.fechaAsignacion}</small>
    </li>
  ))}
</ul>
```

## 🧪 Ejemplos de Casos de Uso

### Caso 1: Laptop Compartida en Sala de Reuniones

```bash
# Asignar 3 usuarios a la misma laptop
POST /api/inventario/789/usuarios
{
  "usuarioIds": ["101", "102", "103"],
  "motivo": "Laptop compartida para reuniones ejecutivas",
  "asignadoPor": "IT Manager"
}
```

### Caso 2: Setup Completo para Nuevo Empleado

```bash
# Asignar laptop + mouse + teclado a un usuario
POST /api/usuarios/123/activos
{
  "activoIds": ["789", "790", "791"],
  "motivo": "Onboarding nuevo desarrollador",
  "asignadoPor": "HR"
}
```

### Caso 3: Auditoría de Asignaciones

```bash
# Ver historial completo de quién ha usado un activo
GET /api/inventario/789/usuarios/historial

# Resultado: Todas las asignaciones y desasignaciones históricas
```

## 🔒 Límites Configurables

Definidos en `usuario-activo.service.ts`:

```typescript
const MAX_USUARIOS_POR_ACTIVO = 10;  // Máximo usuarios por activo
const MAX_ACTIVOS_POR_USUARIO = 20;  // Máximo activos por usuario
```

**Si se excede el límite:**
```json
{
  "error": "El activo no puede tener más de 10 usuarios asignados"
}
```

## 📊 Queries SQL de Performance

Las consultas usan **JSON_AGG** para evitar múltiples queries:

```sql
-- Obtener activo con TODOS sus usuarios en una sola query
SELECT 
  i.*,
  COALESCE(
    (SELECT JSON_AGG(
      JSON_BUILD_OBJECT(
        'id', ue.id,
        'nombreCompleto', ue.nombre_completo,
        'correo', ue.correo,
        'cargo', ue.cargo,
        'fechaAsignacion', ua.fecha_asignacion
      )
    )
    FROM usuarios_activos ua
    INNER JOIN usuarios_empresas ue ON ua.usuario_id = ue.id
    WHERE ua.activo_id = i.id AND ua.activo = TRUE),
    '[]'::json
  ) as usuarios_asignados_m2n
FROM inventario i
WHERE i.id = $1;
```

**Índices creados para optimización:**
- `idx_usuarios_activos_usuario` → Búsquedas por usuario_id
- `idx_usuarios_activos_activo` → Búsquedas por activo_id
- `idx_usuarios_activos_activo_flag` → Filtrado por activo = TRUE

## 🚀 Estado de Implementación

### ✅ Completado

- [x] Migración 066 ejecutada
- [x] Tabla `usuarios_activos` creada
- [x] Datos migrados (2 asignaciones)
- [x] Triggers 1:1 eliminados
- [x] Repository layer (7 funciones)
- [x] Service layer (validaciones)
- [x] Controller layer (6 endpoints + historial)
- [x] Routes registradas en servidor
- [x] Endpoints existentes actualizados (GET inventario, GET usuarios)
- [x] JSON_AGG queries optimizadas
- [x] TypeScript interfaces actualizadas

### 🧪 Pendiente de Pruebas

- [ ] Test endpoint POST /api/inventario/:activoId/usuarios
- [ ] Test endpoint DELETE /api/inventario/:activoId/usuarios/:usuarioId
- [ ] Test endpoint POST /api/usuarios/:usuarioId/activos
- [ ] Test endpoint DELETE /api/usuarios/:usuarioId/activos/:activoId
- [ ] Test endpoint GET /api/inventario/:activoId/usuarios
- [ ] Test endpoint GET /api/usuarios/:usuarioId/activos
- [ ] Verificar formato dual (legacy + M:N) en GET inventario
- [ ] Verificar formato dual en GET usuarios
- [ ] Test límites (MAX_USUARIOS_POR_ACTIVO, MAX_ACTIVOS_POR_USUARIO)

### 📝 Documentación

- [x] Este archivo (M2N_IMPLEMENTATION.md)
- [ ] Actualizar FRONTEND_INTEGRATION_READY.md con nuevos endpoints
- [ ] Crear guía de migración para frontend

## 🎯 Próximos Pasos

1. **Probar endpoints M:N** con Postman/curl
2. **Verificar compatibilidad** - endpoints existentes deben seguir funcionando
3. **Actualizar frontend** para usar arrays en lugar de campos singulares
4. **Monitorear performance** - verificar que JSON_AGG no cause lentitud
5. **Cleanup futuro** - después de 1-2 meses, eliminar columnas deprecated:
   - `usuarios_empresas.activo_asignado_id`
   - `inventario.usuario_asignado_id`
   - Campos legacy en respuestas API

---

**✅ ARQUITECTURA M:N LISTA PARA USO**

La implementación está completa y lista para que el frontend comience a usar los nuevos endpoints M:N mientras mantiene compatibilidad con el código existente.
