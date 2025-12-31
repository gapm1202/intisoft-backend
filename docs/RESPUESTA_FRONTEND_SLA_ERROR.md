# 🚨 RESPUESTA URGENTE: Error 400 en Gestión de Incidentes

**Fecha:** 29 de Diciembre, 2024  
**Para:** Equipo Frontend  
**De:** Equipo Backend  
**Endpoint afectado:** `POST /api/sla/seccion/72`

---

## ✅ PROBLEMA IDENTIFICADO Y RESUELTO

### 🔍 Causa Raíz del Error 400

El backend está rechazando el payload porque el objeto `gestionIncidentes` llega **VACÍO** (`{}`), y la validación requiere que tenga la propiedad `tipos` OBLIGATORIA.

**Mensaje de error exacto que verán ahora:**
```
gestionIncidentes.tipos es OBLIGATORIO. Debe ser un objeto con propiedades: hardware, software, red, accesos, otros (todas boolean). 
Ejemplo: { "tipos": { "hardware": false, "software": false, "red": false, "accesos": false, "otros": false } }
```

---

## 🛠️ SOLUCIÓN INMEDIATA

### ❌ LO QUE NO FUNCIONA (Causa el error 400)

```json
{
  "seccion": "incidentes",
  "data": {}
}
```

### ✅ LO QUE SÍ FUNCIONA (Payload mínimo válido)

```json
{
  "seccion": "incidentes",
  "data": {
    "tipos": {
      "hardware": false,
      "software": false,
      "red": false,
      "accesos": false,
      "otros": false
    }
  }
}
```

---

## 📋 ESPECIFICACIÓN COMPLETA DEL ENDPOINT

### Request

**URL:** `POST /api/sla/seccion/:empresaId`

**Headers:**
```http
Authorization: Bearer <token>
Content-Type: application/json
```

**Body Structure:**
```typescript
{
  seccion: "incidentes",  // string, obligatorio
  data: {
    // OBLIGATORIOS:
    tipos: {
      hardware: boolean,  // true o false
      software: boolean,  // true o false
      red: boolean,       // true o false
      accesos: boolean,   // true o false
      otros: boolean      // true o false
    },
    
    // OPCIONALES:
    categoriaITIL?: "usuario" | "infraestructura" | "aplicacion" | "seguridad",
    impacto?: "alto" | "medio" | "bajo",
    urgencia?: "alta" | "media" | "baja",
    prioridadCalculada?: "Alta" | "Media" | "Baja"
  },
  motivo?: string  // opcional, para auditoría
}
```

---

## 💡 EJEMPLOS DE USO

### Ejemplo 1: Formulario vacío (valores por defecto)

```json
{
  "seccion": "incidentes",
  "data": {
    "tipos": {
      "hardware": false,
      "software": false,
      "red": false,
      "accesos": false,
      "otros": false
    }
  }
}
```

**Respuesta 200 OK:**
```json
{
  "success": true,
  "data": {
    "id": 88,
    "empresaId": 72,
    "gestionIncidentes": {
      "tipos": {
        "hardware": false,
        "software": false,
        "red": false,
        "accesos": false,
        "otros": false
      },
      "impacto": "medio",
      "urgencia": "media",
      "prioridadCalculada": "Media"
    }
  }
}
```

### Ejemplo 2: Formulario completo

```json
{
  "seccion": "incidentes",
  "data": {
    "tipos": {
      "hardware": true,
      "software": true,
      "red": false,
      "accesos": true,
      "otros": false
    },
    "categoriaITIL": "infraestructura",
    "impacto": "alto",
    "urgencia": "alta",
    "prioridadCalculada": "Alta"
  },
  "motivo": "Configuración inicial de incidentes críticos"
}
```

---

## 🔴 ERRORES POSIBLES Y SUS MENSAJES

### Error 1: Objeto `data` vacío
```json
Request: { "seccion": "incidentes", "data": {} }

Response 400:
{
  "error": "gestionIncidentes.tipos es OBLIGATORIO. Debe ser un objeto con propiedades: hardware, software, red, accesos, otros (todas boolean). Ejemplo: { \"tipos\": { \"hardware\": false, \"software\": false, \"red\": false, \"accesos\": false, \"otros\": false } }"
}
```

### Error 2: Falta una propiedad en `tipos`
```json
Request: { 
  "seccion": "incidentes", 
  "data": { 
    "tipos": { 
      "hardware": true,
      "software": true
      // Faltan: red, accesos, otros
    } 
  } 
}

Response 400:
{
  "error": "gestionIncidentes.tipos.red debe ser un valor boolean (true/false). Recibido: undefined"
}
```

