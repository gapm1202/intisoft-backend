# Contratos - Payloads para Frontend

## Rutas Base
Todas bajo: `/api/empresas/:empresaId/contratos/:contractId`
- Requieren autenticación (`Authorization: Bearer <token>`)
- Requieren rol `administrador` para modificaciones
- **IMPORTANTE:** Todos los PATCH/POST de edición requieren campo `motivo` (obligatorio, no vacío)

---

## 0. GET - Contrato Activo (CRÍTICO para carga inicial)
**Ruta:** `GET /api/empresas/:empresaId/contratos/activo`

**Descripción:** Obtiene el contrato activo de la empresa con todos sus datos (base, servicios, preventivo, económicos, documentos, historial). **Usar este endpoint al cargar la página** para saber qué contractId usar y prellenar formularios.

**Respuesta si existe:**
```json
{
  "id": 5,
  "empresaId": 1,
  "tipoContrato": "servicios",
  "estadoContrato": "activo",
  "fechaInicio": "2025-01-01",
  "fechaFin": "2025-12-31",
  "renovacionAutomatica": true,
  "responsableComercial": "Juan Pérez",
  "observaciones": "...",
  "createdAt": "2025-01-01T10:00:00Z",
  "updatedAt": "2025-06-15T14:30:00Z",
  "createdBy": "admin@intisoft.com",
  "updatedBy": "admin@intisoft.com",
  "services": { "soporteRemoto": true, ... },
  "preventivePolicy": { "incluyePreventivo": true, ... },
  "economics": { "tipoFacturacion": "mensual", ... },
  "documents": [ { "id": 1, "filename": "contrato.pdf", ... } ],
  "history": [ { "id": 100, "campo": "estado_contrato", ... } ]
}
```

**Respuesta si NO existe:** `404 { "message": "No hay contrato activo para esta empresa" }`

**Ejemplo cURL:**
```bash
curl -X GET "http://localhost:4000/api/empresas/1/contratos/activo" \
  -H "Authorization: Bearer $TOKEN"
```

**Flujo Frontend:**
```javascript
// Al cargar página de contratos
const response = await fetch(`/api/empresas/${empresaId}/contratos/activo`, {
  headers: { 'Authorization': `Bearer ${token}` }
});

if (response.ok) {
  const contrato = await response.json();
  // Prellenar formularios con contrato.services, contrato.preventivePolicy, etc.
  // Guardar contrato.id para usar en PATCH
} else if (response.status === 404) {
  // No hay contrato activo → mostrar botón "Crear Contrato" que llame a POST
}
```

---

## 0b. POST - Crear Contrato (si no existe activo)
**Ruta:** `POST /api/empresas/:empresaId/contratos`

**Descripción:** Crea el primer contrato activo para la empresa. Solo puede haber 1 contrato activo por empresa (violación → 400).

**Payload mínimo:**
```json
{
  "tipoContrato": "servicios",
  "estadoContrato": "activo",
  "fechaInicio": "2025-01-01",
  "fechaFin": "2025-12-31"
}
```

**Payload completo (opcional):**
```json
{
  "tipoContrato": "servicios",
  "estadoContrato": "activo",
  "fechaInicio": "2025-01-01",
  "fechaFin": "2025-12-31",
  "renovacionAutomatica": true,
  "responsableComercial": "Juan Pérez",
  "observaciones": "Contrato inicial",
  "services": {
    "soporteRemoto": true,
    "soportePresencial": false,
    "horasMensualesIncluidas": 10
  },
  "preventivePolicy": {
    "incluyePreventivo": true,
    "frecuencia": "6m",
    "modalidad": "presencial"
  },
  "economics": {
    "tipoFacturacion": "mensual",
    "moneda": "PEN",
    "montoReferencial": 1500,
    "diaFacturacion": 5
  }
}
```

**Respuesta:** Contrato creado con todos los detalles (201)

**Ejemplo cURL:**
```bash
curl -X POST "http://localhost:4000/api/empresas/1/contratos" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tipoContrato": "servicios",
    "estadoContrato": "activo",
    "fechaInicio": "2025-01-01",
    "fechaFin": "2025-12-31"
  }'
```

---

## 1. PATCH - Datos Generales del Contrato
**Ruta:** `PATCH /api/empresas/:empresaId/contratos/:contractId`

**Payload:**
```json
{
  "tipoContrato": "servicios",
  "fechaInicio": "2025-01-01",
  "fechaFin": "2025-12-31",
  "renovacionAutomatica": true,
  "responsableComercial": "Juan Pérez",
  "observaciones": "Renovación anual automática",
  "motivo": "Actualización de fechas por extensión de contrato"
}
```

**Campos:**
- `tipoContrato`: `"servicios" | "bolsa_horas" | "proyecto" | "otro"`
- `estadoContrato`: NO se cambia aquí (usar endpoint específico de estado)
- `fechaInicio`: `"YYYY-MM-DD"`
- `fechaFin`: `"YYYY-MM-DD"` (debe ser >= fechaInicio)
- `renovacionAutomatica`: `true | false`
- `responsableComercial`: string o null
- `observaciones`: string o null
- `motivo`: **OBLIGATORIO**, string no vacío

