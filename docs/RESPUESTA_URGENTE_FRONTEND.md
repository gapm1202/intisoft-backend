# 🚨 RESPUESTA URGENTE - Conflicto Formulario SLA

**Para:** Equipo Frontend  
**De:** Equipo Backend  
**Fecha:** 29 de Diciembre, 2024

---

## ❌ PROBLEMA IDENTIFICADO

El formulario actual del frontend **NO tiene** el campo más importante que requiere el backend:

### Lo que el frontend tiene actualmente:
- ✅ Categoría ITIL
- ✅ Impacto
- ✅ Urgencia  
- ✅ Prioridad calculada

### Lo que FALTA (y causa el error 400):
- ❌ **Tipos de Incidentes** (hardware, software, red, accesos, otros)

---

## ✅ SOLUCIÓN RÁPIDA

**Agregar esta sección al formulario:**

```
┌──────────────────────────────────────────────┐
│ Tipos de Incidentes Cubiertos (*)           │
├──────────────────────────────────────────────┤
│ ☐ Hardware                                   │
│ ☐ Software                                   │
│ ☐ Red                                        │
│ ☐ Accesos                                    │
│ ☐ Otros                                      │
└──────────────────────────────────────────────┘
```

**Payload mínimo que funciona:**

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

**Payload completo (con campos actuales):**

```json
{
  "seccion": "incidentes",
  "data": {
    "tipos": {
      "hardware": true,
      "software": true,
      "red": false,
      "accesos": false,
      "otros": false
    },
    "categoriaITIL": "infraestructura",
    "impacto": "alto",
    "urgencia": "alta",
    "prioridadCalculada": "Alta"
  }
}
```

---

## 🛠️ ENDPOINTS DE AYUDA CREADOS

### 1. Obtener valores por defecto

```bash
GET /api/sla/defaults/incidentes
```

**Respuesta:**
```json
{
  "seccion": "incidentes",
  "defaults": {
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
  },
  "ejemplo": {
    "seccion": "incidentes",
    "data": { ... },
    "motivo": "Ejemplo de payload para guardar"
  }
}
```

**Uso sugerido:**
```javascript
// Al cargar el formulario
const response = await fetch('/api/sla/defaults/incidentes');
const { defaults } = await response.json();

// Inicializar formulario con esos valores
setFormData(defaults);
```

### 2. Obtener estructura esperada

```bash
GET /api/sla/schema/incidentes
```

Retorna la estructura completa con tipos, validaciones y ejemplos.

---

## 📋 CÓDIGO DE EJEMPLO MÍNIMO

```jsx
const [formData, setFormData] = useState({
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
});

// Agregar estos checkboxes al formulario:
<div>
  <h3>Tipos de Incidentes *</h3>
  
  <label>
    <input 
      type="checkbox" 
      checked={formData.tipos.hardware}
      onChange={(e) => setFormData({
        ...formData, 
        tipos: {...formData.tipos, hardware: e.target.checked}
      })}
    />
    Hardware
  </label>

  <label>
    <input 
      type="checkbox" 
      checked={formData.tipos.software}
      onChange={(e) => setFormData({
        ...formData, 
        tipos: {...formData.tipos, software: e.target.checked}
      })}
    />
    Software
  </label>

  <label>
    <input 
      type="checkbox" 
      checked={formData.tipos.red}
      onChange={(e) => setFormData({
        ...formData, 
        tipos: {...formData.tipos, red: e.target.checked}
      })}
    />
    Red
  </label>

  <label>
    <input 
      type="checkbox" 
      checked={formData.tipos.accesos}
      onChange={(e) => setFormData({
        ...formData, 
        tipos: {...formData.tipos, accesos: e.target.checked}
      })}
    />
    Accesos
  </label>

  <label>
    <input 
      type="checkbox" 
      checked={formData.tipos.otros}
      onChange={(e) => setFormData({
        ...formData, 
        tipos: {...formData.tipos, otros: e.target.checked}
      })}
    />
    Otros
  </label>
</div>

// Mantener los campos que ya tienen (categoriaITIL, impacto, etc.)
```

---

## 📚 DOCUMENTACIÓN COMPLETA

Para el diseño visual completo con CSS y ejemplos:

📄 **[docs/FORMULARIO_GESTION_INCIDENTES_DISENO.md](./FORMULARIO_GESTION_INCIDENTES_DISENO.md)**

---

## 🎯 PASOS SIGUIENTES

1. ✅ **Agregar los 5 checkboxes de "Tipos de Incidentes"**
2. ✅ **Asegurar que siempre se envíe el objeto `tipos`**
3. ✅ **Probar con el payload mínimo primero**
4. ✅ **Luego agregar los campos opcionales que ya tienen**

---

## 🧪 PROBAR LOS ENDPOINTS DE AYUDA

```bash
# Desde el backend
cd C:\Users\Grecia\Documents\intisoft-backend
node scripts/test_sla_helpers.js
```

Esto mostrará exactamente qué valores espera el backend.

---

## 📞 ¿Preguntas?

Si necesitan más ayuda:
- Revisen la documentación completa en `docs/`
- Prueben los endpoints de ayuda
- Compartan el error exacto si siguen teniendo problemas

---

**Estado:** ✅ Backend listo y funcionando  
**Acción requerida:** Frontend debe agregar campo "Tipos de Incidentes"
