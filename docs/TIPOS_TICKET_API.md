# API de Tipos de Ticket

## Tabla en Base de Datos

```sql
CREATE TABLE tipos_ticket (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(100) NOT NULL UNIQUE,
  descripcion TEXT,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Endpoints

### Base URL
`/api/catalogo/tipos-ticket`

### Autenticación
Todos los endpoints requieren autenticación con JWT en el header:
```
Authorization: Bearer <token>
```

---

### 1. Listar Tipos de Ticket

**GET** `/api/catalogo/tipos-ticket`

Retorna todos los tipos de ticket ordenados alfabéticamente.

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "nombre": "Incidente",
      "descripcion": "Problemas que requieren atención inmediata",
      "activo": true,
      "createdAt": "2025-12-31T...",
      "updatedAt": "2025-12-31T..."
    }
  ]
}
```

---

### 2. Crear Tipo de Ticket

**POST** `/api/catalogo/tipos-ticket`

Crea un nuevo tipo de ticket.

**Body:**
```json
{
  "nombre": "string (requerido)",
  "descripcion": "string (opcional)",
  "activo": "boolean (opcional, default: true)"
}
```

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "nombre": "Incidente",
    "descripcion": "Problemas que requieren atención inmediata",
    "activo": true,
    "createdAt": "2025-12-31T...",
    "updatedAt": "2025-12-31T..."
  }
}
```

**Validaciones:**
- `nombre` es requerido y no puede estar vacío
- `nombre` debe ser único
- Se eliminan espacios al inicio y final del nombre

**Errores:**
- `400` - "El nombre es requerido"
- `400` - "Ya existe un tipo de ticket con ese nombre"

---

### 3. Actualizar Tipo de Ticket

**PUT** `/api/catalogo/tipos-ticket/:id`

Actualiza un tipo de ticket existente.

**Params:**
- `id` - UUID del tipo de ticket

**Body:**
```json
{
  "nombre": "string (opcional)",
  "descripcion": "string (opcional)",
  "activo": "boolean (opcional)"
}
```

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "nombre": "Incidente",
    "descripcion": "Descripción actualizada",
    "activo": true,
    "createdAt": "2025-12-31T...",
    "updatedAt": "2025-12-31T..."
  }
}
```

**Validaciones:**
- Si se actualiza `nombre`, debe ser único
- El nombre no puede estar vacío
- Se eliminan espacios al inicio y final

**Errores:**
- `404` - "Tipo de ticket no encontrado"
- `400` - "El nombre no puede estar vacío"
- `400` - "Ya existe un tipo de ticket con ese nombre"

---

### 4. Activar/Desactivar Tipo de Ticket

**PATCH** `/api/catalogo/tipos-ticket/:id/toggle`

Cambia el estado `activo` al valor opuesto (activo ↔ inactivo).

**Params:**
- `id` - UUID del tipo de ticket

**Body:** Vacío `{}`

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "nombre": "Incidente",
    "descripcion": "...",
    "activo": false,
    "createdAt": "2025-12-31T...",
    "updatedAt": "2025-12-31T..."
  }
}
```

**Errores:**
- `404` - "Tipo de ticket no encontrado"

---

## Características

### Soft Delete
- Los tipos de ticket **nunca se eliminan físicamente**
- Se desactivan usando el campo `activo: false`
- Pueden reactivarse con el endpoint toggle

### Unicidad
- El campo `nombre` tiene constraint UNIQUE en la base de datos
- La validación se hace antes de crear/actualizar

### Timestamps Automáticos
- `created_at` se establece automáticamente al crear
- `updated_at` se actualiza automáticamente con trigger de PostgreSQL

---

## Tipos Iniciales

Al ejecutar la migración se crean 3 tipos por defecto:

1. **Incidente** - Problemas que requieren atención inmediata
2. **Requerimiento** - Solicitudes de servicio o cambios
3. **Consulta** - Preguntas o solicitudes de información

---

## Estructura del Módulo

```
src/modules/tipos-ticket/
├── models/
│   └── tipos-ticket.model.ts
├── repositories/
│   └── tipos-ticket.repository.ts
├── services/
│   └── tipos-ticket.service.ts
├── controllers/
│   └── tipos-ticket.controller.ts
└── routes/
    └── tipos-ticket.routes.ts
```

---

## Migración

**Archivo:** `migrations/057_create_tipos_ticket.sql`

**Script de ejecución:** `scripts/run_migration_057.js`

```bash
node scripts/run_migration_057.js
```

---

## Pruebas

**Script de prueba:** `scripts/test_tipos_ticket.js`

```bash
node scripts/test_tipos_ticket.js
```

Ejecuta pruebas para todos los endpoints.