**Respuesta:** Contrato actualizado (objeto ContractBase)

**Ejemplo cURL:**
```bash
curl -X PATCH "http://localhost:4000/api/empresas/1/contratos/5" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fechaFin": "2026-12-31",
    "renovacionAutomatica": true,
    "motivo": "Extensión de contrato por 1 año"
  }'
```

---

## 2. PATCH - Servicios Incluidos
**Ruta:** `PATCH /api/empresas/:empresaId/contratos/:contractId/servicios`

**Payload:**
```json
{
  "soporteRemoto": true,
  "soportePresencial": true,
  "mantenimientoPreventivo": true,
  "gestionInventario": false,
  "gestionCredenciales": true,
  "monitoreo": true,
  "informesMensuales": true,
  "gestionAccesos": false,
  "horasMensualesIncluidas": 10,
  "excesoHorasFacturable": true,
  "motivo": "Añadido soporte presencial y monitoreo"
}
```

**Campos:**
- Todos los flags: `true | false`
- `horasMensualesIncluidas`: número >= 0 o null
  - **IMPORTANTE:** Si `tipoContrato = "bolsa_horas"`, este campo es obligatorio
- `excesoHorasFacturable`: `true | false`
- `motivo`: **OBLIGATORIO**

**Respuesta:** Objeto ContractServices actualizado

**Ejemplo cURL:**
```bash
curl -X PATCH "http://localhost:4000/api/empresas/1/contratos/5/servicios" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "soporteRemoto": true,
    "horasMensualesIncluidas": 15,
    "motivo": "Incremento de horas mensuales incluidas"
  }'
```

---

## 3. PATCH - Política Preventiva
**Ruta:** `PATCH /api/empresas/:empresaId/contratos/:contractId/preventivo`

**Payload:**
```json
{
  "incluyePreventivo": true,
  "frecuencia": "6m",
  "modalidad": "mixto",
  "aplica": "todos",
  "observaciones": "Mantenimientos preventivos semestrales mixtos",
  "motivo": "Activación de política preventiva"
}
```

**Campos:**
- `incluyePreventivo`: `true | false`
- `frecuencia`: `"3m" | "6m" | "8m" | "12m"` o null
- `modalidad`: `"presencial" | "remoto" | "mixto"` o null
- `aplica`: `"todos" | "categoria"` o null
- `observaciones`: string o null
- `motivo`: **OBLIGATORIO**

**Respuesta:** Objeto ContractPreventivePolicy actualizado

**Ejemplo cURL:**
```bash
curl -X PATCH "http://localhost:4000/api/empresas/1/contratos/5/preventivo" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "incluyePreventivo": true,
    "frecuencia": "6m",
    "modalidad": "presencial",
    "motivo": "Cambio a preventivos presenciales semestrales"
  }'
```

---

## 4. PATCH - Condiciones Económicas
**Ruta:** `PATCH /api/empresas/:empresaId/contratos/:contractId/economicos`

**Payload:**
```json
{
  "tipoFacturacion": "mensual",
  "moneda": "PEN",
  "montoReferencial": 1500.00,
  "diaFacturacion": 5,
  "observaciones": "Pago el 5 de cada mes",
  "motivo": "Ajuste de monto referencial"
}
```

**Campos:**
- `tipoFacturacion`: `"mensual" | "por_evento" | "por_horas"`
- `moneda`: `"PEN" | "USD"`
- `montoReferencial`: número > 0 o null
- `diaFacturacion`: número entre 1-31 o null
- `observaciones`: string o null
- `motivo`: **OBLIGATORIO**

**Respuesta:** Objeto ContractEconomics actualizado

**Ejemplo cURL:**
```bash
curl -X PATCH "http://localhost:4000/api/empresas/1/contratos/5/economicos" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "montoReferencial": 1800.00,
    "motivo": "Ajuste por inflación 2025"
  }'
```

---

## 5. POST - Subir Documentos
**Ruta:** `POST /api/empresas/:empresaId/contratos/:contractId/documentos`

**Content-Type:** `multipart/form-data`

**Campos del form:**
- `files`: uno o más archivos (cualquier nombre de campo acepta archivos con `upload.any()`)
- `tipo`: string (`"contrato_firmado" | "anexo" | "addenda" | "otro"`) - por defecto `"otro"`
- `motivo`: **OBLIGATORIO**, string no vacío

**Respuesta:** Array de documentos en el formato que espera el frontend:
```json
[
  {
    "id": 1,
    "nombre": "contrato_firmado.pdf",
    "url": "http://localhost:4000/uploads/1234567-contrato_firmado.pdf",
    "fechaSubida": "2025-12-16T21:40:00Z",
    "usuarioSubida": "admin@intisoft.com",
    "tipo": "contrato_firmado",
    "path": "1234567-contrato_firmado.pdf",
    "mimeType": "application/pdf",
    "sizeBytes": 245780,
    "version": null
  }
]
```

**Campos mapeados para el frontend:**
- `nombre`: nombre del archivo (de filename)
- `url`: URL completa para descargar/abrir el documento
- `fechaSubida`: fecha y hora de carga (ISO format)
- `usuarioSubida`: email del usuario que cargó el documento