### Error 3: Valor inválido en `categoriaITIL`
```json
Request: { 
  "seccion": "incidentes", 
  "data": { 
    "tipos": { ... },
    "categoriaITIL": "invalido"
  } 
}

Response 400:
{
  "error": "categoriaITIL debe ser uno de: usuario, infraestructura, aplicacion, seguridad"
}
```

---

## 🎯 RECOMENDACIONES PARA EL FRONTEND

### 1. Inicializar formulario con valores por defecto

```javascript
const initialValues = {
  tipos: {
    hardware: false,
    software: false,
    red: false,
    accesos: false,
    otros: false
  },
  impacto: 'medio',
  urgencia: 'media',
  prioridadCalculada: 'Media'
};
```

### 2. Función de validación antes de enviar

```javascript
function validateGestionIncidentes(data) {
  // Validar que existe el objeto tipos
  if (!data.tipos || typeof data.tipos !== 'object') {
    alert('Error: El campo tipos es obligatorio');
    return false;
  }
  
  // Validar que todas las propiedades estén presentes
  const requiredKeys = ['hardware', 'software', 'red', 'accesos', 'otros'];
  for (const key of requiredKeys) {
    if (typeof data.tipos[key] !== 'boolean') {
      alert(`Error: El campo tipos.${key} debe ser true o false`);
      return false;
    }
  }
  
  // Validar valores opcionales si están presentes
  if (data.categoriaITIL && !['usuario', 'infraestructura', 'aplicacion', 'seguridad'].includes(data.categoriaITIL)) {
    alert('Error: categoriaITIL debe ser usuario, infraestructura, aplicacion o seguridad');
    return false;
  }
  
  if (data.impacto && !['alto', 'medio', 'bajo'].includes(data.impacto)) {
    alert('Error: impacto debe ser alto, medio o bajo');
    return false;
  }
  
  if (data.urgencia && !['alta', 'media', 'baja'].includes(data.urgencia)) {
    alert('Error: urgencia debe ser alta, media o baja');
    return false;
  }
  
  return true;
}
```

### 3. Construcción del payload

```javascript
function buildPayload(formData) {
  return {
    seccion: 'incidentes',
    data: {
      tipos: {
        hardware: formData.tipoHardware ?? false,
        software: formData.tipoSoftware ?? false,
        red: formData.tipoRed ?? false,
        accesos: formData.tipoAccesos ?? false,
        otros: formData.tipoOtros ?? false
      },
      categoriaITIL: formData.categoriaITIL || undefined,
      impacto: formData.impacto || 'medio',
      urgencia: formData.urgencia || 'media',
      prioridadCalculada: formData.prioridadCalculada || 'Media'
    },
    motivo: formData.motivo || 'Actualización de gestión de incidentes'
  };
}
```

---

## 🔧 MEJORAS IMPLEMENTADAS EN EL BACKEND

### ✅ Mensajes de error más descriptivos

Antes:
```
"tipos debe ser un objeto"
```

Ahora:
```
"gestionIncidentes.tipos es OBLIGATORIO. Debe ser un objeto con propiedades: hardware, software, red, accesos, otros (todas boolean). 
Ejemplo: { \"tipos\": { \"hardware\": false, \"software\": false, \"red\": false, \"accesos\": false, \"otros\": false } }"
```

### ✅ Validación completa de todos los campos

- ✅ Valida que `tipos` sea un objeto
- ✅ Valida que cada propiedad de `tipos` sea boolean
- ✅ Valida valores permitidos para `categoriaITIL`
- ✅ Valida valores permitidos para `impacto`
- ✅ Valida valores permitidos para `urgencia`
- ✅ Valida valores permitidos para `prioridadCalculada`

### ✅ Nuevo endpoint de ayuda

**URL:** `GET /api/sla/schema/incidentes`

Este endpoint retorna la estructura esperada, útil para debugging:

```javascript
fetch('http://localhost:4000/api/sla/schema/incidentes')
  .then(res => res.json())
  .then(schema => {
    console.log('Estructura esperada:', schema.estructura);
    console.log('Ejemplo mínimo:', schema.ejemploMinimo);
    console.log('Ejemplo completo:', schema.ejemploCompleto);
  });
```

---

## 📞 SIGUIENTE PASO

Si después de implementar estas correcciones siguen teniendo errores:

1. **Capturar el payload exacto** que están enviando
2. **Copiar el mensaje de error completo** del response
3. **Enviar ambos** para análisis

---

## 📄 DOCUMENTACIÓN COMPLETA

Ver archivo completo: `docs/SLA_GESTION_INCIDENTES_SPEC.md`

---

**Última actualización:** 2024-12-29  
**Servidor:** Corriendo en puerto 4000  
**Estado:** ✅ Operacional
