# SLA API - Example Payloads and Test Cases

## 1. Create Complete SLA Configuration

### Request
```bash
curl -X POST http://localhost:4000/api/sla/configuracion/1 \
  -H "Content-Type: application/json" \
  -d '{
  "alcance": {
    "slaActivo": true,
    "aplicaA": "incidentes",
    "tipoServicioCubierto": "incidente",
    "serviciosCubiertos": {
      "soporteRemoto": true,
      "soportePresencial": true,
      "atencionEnSede": true
    },
    "activosCubiertos": {
      "tipo": "porCategoria",
      "categorias": ["PC", "Servidor", "Router", "Switch"],
      "categoriasPersonalizadas": ["Tablet", "Escáner"]
    },
    "sedesCubiertas": {
      "tipo": "seleccionadas",
      "sedes": [1, 2, 3]
    },
    "observaciones": "SLA aplicable a incidentes críticos e importantes en sedes principales"
  },
  "gestionIncidentes": {
    "tipos": {
      "hardware": true,
      "software": true,
      "red": true,
      "accesos": true,
      "otros": false
    },
    "categoriaITIL": "infraestructura",
    "impacto": "alto",
    "urgencia": "alta",
    "prioridadCalculada": "Alta"
  },
  "tiempos": {
    "medicionSLA": "horasHabiles",
    "tiemposPorPrioridad": [
      {
        "prioridad": "critica",
        "tiempoRespuesta": "1 hora",
        "tiempoResolucion": "4 horas",
        "modalidad": "presencial",
        "escalamiento": true,
        "tiempoEscalamiento": "30 minutos"
      },
      {
        "prioridad": "alta",
        "tiempoRespuesta": "2 horas",
        "tiempoResolucion": "8 horas",
        "modalidad": "mixto",
        "escalamiento": true,
        "tiempoEscalamiento": "1 hora"
      },
      {
        "prioridad": "media",
        "tiempoRespuesta": "4 horas",
        "tiempoResolucion": "1 día",
        "modalidad": "remoto",
        "escalamiento": false
      },
      {
        "prioridad": "baja",
        "tiempoRespuesta": "1 día",
        "tiempoResolucion": "2 días",
        "modalidad": "remoto",
        "escalamiento": false
      }
    ]
  },
  "horarios": {
    "dias": ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"],
    "horaInicio": "08:00",
    "horaFin": "18:00",
    "atencionFueraHorario": true,
    "aplicaSLAFueraHorario": false,
    "excluirFeriados": true,
    "calendarioFeriados": [
      "1 de Enero - Año Nuevo",
      "6 de Enero - Reyes",
      "Viernes Santo",
      "1 de Mayo - Día del Trabajo",
      "Corpus Christi",
      "Sagrado Corazón",
      "15 de Agosto - Asunción",
      "8 de Diciembre - Inmaculada",
      "25 de Diciembre - Navidad"
    ]
  },
  "requisitos": {
    "obligacionesCliente": {
      "autorizarIntervencion": true,
      "accesoEquipo": true,
      "infoClara": true
    },
    "condicionesTecnicas": {
      "equipoEncendido": true,
      "conectividadActiva": true,
      "accesoRemoto": true
    },
    "responsabilidadesProveedor": {
      "tecnicoAsignado": true,
      "registroAtencion": true,
      "informeTecnico": true
    }
  },
  "exclusiones": {
    "flags": {
      "pendienteRespuestaCliente": false,
      "esperandoRepuestos": false,
      "esperandoProveedorExterno": false,
      "fueraDeAlcance": false,
      "fuerzaMayor": false
    }
  },
  "alertas": {
    "umbrales": [50, 75, 90],
    "notificarA": {
      "tecnicoAsignado": true,
      "supervisor": true
    },
    "accionAutomatica": "escalar",
    "estadosVisibles": ["🟢 Cumpliendo", "🟡 En riesgo", "🔴 Incumplido"]
  }
}'
```

