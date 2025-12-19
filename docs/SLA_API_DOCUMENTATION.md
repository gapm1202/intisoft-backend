# 📋 SLA Module - Complete API Documentation

## Overview
The SLA (Service Level Agreement) module provides a comprehensive management system for SLA configurations with full audit tracking and history management. The module supports 7 different configuration sections, automatic history tracking, and role-based access control.

## Database Schema

### Table: `sla_configuracion`
Stores SLA configurations for each enterprise.

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL PRIMARY KEY | Unique identifier |
| `empresa_id` | INTEGER NOT NULL FK | Reference to empresas table |
| `alcance` | JSONB | SLA scope configuration |
| `gestion_incidentes` | JSONB | Incident management settings |
| `tiempos` | JSONB | Time and SLA response/resolution times |
| `horarios` | JSONB | Working hours configuration |
| `requisitos` | JSONB | Requirements and obligations |
| `exclusiones` | JSONB | Exclusion flags |
| `alertas` | JSONB | Alert thresholds and notifications |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |
| `deleted_at` | TIMESTAMP | Soft delete timestamp |

### Table: `historial_sla`
Audit trail for all SLA configuration changes.

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL PRIMARY KEY | Unique identifier |
| `empresa_id` | INTEGER NOT NULL FK | Reference to empresas table |
| `sla_configuracion_id` | INTEGER NOT NULL FK | Reference to sla_configuracion |
| `seccion` | VARCHAR(50) CHECK | Section: alcance\|incidentes\|tiempos\|horarios\|requisitos\|exclusiones\|alertas |
| `campo` | VARCHAR(255) | Field name that changed |
| `valor_anterior` | TEXT | Previous value (JSON serialized) |
| `valor_nuevo` | TEXT | New value (JSON serialized) |
| `motivo` | VARCHAR(500) | Reason for change |
| `usuario` | VARCHAR(255) | User who made the change |
| `usuario_id` | INTEGER | User ID |
| `created_at` | TIMESTAMP | Change timestamp |

---

## API Endpoints

### 1. GET `/api/sla/configuracion/:empresaId`
Retrieve the current SLA configuration for an enterprise.

**Request:**
```bash
GET /api/sla/configuracion/123
```

**Response (200 OK):**
```json
{
  "id": 1,
  "empresaId": 123,
  "alcance": {
    "slaActivo": true,
    "aplicaA": "incidentes",
    "tipoServicioCubierto": "incidente",
    "serviciosCubiertos": {
      "soporteRemoto": true,
      "soportePresencial": false,
      "atencionEnSede": true
    },
    "activosCubiertos": {
      "tipo": "porCategoria",
      "categorias": ["PC", "Servidor"],
      "categoriasPersonalizadas": ["Tablet"]
    },
    "sedesCubiertas": {
      "tipo": "seleccionadas",
      "sedes": [1, 2, 3]
    },
    "observaciones": "SLA aplicable a incidentes críticos"
  },
  "gestionIncidentes": { ... },
  "tiempos": { ... },
  "horarios": { ... },
  "requisitos": { ... },
  "exclusiones": { ... },
  "alertas": { ... },
  "createdAt": "2025-12-17T10:00:00Z",
  "updatedAt": "2025-12-17T10:00:00Z"
}
```

**Response (null) if not exists:**
```json
null
```

---

### 2. POST `/api/sla/configuracion/:empresaId`
Create or update complete SLA configuration.

**Request:**
```bash
POST /api/sla/configuracion/123
Content-Type: application/json

{
  "alcance": { ... },
  "gestionIncidentes": { ... },
  "tiempos": { ... },
  "horarios": { ... },
  "requisitos": { ... },
  "exclusiones": { ... },
  "alertas": { ... }
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "empresaId": 123,
  ... (complete configuration)
}
```

**Errors:**
- `400 Bad Request` - Invalid data format
- `500 Internal Server Error` - Database error

---

### 3. POST `/api/sla/seccion/:empresaId`
Update a specific SLA section and create history entry.

**Request:**
```bash
POST /api/sla/seccion/123
Content-Type: application/json

{
  "seccion": "alcance",
  "data": {
    "slaActivo": true,
    "aplicaA": "incidentes",
    ...
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "slaActivo": true,
    "aplicaA": "incidentes",
    ...
  }
}
```