**Ejemplo cURL:**
```bash
curl -X POST "http://localhost:4000/api/empresas/1/contratos/5/documentos" \
  -H "Authorization: Bearer $TOKEN" \
  -F "files=@contrato_firmado.pdf" \
  -F "files=@anexo_1.pdf" \
  -F "tipo=contrato_firmado" \
  -F "motivo=Configuración inicial de servicios incluidos"
```

**Ejemplo JavaScript (fetch):**
```javascript
const formData = new FormData();
formData.append('files', file1); // File object from input
formData.append('files', file2);
formData.append('tipo', 'contrato');
formData.append('motivo', 'Subida de documentos iniciales');

fetch(`http://localhost:4000/api/empresas/1/contratos/5/documentos`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
})
.then(res => res.json())
.then(docs => console.log(docs));
```

---

## 6. DELETE - Eliminar Documento
**Ruta:** `DELETE /api/empresas/:empresaId/contratos/:contractId/documentos/:docId`

**Payload (body o query):**
```json
{
  "motivo": "Documento obsoleto, reemplazado por versión actualizada"
}
```

**Campos:**
- `motivo`: **OBLIGATORIO**, puede ir en body JSON o query string

**Respuesta:** `{ "message": "Documento eliminado", "data": {...} }`

**Ejemplo cURL (motivo en body):**
```bash
curl -X DELETE "http://localhost:4000/api/empresas/1/contratos/5/documentos/12" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "motivo": "Documento duplicado" }'
```

**Ejemplo cURL (motivo en query):**
```bash
curl -X DELETE "http://localhost:4000/api/empresas/1/contratos/5/documentos/12?motivo=Documento%20obsoleto" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Resumen de Rutas

| Acción | Método | Ruta | Motivo obligatorio |
|--------|--------|------|-------------------|
| **Obtener contrato activo** | **GET** | `/api/empresas/:empresaId/contratos/activo` | ❌ No |
| **Crear contrato** | **POST** | `/api/empresas/:empresaId/contratos` | ❌ No |
| Editar generales | PATCH | `/api/empresas/:empresaId/contratos/:contractId` | ✅ Sí |
| Editar servicios | PATCH | `/api/empresas/:empresaId/contratos/:contractId/servicios` | ✅ Sí |
| Editar preventivo | PATCH | `/api/empresas/:empresaId/contratos/:contractId/preventivo` | ✅ Sí |
| Editar económicos | PATCH | `/api/empresas/:empresaId/contratos/:contractId/economicos` | ✅ Sí |
| Subir documentos | POST | `/api/empresas/:empresaId/contratos/:contractId/documentos` | ✅ Sí |
| Eliminar documento | DELETE | `/api/empresas/:empresaId/contratos/:contractId/documentos/:docId` | ✅ Sí |

---

## Notas Importantes para FE

1. **Flujo completo de integración:**
   ```
   Al cargar página:
   → GET /api/empresas/:empresaId/contratos/activo
   → Si 200: prellenar formularios con datos, guardar contractId
   → Si 404: mostrar botón "Crear Contrato" → POST /api/empresas/:empresaId/contratos
   
   Al guardar cambios (botón "Guardar"):
   → PATCH /api/empresas/:empresaId/contratos/:contractId (datos generales)
   → PATCH .../servicios (servicios incluidos)
   → PATCH .../preventivo (política preventiva)
   → PATCH .../economicos (condiciones económicas)
   
   Al subir documento:
   → POST .../documentos (multipart)
   
   Al eliminar documento:
   → DELETE .../documentos/:docId
   ```

2. **Motivo siempre obligatorio:** Todos los endpoints de modificación validan que `motivo` esté presente y no sea vacío (400 si falta).

3. **Validaciones:**
   - `fechaFin >= fechaInicio`
   - `tipoContrato = "bolsa_horas"` → `horasMensualesIncluidas` obligatorio
   - `diaFacturacion`: entre 1-31
   - `montoReferencial`: debe ser > 0 si se envía

3. **Catálogos cerrados (usar selects):**
   - `tipoContrato`: servicios, bolsa_horas, proyecto, otro
   - `estadoContrato`: activo, suspendido, vencido, historico
   - `frecuencia`: 3m, 6m, 8m, 12m
   - `modalidad`: presencial, remoto, mixto
   - `aplica`: todos, categoria
   - `tipoFacturacion`: mensual, por_evento, por_horas
   - `moneda`: PEN, USD
   - `tipo` (documentos): contrato, anexo, addenda, otro

4. **Auditoría automática:** Cada cambio se registra en `contract_history` con campo, valorAnterior, valorNuevo, usuario, motivo, tipoCambio.

5. **Respuestas:** Todos los PATCH devuelven el objeto actualizado (ContractBase, ContractServices, etc.); POST documentos devuelve array de documentos guardados.

6. **Errores comunes:**
   - 400: motivo faltante o validación fallida
   - 401: token inválido/expirado
   - 403: rol insuficiente (no administrador)
   - 404: contrato o documento no encontrado
   - 500: error servidor (revisar logs)
