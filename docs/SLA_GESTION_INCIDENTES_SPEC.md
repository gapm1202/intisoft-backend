# SLA - Especificación: Gestión de Incidentes

## 🚨 RESPUESTA AL EQUIPO FRONTEND

### Problema Identificado

El endpoint `POST /api/sla/seccion/:empresaId` está rechazando el payload porque **el objeto `gestionIncidentes` VACÍO `{}` no pasa la validación**.

### Error 400 - Causa Raíz

**Mensaje de error exacto:**
```
"tipos debe ser un objeto"
```

**Archivo:** `src/services/sla.service.ts` línea 227

**Validación que falla:**
```typescript
case 'incidentes':
  if (!data.tipos || typeof data.tipos !== 'object') {
    throw new Error('tipos debe ser un objeto');
  }
  break;
```

---

## ✅ SOLUCIÓN PARA FRONTEND

### Opción 1: Enviar estructura mínima válida

Cuando el formulario de "Gestión de Incidentes" está vacío, **NO envíen `{}`**, envíen la estructura mínima:

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

### Opción 2: Payload completo con todos los campos

Estructura COMPLETA esperada por el backend:

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
    "categoriaITIL": "usuario",
    "impacto": "alto",
    "urgencia": "alta",
    "prioridadCalculada": "Alta"
  },
  "motivo": "Actualización de gestión de incidentes"
}
```

---

## 📋 ESPECIFICACIÓN COMPLETA

### Endpoint
```
POST /api/sla/seccion/:empresaId
```

### Headers
```http
Authorization: Bearer <token>
Content-Type: application/json
```

### Request Body

#### Campos obligatorios en el objeto `data`:

| Campo | Tipo | Descripción | Validación |
|-------|------|-------------|------------|
| `tipos` | `object` | **OBLIGATORIO** - Tipos de incidentes cubiertos | Debe ser un objeto con las 5 propiedades |
| `tipos.hardware` | `boolean` | Incidentes de hardware | - |
| `tipos.software` | `boolean` | Incidentes de software | - |
| `tipos.red` | `boolean` | Incidentes de red | - |
| `tipos.accesos` | `boolean` | Incidentes de accesos | - |
| `tipos.otros` | `boolean` | Otros tipos de incidentes | - |

#### Campos opcionales:

| Campo | Tipo | Valores permitidos | Por defecto |
|-------|------|-------------------|-------------|
| `categoriaITIL` | `string` | `"usuario"` \| `"infraestructura"` \| `"aplicacion"` \| `"seguridad"` | `undefined` |
| `impacto` | `string` | `"alto"` \| `"medio"` \| `"bajo"` | `"medio"` |
| `urgencia` | `string` | `"alta"` \| `"media"` \| `"baja"` | `"media"` |
| `prioridadCalculada` | `string` | `"Alta"` \| `"Media"` \| `"Baja"` | `"Media"` |

---

## 🔍 EJEMPLOS DE USO

### Ejemplo 1: Payload mínimo (formulario vacío)

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
      "red": true,
      "accesos": false,
      "otros": false
    },
    "categoriaITIL": "infraestructura",
    "impacto": "alto",
    "urgencia": "alta",
    "prioridadCalculada": "Alta"
  },
  "motivo": "Configuración inicial de SLA para incidentes críticos"
}
```

### Ejemplo 3: ERROR 400 - Objeto vacío ❌

```json
{
  "seccion": "incidentes",
  "data": {}
}
```

**Respuesta 400:**
```json
{
  "error": "tipos debe ser un objeto"
}
```

---

## 🛠️ RECOMENDACIONES PARA FRONTEND

### 1. Inicialización del formulario

Al cargar el formulario de "Gestión de Incidentes", inicializar con valores por defecto:

```typescript
const defaultGestionIncidentes = {
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

### 2. Validación antes de enviar

```typescript
function validateGestionIncidentes(data) {
  if (!data.tipos || typeof data.tipos !== 'object') {
    throw new Error('El objeto tipos es obligatorio');
  }
  
  const requiredKeys = ['hardware', 'software', 'red', 'accesos', 'otros'];
  for (const key of requiredKeys) {
    if (typeof data.tipos[key] !== 'boolean') {
      throw new Error(`tipos.${key} debe ser boolean`);
    }
  }
  
  return true;
}
```

### 3. Mapeo desde el formulario

```typescript
const formDataToPayload = (formValues) => {
  return {
    seccion: 'incidentes',
    data: {
      tipos: {
        hardware: formValues.tipoHardware ?? false,
        software: formValues.tipoSoftware ?? false,
        red: formValues.tipoRed ?? false,
        accesos: formValues.tipoAccesos ?? false,
        otros: formValues.tipoOtros ?? false
      },
      categoriaITIL: formValues.categoriaITIL || undefined,
      impacto: formValues.impacto || 'medio',
      urgencia: formValues.urgencia || 'media',
      prioridadCalculada: formValues.prioridadCalculada || 'Media'
    },
    motivo: formValues.motivo || 'Actualización de gestión de incidentes'
  };
};
```

---

## 📊 INTERFAZ TypeScript

```typescript
export interface SLAGestionIncidentes {
  tipos: {
    hardware: boolean;
    software: boolean;
    red: boolean;
    accesos: boolean;
    otros: boolean;
  };
  categoriaITIL?: 'usuario' | 'infraestructura' | 'aplicacion' | 'seguridad';
  impacto: 'alto' | 'medio' | 'bajo';
  urgencia: 'alta' | 'media' | 'baja';
  prioridadCalculada: 'Alta' | 'Media' | 'Baja';
}
```

---

## 🔗 Endpoints relacionados

- **GET** `/api/sla/configuracion/:empresaId` - Obtener configuración completa
- **POST** `/api/sla/configuracion/:empresaId` - Crear/actualizar configuración completa
- **POST** `/api/sla/seccion/:empresaId` - Actualizar sección específica
- **GET** `/api/sla/historial/:empresaId` - Ver historial de cambios
- **GET** `/api/sla/schema/:seccion` - 🆕 **Obtener estructura esperada de una sección**

### 🆕 Endpoint de ayuda para desarrolladores

```http
GET /api/sla/schema/incidentes
```

**Respuesta:**
```json
{
  "descripcion": "Gestión de Incidentes - Tipos de incidentes cubiertos y categorización",
  "estructura": {
    "tipos": {
      "tipo": "object",
      "obligatorio": true,
      "propiedades": {
        "hardware": { "tipo": "boolean", "obligatorio": true },
        "software": { "tipo": "boolean", "obligatorio": true },
        "red": { "tipo": "boolean", "obligatorio": true },
        "accesos": { "tipo": "boolean", "obligatorio": true },
        "otros": { "tipo": "boolean", "obligatorio": true }
      }
    }
  },
  "ejemploMinimo": {
    "tipos": {
      "hardware": false,
      "software": false,
      "red": false,
      "accesos": false,
      "otros": false
    }
  },
  "ejemploCompleto": { ... }
}
```

---

## 📞 Contacto

Si tienen dudas adicionales o encuentran otros errores, por favor compartir:
1. El payload EXACTO que están enviando
2. El mensaje de error completo
3. Los headers de la petición

**Última actualización:** 2024-12-29
