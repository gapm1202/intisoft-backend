# Contratos - Endpoints (v1.1)

## Rutas base
- Base: `/api/empresas/:empresaId/contratos`
- Auth: requiere token (roles: admin para crear/actualizar estado)

## Listar contratos de una empresa
GET /api/empresas/:empresaId/contratos

Ejemplo:
```
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/api/empresas/1/contratos
```

## Obtener contrato (con detalles)
GET /api/empresas/:empresaId/contratos/:contractId

## Crear contrato
POST /api/empresas/:empresaId/contratos

Body JSON mínimo:
```
{
  "tipoContrato": "servicios",   // servicios | bolsa_horas | proyecto | otro
  "estadoContrato": "activo",    // activo | suspendido | vencido | historico
  "fechaInicio": "2025-01-01",   // YYYY-MM-DD
  "fechaFin": "2025-12-31"       // >= fechaInicio
}
```

Campos opcionales:
```
{
  "renovacionAutomatica": true,
  "responsableComercial": "Juan Perez",
  "observaciones": "...",
  "services": {
    "soporteRemoto": true,
    "mantenimientoPreventivo": true,
    "horasMensualesIncluidas": 10
  },
  "preventivePolicy": {
    "incluyePreventivo": true,
    "frecuencia": "6m",       // 3m | 6m | 8m | 12m
    "modalidad": "mixto",     // presencial | remoto | mixto
    "aplica": "todos"         // todos | categoria
  },
  "economics": {
    "tipoFacturacion": "mensual", // mensual | por_evento | por_horas
    "montoReferencial": 1500,
    "moneda": "PEN",              // PEN | USD
    "diaFacturacion": 5
  },
  "documents": [
    { "filename": "contrato.pdf", "path": "/uploads/123.pdf", "tipo": "contrato", "version": "v1" }
  ]
}
```

Notas:
- Solo 1 contrato `activo` por empresa (se aplica constraint en DB). Si ya existe, retorna 400.
- Se registra auditoría de creación en `contract_history`.

Ejemplo cURL rápido:
```
TOKEN="..."
body='{
  "tipoContrato":"servicios",
  "estadoContrato":"activo",
  "fechaInicio":"2025-01-01",
  "fechaFin":"2025-12-31",
  "services": {"soporteRemoto": true}
}'

curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "$body" \
  http://localhost:4000/api/empresas/1/contratos | jq .
```

## Cambiar estado del contrato
PATCH /api/empresas/:empresaId/contratos/:contractId/estado

Body:
```
{ "estado": "suspendido", "motivo": "Falta de pago" }
```

- Valida `estado` y registra historial (`contract_history`) con `tipo_cambio = estado`.

## Editar datos generales
PATCH /api/empresas/:empresaId/contratos/:contractId
Body: campos generales + `motivo` obligatorio

## Editar servicios
PATCH /api/empresas/:empresaId/contratos/:contractId/servicios
Body: flags/horas + `motivo` obligatorio

## Editar preventivo
PATCH /api/empresas/:empresaId/contratos/:contractId/preventivo
Body: frecuencia/modalidad/aplica/observaciones + `motivo` obligatorio

## Editar económicos
PATCH /api/empresas/:empresaId/contratos/:contractId/economicos
Body: tipoFacturacion/moneda/diaFacturacion/montoReferencial + `motivo` obligatorio

## Subir documentos
POST /api/empresas/:empresaId/contratos/:contractId/documentos
- multipart/form-data, archivos en cualquier field (se usa `uploadDocs.any()`)
- Campos adicionales: `motivo` (obligatorio), `tipo` (contrato|anexo|addenda|otro)
- Responde lista de documentos guardados

## Eliminar documento
DELETE /api/empresas/:empresaId/contratos/:contractId/documentos/:docId
- Requiere `motivo` (en body o query)
- Audita eliminación

## Renovar contrato
POST /api/empresas/:empresaId/contratos/:contractId/renovar
- Crea nuevo contrato (estado por defecto activo), marca anterior como histórico y registra history (`tipoCambio = renovacion`, valorAnterior=idAnterior, valorNuevo=idNuevo)

## Notas de auditoría
- Todos los PATCH/POST requieren `motivo` cuando cambian datos.
- Se registra `contract_history` por campo modificado, incluyendo documentos y renovaciones.

---

## Próximos pasos (pendientes)
- Renovación: crear nuevo registro con estado `activo`, marcar anterior `historico`/`vencido`, mover fechas.
- Documentos: upload/delete via multipart y auditar cambios.
- Guard de tickets: bloquear creación de tickets si contrato está `suspendido` o `vencido`.
- Pruebas automáticas y ejemplos en Postman/Insomnia.
