# Política de Historial de Contratos

## ⚠️ IMPORTANTE PARA EL FRONTEND

### El historial de contratos (`contract_history`) es **SOLO-LECTURA** desde el frontend

**NO DEBEN:**
❌ Hacer POST directo a la tabla `contract_history`
❌ Hacer INSERT directo a la tabla `contract_history`
❌ Agregar registros como "Configuración inicial de servicios incluidos"
❌ Agregar registros como "Configuración inicial de mantenimiento preventivo"
❌ Agregar registros como "Configuración inicial de condiciones económicas"

### El backend se encarga AUTOMÁTICAMENTE de:

**Al crear contrato (POST /api/empresas/:empresaId/contratos):**
- Si `estadoContrato === 'activo'`: Agrega UNA entrada al historial
  ```json
  {
    "campo": "Creación del Contrato",
    "valorAnterior": null,
    "valorNuevo": "Contrato registrado como activo",
    "motivo": "Creación inicial del contrato",
    "usuario": "usuario@email.com"
  }
  ```

**Al editar datos (PATCH endpoints):**
- Backend compara valores antiguos vs nuevos
- SOLO guarda en historial si REALMENTE hay cambios
- Filtra cambios: `filter(([, v]) => v.old !== v.new)`
- Requiere que el usuario ingrese un `motivo` obligatorio

### Frontend puede:
✅ **LEER** el historial:
```
GET /api/empresas/:empresaId/contratos/:contractId/historial
```

Devuelve:
```json
[
  {
    "id": 1,
    "contractId": 5,
    "campo": "Creación del Contrato",
    "valorAnterior": null,
    "valorNuevo": "Contrato registrado como activo",
    "motivo": "Creación inicial del contrato",
    "usuario": "admin@intisoft.com",
    "fecha": "2025-12-16T20:49:44.123Z",
    "tipoCambio": "general"
  },
  {
    "id": 2,
    "contractId": 5,
    "campo": "tipoFacturacion",
    "valorAnterior": null,
    "valorNuevo": "mensual",
    "motivo": "Ajuste de condiciones económicas",
    "usuario": "admin@intisoft.com",
    "fecha": "2025-12-16T20:50:30.456Z",
    "tipoCambio": "economico"
  }
]
```

### Flujo correcto:

1. **Crear contrato:**
   - Frontend: `POST /api/empresas/:empresaId/contratos` con `estadoContrato: 'activo'`
   - Backend: Automáticamente agrega la entrada "Creación del Contrato" al historial
   - Frontend: **NO DEBE** hacer nada más al historial

2. **Editar servicios/preventivo/económicos:**
   - Frontend: `PATCH /api/empresas/:empresaId/contratos/:contractId/servicios` (o preventivo/economicos)
   - Frontend: Incluye `motivo: "Descripción del cambio"`
   - Backend: Compara valores, agrega SOLO los cambios reales al historial
   - Frontend: **NO DEBE** hacer nada más al historial

3. **Ver historial:**
   - Frontend: `GET /api/empresas/:empresaId/contratos/:contractId/historial`
   - Backend: Devuelve lista de cambios reales

### Conclusión

**El frontend debe ELIMINAR todo código que:**
- Hace POST a `contract_history`
- Hace INSERT a `contract_history`
- Agrega entradas tipo "Configuración inicial de..."

**Solo el backend gestiona el historial. El frontend solo LEE.**