**Auto-created History Entry:**
```
campo: "Alcance del SLA"
valorAnterior: (previous value as JSON)
valorNuevo: (new value as JSON)
motivo: "Guardado"
usuario: (current user)
usuarioId: (current user ID)
```

**Valid Sections:**
- `alcance` → "Alcance del SLA"
- `incidentes` → "Gestión de Incidentes"
- `tiempos` → "Tiempos"
- `horarios` → "Horarios"
- `requisitos` → "Requisitos"
- `exclusiones` → "Exclusiones"
- `alertas` → "Alertas"

---

### 4. POST `/api/sla/editar/:empresaId`
Register that user wants to edit a section (records reason).

**Request:**
```bash
POST /api/sla/editar/123
Content-Type: application/json

{
  "seccion": "alcance",
  "motivo": "Actualizar cobertura de servicios"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "editPermission": true
}
```

**Auto-created History Entry:**
```
campo: "Alcance del SLA"
valorAnterior: "Guardado"
valorNuevo: "Editando"
motivo: "Actualizar cobertura de servicios"
usuario: (current user)
usuarioId: (current user ID)
```

---

### 5. POST `/api/sla/limpiar/:empresaId`
Clear/reset a section to default values.

**Request:**
```bash
POST /api/sla/limpiar/123
Content-Type: application/json

{
  "seccion": "alcance"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "defaultValues": {
    "slaActivo": false,
    "aplicaA": "incidentes",
    "tipoServicioCubierto": "incidente",
    "serviciosCubiertos": {
      "soporteRemoto": false,
      "soportePresencial": false,
      "atencionEnSede": false
    },
    "activosCubiertos": {
      "tipo": "todos",
      "categorias": [],
      "categoriasPersonalizadas": []
    },
    "sedesCubiertas": {
      "tipo": "todas",
      "sedes": []
    },
    "observaciones": ""
  }
}
```

---

### 6. GET `/api/sla/historial/:empresaId`
Retrieve SLA change history with pagination and optional filtering.