### Response (201 Created)
```json
{
  "id": 1,
  "empresaId": 1,
  "alcance": { ... same as request ... },
  "gestionIncidentes": { ... same as request ... },
  "tiempos": { ... same as request ... },
  "horarios": { ... same as request ... },
  "requisitos": { ... same as request ... },
  "exclusiones": { ... same as request ... },
  "alertas": { ... same as request ... },
  "createdAt": "2025-12-17T10:00:00.000Z",
  "updatedAt": "2025-12-17T10:00:00.000Z"
}
```

---

## 2. Get Current SLA Configuration

### Request
```bash
curl -X GET http://localhost:4000/api/sla/configuracion/1
```

### Response (200 OK)
```json
{
  "id": 1,
  "empresaId": 1,
  "alcance": { ... },
  "gestionIncidentes": { ... },
  "tiempos": { ... },
  "horarios": { ... },
  "requisitos": { ... },
  "exclusiones": { ... },
  "alertas": { ... },
  "createdAt": "2025-12-17T10:00:00.000Z",
  "updatedAt": "2025-12-17T10:00:00.000Z"
}
```

### Response if not exists (200 OK)
```json
null
```

---

## 3. Update Single Section (Alcance)

### Request
```bash
curl -X POST http://localhost:4000/api/sla/seccion/1 \
  -H "Content-Type: application/json" \
  -d '{
  "seccion": "alcance",
  "data": {
    "slaActivo": true,
    "aplicaA": "incidentes",
    "tipoServicioCubierto": "incidente",
    "serviciosCubiertos": {
      "soporteRemoto": false,
      "soportePresencial": true,
      "atencionEnSede": true
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
    "observaciones": "Actualizada cobertura de servicios"
  }
}'
```

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "slaActivo": true,
    "aplicaA": "incidentes",
    "tipoServicioCubierto": "incidente",
    "serviciosCubiertos": {
      "soporteRemoto": false,
      "soportePresencial": true,
      "atencionEnSede": true
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
    "observaciones": "Actualizada cobertura de servicios"
  }
}
```

**Auto-created History Entry:**
```
slaConfiguracionId: 1
seccion: "alcance"
campo: "Alcance del SLA"
valorAnterior: "{\"slaActivo\":true,\"serviciosCubiertos\":{...},...}"
valorNuevo: "{\"slaActivo\":true,\"serviciosCubiertos\":{...},...}"
motivo: "Guardado"
usuario: "juan@ejemplo.com"
usuarioId: 5
created_at: 2025-12-17T10:05:00Z
```

---

## 4. Update Tiempos Section

### Request
```bash
curl -X POST http://localhost:4000/api/sla/seccion/1 \
  -H "Content-Type: application/json" \
  -d '{
  "seccion": "tiempos",
  "data": {
    "medicionSLA": "horasCalendario",
    "tiemposPorPrioridad": [
      {
        "prioridad": "critica",
        "tiempoRespuesta": "30 minutos",
        "tiempoResolucion": "2 horas",
        "modalidad": "presencial",
        "escalamiento": true,
        "tiempoEscalamiento": "15 minutos"
      },
      {
        "prioridad": "alta",
        "tiempoRespuesta": "1 hora",
        "tiempoResolucion": "4 horas",
        "modalidad": "mixto",
        "escalamiento": true,
        "tiempoEscalamiento": "30 minutos"
      },
      {
        "prioridad": "media",
        "tiempoRespuesta": "2 horas",
        "tiempoResolucion": "8 horas",
        "modalidad": "remoto",
        "escalamiento": false
      },
      {
        "prioridad": "baja",
        "tiempoRespuesta": "4 horas",
        "tiempoResolucion": "1 día",
        "modalidad": "remoto",
        "escalamiento": false
      }
    ]
  }
}'
```

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "medicionSLA": "horasCalendario",
    "tiemposPorPrioridad": [...]
  }
}
```

---

## 5. Record Edit Intention

