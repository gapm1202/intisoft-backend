# SLA Module - Quick Reference

## 📍 API Base URL
```
http://localhost:4000/api/sla
```

## 🔗 All Endpoints

### 1. Get Configuration
```bash
GET /configuracion/:empresaId
```
Returns: Full SLA config or null

### 2. Create/Update Configuration
```bash
POST /configuracion/:empresaId
Body: { alcance, gestionIncidentes, tiempos, horarios, requisitos, exclusiones, alertas }
```
Returns: Complete config (201 Created)

### 3. Update Section (auto-history)
```bash
POST /seccion/:empresaId
Body: { seccion: string, data: object }
```
Valid sections: alcance, incidentes, tiempos, horarios, requisitos, exclusiones, alertas

### 4. Record Edit Intention
```bash
POST /editar/:empresaId
Body: { seccion: string, motivo: string }
```

### 5. Reset to Defaults
```bash
POST /limpiar/:empresaId
Body: { seccion: string }
```

### 6. Get History
```bash
GET /historial/:empresaId?limit=100&skip=0&seccion=alcance
```
Returns: { total: number, items: HistorialSLA[] }

### 7. Delete Configuration
```bash
DELETE /configuracion/:empresaId
```

---

## 📊 Configuration Sections

| Section | Key Fields | Stores |
|---------|-----------|--------|
| **alcance** | slaActivo, tipoServicioCubierto, serviciosCubiertos, activosCubiertos, sedesCubiertas | Scope of SLA |
| **incidentes** | tipos, impacto, urgencia, prioridadCalculada | Incident handling |
| **tiempos** | medicionSLA, tiemposPorPrioridad (4 levels) | Response/resolution SLAs |
| **horarios** | dias, horaInicio, horaFin, feriados | Working hours |
| **requisitos** | obligacionesCliente, condicionesTecnicas, responsabilidadesProveedor | Requirements |
| **exclusiones** | flags for 5 exclusion types | Exclusion conditions |
| **alertas** | umbrales, notificarA, accionAutomatica | Alert configuration |

---

## 🔑 Key Validations

```
✅ Section names: 'alcance', 'incidentes', 'tiempos', 'horarios', 'requisitos', 'exclusiones', 'alertas'
✅ medicionSLA: 'horasHabiles' or 'horasCalendario'
✅ accionAutomatica: 'notificar' or 'escalar'
✅ aplicaA: fixed to 'incidentes'
✅ limit: 1-1000 (default 100)
✅ skip: >= 0 (default 0)
```

---

## 🔄 Workflow

```
1. GET /configuracion/123          ← Load current config
2. POST /editar/123                ← User clicks Edit + enters reason
3. POST /seccion/123               ← User clicks Save (auto-history created)
4. GET /historial/123              ← Display history table
5. POST /limpiar/123               ← User clicks Clear
```

---

## 📋 Response Formats

### History Entry
```json
{
  "id": 1,
  "empresaId": 123,
  "slaConfiguracionId": 1,
  "seccion": "alcance",
  "campo": "Alcance del SLA",
  "valorAnterior": "{...JSON...}",
  "valorNuevo": "{...JSON...}",
  "motivo": "Guardado",
  "usuario": "juan@ejemplo.com",
  "usuarioId": 5,
  "createdAt": "2025-12-17T10:00:00Z"
}
```

### Section Name Mapping
- alcance → "Alcance del SLA"
- incidentes → "Gestión de Incidentes"
- tiempos → "Tiempos"
- horarios → "Horarios"
- requisitos → "Requisitos"
- exclusiones → "Exclusiones"
- alertas → "Alertas"

---

## ⚠️ Error Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (invalid data) |
| 500 | Server Error |

### Common Errors
```
"seccion inválida"
"medicionSLA debe ser 'horasHabiles' o 'horasCalendario'"
"motivo es requerido"
"SLA Configuration not found"
```

---

## 🚀 Quick Test

```bash
# 1. Create config
curl -X POST http://localhost:4000/api/sla/configuracion/1 \
  -H "Content-Type: application/json" \
  -d '{ "alcance": {...}, ... }'

# 2. Get config
curl http://localhost:4000/api/sla/configuracion/1

# 3. Update alcance
curl -X POST http://localhost:4000/api/sla/seccion/1 \
  -H "Content-Type: application/json" \
  -d '{"seccion":"alcance","data":{...}}'

# 4. View history
curl http://localhost:4000/api/sla/historial/1
```

---

## 📂 File Locations

| File | Purpose |
|------|---------|
| `src/migrations/048_create_sla_tables.sql` | Database schema |
| `src/models/sla.model.ts` | TypeScript interfaces |
| `src/repositories/sla.repository.ts` | Database queries |
| `src/services/sla.service.ts` | Business logic |
| `src/controllers/sla.controller.ts` | HTTP handlers |
| `src/routes/sla.routes.ts` | Route definitions |
| `scripts/run_migration_048.js` | Migration runner |
| `docs/SLA_API_DOCUMENTATION.md` | Full API reference |
| `docs/SLA_EXAMPLE_PAYLOADS.md` | Example payloads |

---

## 💾 Database Info

**Tables:**
- `sla_configuracion` - Main configurations (7 JSONB columns)
- `historial_sla` - Audit trail

**Indexes:**
- idx_sla_config_empresa_id
- idx_historial_sla_empresa_id
- idx_historial_sla_config_id
- idx_historial_sla_created_at
- idx_historial_sla_seccion

---

## 🔧 Maintenance

```bash
# Run migration
node scripts/run_migration_048.js

# Compile TypeScript
npx tsc --noEmit

# Start server
npm run dev
```

---

## 📞 Support Resources

1. **Full Documentation:** `docs/SLA_API_DOCUMENTATION.md`
2. **Example Payloads:** `docs/SLA_EXAMPLE_PAYLOADS.md`
3. **Implementation Guide:** `docs/SLA_IMPLEMENTATION_SUMMARY.md`
4. **This Reference:** `docs/SLA_QUICK_REFERENCE.md`

---

## ✅ Status
🟢 **READY FOR PRODUCTION**

Migration applied ✅  
TypeScript compiled ✅  
All endpoints tested ✅  
Documentation complete ✅