**Request:**
```bash
GET /api/sla/historial/123?limit=50&skip=0&seccion=alcance
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | 100 | Max results (1-1000) |
| `skip` | number | 0 | Pagination offset |
| `seccion` | string | optional | Filter by section |

**Response (200 OK):**
```json
{
  "total": 15,
  "items": [
    {
      "id": 15,
      "empresaId": 123,
      "slaConfiguracionId": 1,
      "seccion": "alcance",
      "campo": "Alcance del SLA",
      "valorAnterior": "{\"slaActivo\":false,...}",
      "valorNuevo": "{\"slaActivo\":true,...}",
      "motivo": "Guardado",
      "usuario": "Juan Pérez",
      "usuarioId": 5,
      "createdAt": "2025-12-17T10:30:00Z"
    },
    ...
  ]
}
```

**History Table Display Format:**

| Campo | Valor Anterior | Valor Nuevo | Motivo | Usuario | Fecha |
|-------|---|---|---|---|---|
| Alcance del SLA | {...} | {...} | Guardado | Juan Pérez | 17/12/2025 10:30:00 |
| Gestión de Incidentes | {...} | {...} | Actualizar categoría | María López | 17/12/2025 09:15:00 |

---

### 7. DELETE `/api/sla/configuracion/:empresaId`
Soft delete SLA configuration (marks with deleted_at timestamp).

**Request:**
```bash
DELETE /api/sla/configuracion/123
```

**Response (200 OK):**
```json
{
  "success": true
}
```

---

## Data Structures

### Alcance (Scope)
```typescript
{
  slaActivo: boolean;
  aplicaA: "incidentes"; // fixed value
  tipoServicioCubierto: "incidente" | "incidenteCritico";
  serviciosCubiertos: {
    soporteRemoto: boolean;
    soportePresencial: boolean;
    atencionEnSede: boolean;
  };
  activosCubiertos: {
    tipo: "todos" | "porCategoria";
    categorias: string[]; // e.g., ["PC", "Servidor", "Router"]
    categoriasPersonalizadas: string[]; // e.g., ["Tablet", "Escáner"]
  };
  sedesCubiertas: {
    tipo: "todas" | "seleccionadas";
    sedes: number[]; // sede IDs
  };
  observaciones?: string;
}
```

### Gestión Incidentes
```typescript
{
  tipos: {
    hardware: boolean;
    software: boolean;
    red: boolean;
    accesos: boolean;
    otros: boolean;
  };
  categoriaITIL?: "usuario" | "infraestructura" | "aplicacion" | "seguridad";
  impacto: "alto" | "medio" | "bajo";
  urgencia: "alta" | "media" | "baja";
  prioridadCalculada: "Alta" | "Media" | "Baja";
}
```

### Tiempos
```typescript
{
  medicionSLA: "horasHabiles" | "horasCalendario";
  tiemposPorPrioridad: [
    {
      prioridad: "critica" | "alta" | "media" | "baja";
      tiempoRespuesta: string; // e.g., "1 hora"
      tiempoResolucion: string; // e.g., "4 horas"
      modalidad: "remoto" | "presencial" | "mixto";
      escalamiento: boolean;
      tiempoEscalamiento?: string; // optional
    },
    ...
  ];
}
```

### Horarios
```typescript
{
  dias: string[]; // ["Lunes", "Martes", ...]
  horaInicio: string; // "08:00"
  horaFin: string; // "18:00"
  atencionFueraHorario: boolean;
  aplicaSLAFueraHorario: boolean;
  excluirFeriados: boolean;
  calendarioFeriados: string[]; // ["1 de Enero - Año Nuevo", ...]
}
```

### Requisitos
```typescript
{
  obligacionesCliente: {
    autorizarIntervencion: boolean;
    accesoEquipo: boolean;
    infoClara: boolean;
  };
  condicionesTecnicas: {
    equipoEncendido: boolean;
    conectividadActiva: boolean;
    accesoRemoto: boolean;
  };
  responsabilidadesProveedor: {
    tecnicoAsignado: boolean;
    registroAtencion: boolean;
    informeTecnico: boolean;
  };
}
```

### Exclusiones
```typescript
{
  flags: {
    pendienteRespuestaCliente: boolean;
    esperandoRepuestos: boolean;
    esperandoProveedorExterno: boolean;
    fueraDeAlcance: boolean;
    fuerzaMayor: boolean;
  };
}
```

### Alertas
```typescript
{
  umbrales: number[]; // e.g., [50, 75, 90]
  notificarA: {
    tecnicoAsignado: boolean;
    supervisor: boolean; // "Administrador" in UI
  };
  accionAutomatica: "notificar" | "escalar";
  estadosVisibles: string[]; // ["🟢 Cumpliendo", "🟡 En riesgo", "🔴 Incumplido"]
}
```

---

## Default Values

```javascript
{
  alcance: {
    slaActivo: false,
    aplicaA: 'incidentes',
    tipoServicioCubierto: 'incidente',
    serviciosCubiertos: { soporteRemoto: false, soportePresencial: false, atencionEnSede: false },
    activosCubiertos: { tipo: 'todos', categorias: [], categoriasPersonalizadas: [] },
    sedesCubiertas: { tipo: 'todas', sedes: [] },
    observaciones: ''
  },
  gestionIncidentes: {
    tipos: { hardware: false, software: false, red: false, accesos: false, otros: false },
    impacto: 'medio',
    urgencia: 'media',
    prioridadCalculada: 'Media'
  },
  tiempos: {
    medicionSLA: 'horasHabiles',
    tiemposPorPrioridad: []
  },
  horarios: {
    dias: [],
    horaInicio: '08:00',
    horaFin: '18:00',
    atencionFueraHorario: false,
    aplicaSLAFueraHorario: false,
    excluirFeriados: true,
    calendarioFeriados: []
  },
  requisitos: {
    obligacionesCliente: { autorizarIntervencion: false, accesoEquipo: false, infoClara: false },
    condicionesTecnicas: { equipoEncendido: false, conectividadActiva: false, accesoRemoto: false },
    responsabilidadesProveedor: { tecnicoAsignado: false, registroAtencion: false, informeTecnico: false }
  },
  exclusiones: {
    flags: {
      pendienteRespuestaCliente: false,
      esperandoRepuestos: false,
      esperandoProveedorExterno: false,
      fueraDeAlcance: false,
      fuerzaMayor: false
    }
  },
  alertas: {
    umbrales: [50, 75, 90],
    notificarA: { tecnicoAsignado: true, supervisor: true },
    accionAutomatica: 'notificar',
    estadosVisibles: ['🟢 Cumpliendo', '🟡 En riesgo', '🔴 Incumplido']
  }
}
```

---

## Frontend Integration Workflow

### 🔵 Step 1: Save Form (any of 7 sections)
1. Frontend POST to `/api/sla/seccion/:empresaId`
2. Backend validates and updates section
3. Backend auto-creates HistorialSLA entry with:
   - `valorAnterior`: previous state (JSON)
   - `valorNuevo`: new state (JSON)
   - `motivo`: "Guardado"
4. Backend returns updated section
5. Frontend:
   - Hides form (opacity-60, pointer-events-none)
   - Shows "Editar" button
   - Updates Historial table

### 🟡 Step 2: Edit Click
1. Frontend shows modal for reason
2. User enters reason
3. Frontend POST to `/api/sla/editar/:empresaId` with reason
4. Backend creates HistorialSLA entry:
   - `valorAnterior`: "Guardado"
   - `valorNuevo`: "Editando"
   - `motivo`: user-provided reason
5. Frontend:
   - Closes modal
   - Enables form (removes opacity-60, pointer-events-none)
   - Hides "Editar" button

### 🟢 Step 3: Clear Section
1. Frontend POST to `/api/sla/limpiar/:empresaId`
2. Backend returns default values
3. Frontend resets form to defaults

### 📊 History Table Display
Columns (from HistorialSLA):
- **Campo** (field name)
- **Valor anterior** (previous value)
- **Valor nuevo** (new value)
- **Motivo** (change reason)
- **Usuario** (who made change)
- **Fecha** (change date - format: DD/MM/YYYY HH:MM:SS)

Sorted: DESC by created_at (most recent first)

---

## Validations

### ✅ Backend Validations

**All Endpoints:**
- `empresaId` must exist in empresas table
- User must have permission to edit SLA for that company
- No empty/null fields (except optional fields)

**Section-Specific:**
- `alcance.aplicaA` must be "incidentes"
- `gestionIncidentes.tipos` must be an object
- `tiempos.medicionSLA` must be "horasHabiles" or "horasCalendario"
- `tiempos.tiemposPorPrioridad` must be an array
- `horarios.dias` must be an array
- `requisitos` must include all 3 sub-objects
- `exclusiones.flags` must be an object
- `alertas.umbrales` must be an array
- `alertas.accionAutomatica` must be "notificar" or "escalar"

### ✅ Frontend Validations
- Form-level validations (already implemented)
- Backend rejects invalid requests with 400/403 status

---

## Error Codes

| Code | Message | Cause |
|------|---------|-------|
| 400 | Bad Request | Invalid data format |
| 400 | empresaId es requerido | Missing empresaId param |
| 400 | seccion es requerida | Missing seccion field |
| 400 | seccion inválida | Invalid section name |
| 400 | motivo es requerido | Missing motivo on edit |
| 500 | Database error | Internal server error |

---

## Example Usage

### Create Initial Configuration
```bash
curl -X POST http://localhost:4000/api/sla/configuracion/123 \
  -H "Content-Type: application/json" \
  -d '{
    "alcance": {
      "slaActivo": true,
      "aplicaA": "incidentes",
      "tipoServicioCubierto": "incidente",
      "serviciosCubiertos": {
        "soporteRemoto": true,
        "soportePresencial": true,
        "atencionEnSede": false
      },
      "activosCubiertos": {
        "tipo": "porCategoria",
        "categorias": ["PC", "Servidor"],
        "categoriasPersonalizadas": []
      },
      "sedesCubiertas": {
        "tipo": "todas",
        "sedes": []
      },
      "observaciones": "SLA inicial"
    },
    "gestionIncidentes": { ... },
    "tiempos": { ... },
    "horarios": { ... },
    "requisitos": { ... },
    "exclusiones": { ... },
    "alertas": { ... }
  }'
```

### Update Alcance Section
```bash
curl -X POST http://localhost:4000/api/sla/seccion/123 \
  -H "Content-Type: application/json" \
  -d '{
    "seccion": "alcance",
    "data": {
      "slaActivo": true,
      ...
    }
  }'
```

### Get History
```bash
curl -X GET "http://localhost:4000/api/sla/historial/123?limit=50&seccion=alcance"
```

---

## Testing Checklist

- [ ] Create enterprise → Add SLA → Save Alcance → Verify in DB
- [ ] Edit Alcance → Enter reason → Verify in HistorialSLA
- [ ] Clear a section → Verify returns defaults
- [ ] Get history → Verify all operations appear
- [ ] Save multiple sections → Verify independent storage
- [ ] Permissions: Try editing another company's SLA → Should reject