### Request
```bash
curl -X POST http://localhost:4000/api/sla/editar/1 \
  -H "Content-Type: application/json" \
  -d '{
  "seccion": "alcance",
  "motivo": "Actualizar cobertura de servicios para sedes secundarias"
}'
```

### Response (200 OK)
```json
{
  "success": true,
  "editPermission": true
}
```

**Auto-created History Entry:**
```
slaConfiguracionId: 1
seccion: "alcance"
campo: "Alcance del SLA"
valorAnterior: "Guardado"
valorNuevo: "Editando"
motivo: "Actualizar cobertura de servicios para sedes secundarias"
usuario: "juan@ejemplo.com"
usuarioId: 5
created_at: 2025-12-17T10:10:00Z
```

---

## 6. Clear Section to Defaults

### Request
```bash
curl -X POST http://localhost:4000/api/sla/limpiar/1 \
  -H "Content-Type: application/json" \
  -d '{
  "seccion": "alcance"
}'
```

### Response (200 OK)
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

## 7. Get SLA History - No Filters

### Request
```bash
curl -X GET http://localhost:4000/api/sla/historial/1
```

### Response (200 OK)
```json
{
  "total": 8,
  "items": [
    {
      "id": 8,
      "empresaId": 1,
      "slaConfiguracionId": 1,
      "seccion": "alcance",
      "campo": "Alcance del SLA",
      "valorAnterior": "{\"slaActivo\":true,...}",
      "valorNuevo": "{\"slaActivo\":true,...}",
      "motivo": "Actualizar observaciones",
      "usuario": "juan@ejemplo.com",
      "usuarioId": 5,
      "createdAt": "2025-12-17T10:15:00.000Z"
    },
    {
      "id": 7,
      "empresaId": 1,
      "slaConfiguracionId": 1,
      "seccion": "alcance",
      "campo": "Alcance del SLA",
      "valorAnterior": "Guardado",
      "valorNuevo": "Editando",
      "motivo": "Actualizar cobertura",
      "usuario": "juan@ejemplo.com",
      "usuarioId": 5,
      "createdAt": "2025-12-17T10:10:00.000Z"
    },
    ...
  ]
}
```

---

## 8. Get SLA History - With Filters

### Request with Pagination
```bash
curl -X GET "http://localhost:4000/api/sla/historial/1?limit=5&skip=0"
```

### Request Filtered by Section
```bash
curl -X GET "http://localhost:4000/api/sla/historial/1?seccion=tiempos"
```

### Request with All Filters
```bash
curl -X GET "http://localhost:4000/api/sla/historial/1?limit=10&skip=5&seccion=alcance"
```

### Response (200 OK)
```json
{
  "total": 3,
  "items": [
    {
      "id": 6,
      "empresaId": 1,
      "slaConfiguracionId": 1,
      "seccion": "tiempos",
      "campo": "Tiempos",
      "valorAnterior": "{\"medicionSLA\":\"horasHabiles\",...}",
      "valorNuevo": "{\"medicionSLA\":\"horasCalendario\",...}",
      "motivo": "Cambiar medición a horas calendario",
      "usuario": "maria@ejemplo.com",
      "usuarioId": 6,
      "createdAt": "2025-12-17T09:50:00.000Z"
    },
    ...
  ]
}
```

---

## 9. Delete SLA Configuration

### Request
```bash
curl -X DELETE http://localhost:4000/api/sla/configuracion/1
```

### Response (200 OK)
```json
{
  "success": true
}
```

**Note:** This is a soft delete. The record is marked with `deleted_at` but not removed from the database.

---

## Error Cases

### Invalid Section Name
**Request:**
```bash
curl -X POST http://localhost:4000/api/sla/seccion/1 \
  -H "Content-Type: application/json" \
  -d '{
  "seccion": "seccion_invalida",
  "data": { }
}'
```

**Response (400 Bad Request):**
```json
{
  "error": "seccion inválida. Debe ser una de: alcance, incidentes, tiempos, horarios, requisitos, exclusiones, alertas"
}
```

### Missing Motivo on Edit
**Request:**
```bash
curl -X POST http://localhost:4000/api/sla/editar/1 \
  -H "Content-Type: application/json" \
  -d '{
  "seccion": "alcance"
}'
```

**Response (400 Bad Request):**
```json
{
  "error": "motivo es requerido"
}
```

### Invalid medicionSLA Value
**Request:**
```bash
curl -X POST http://localhost:4000/api/sla/seccion/1 \
  -H "Content-Type: application/json" \
  -d '{
  "seccion": "tiempos",
  "data": {
    "medicionSLA": "valor_invalido",
    "tiemposPorPrioridad": []
  }
}'
```

**Response (400 Bad Request):**
```json
{
  "error": "medicionSLA debe ser \"horasHabiles\" o \"horasCalendario\""
}
```

### Configuration Not Found
**Request:**
```bash
curl -X POST http://localhost:4000/api/sla/editar/999 \
  -H "Content-Type: application/json" \
  -d '{
  "seccion": "alcance",
  "motivo": "Editar"
}'
```

**Response (500 Internal Server Error):**
```json
{
  "error": "SLA Configuration not found"
}
```

---

## Frontend Integration Testing Flow

### 1. Initial Setup
```bash
# Create complete SLA configuration
POST /api/sla/configuracion/1 ← Full payload

# Verify it was saved
GET /api/sla/configuracion/1 ← Should return full config
```

### 2. Edit Workflow
```bash
# User clicks Edit on Alcance section
POST /api/sla/editar/1 ← { seccion: "alcance", motivo: "reason" }

# User saves the form
POST /api/sla/seccion/1 ← { seccion: "alcance", data: {...} }

# Check history
GET /api/sla/historial/1 ← Should show 2 new entries
```

### 3. Clear Workflow
```bash
# User clicks Clear
POST /api/sla/limpiar/1 ← { seccion: "alcance" }

# Frontend receives defaults and resets form
```

### 4. History Display
```bash
# Load history table
GET /api/sla/historial/1?limit=50&skip=0

# Filter by section
GET /api/sla/historial/1?seccion=alcance

# Format for display
- campo → "Field" column
- valorAnterior → "Previous Value" column
- valorNuevo → "New Value" column
- motivo → "Reason" column
- usuario → "User" column
- createdAt (formatted DD/MM/YYYY HH:MM:SS) → "Date" column
- Sort DESC by createdAt (most recent first)
```

---

## Postman Collection (Alternative)

```json
{
  "info": {
    "name": "SLA API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Create SLA Configuration",
      "request": {
        "method": "POST",
        "url": "http://localhost:4000/api/sla/configuracion/1",
        "body": { ... complete payload ... }
      }
    },
    {
      "name": "Get SLA Configuration",
      "request": {
        "method": "GET",
        "url": "http://localhost:4000/api/sla/configuracion/1"
      }
    },
    {
      "name": "Update Alcance",
      "request": {
        "method": "POST",
        "url": "http://localhost:4000/api/sla/seccion/1",
        "body": { ... alcance payload ... }
      }
    },
    ...
  ]
}
```

---

## Notes for Frontend Integration

1. **Serialization:** `valorAnterior` and `valorNuevo` are JSON strings, parse them for display:
   ```javascript
   const prev = JSON.parse(item.valorAnterior);
   const next = JSON.parse(item.valorNuevo);
   ```

2. **Date Formatting:** Convert `createdAt` ISO string to locale format:
   ```javascript
   new Date(item.createdAt).toLocaleString('es-ES')
   // Output: "17/12/2025 10:15:30"
   ```

3. **User Context:** Include user info in request (via middleware/auth):
   ```javascript
   req.user = { id: userId, nombre: userName };
   ```

4. **State Management:** Consider caching the SLA config to minimize API calls

5. **Loading States:** Show spinners during:
   - GET /configuracion (page load)
   - POST /seccion (form save)
   - POST /editar (modal submission)
   - GET /historial (table load)
