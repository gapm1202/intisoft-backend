# Actualización de Empresas - Nuevos Campos

## Cambios Implementados

### Nuevos Campos en Tabla `empresas`:

1. **`codigo_cliente`** (VARCHAR, UNIQUE, NOT NULL)
   - Auto-generado en formato `CLI-001`, `CLI-002`, etc.
   - El backend asigna automáticamente en la creación.
   - Se genera usando secuencia PostgreSQL `empresas_codigo_cliente_seq`.

2. **`contactos_admin`** (JSONB array, default=[])
   - Reemplaza los campos antiguos `admin_nombre`, `admin_cargo`, `admin_telefono`, `admin_email`.
   - Estructura:
     ```json
     [
       {
         "nombre": "Juan Pérez",
         "cargo": "Gerente",
         "telefono": "+51-1-234-5678",
         "email": "juan@empresa.com"
       }
     ]
     ```

3. **`contactos_tecnicos`** (JSONB array, default=[])
   - Reemplaza campos antiguos `tec_nombre`, `tec_cargo`, `tec_telefono1`, `tec_telefono2`, `tec_email`, `nivel_autorizacion`.
   - Estructura:
     ```json
     [
       {
         "nombre": "Carlos López",
         "cargo": "Jefe TI",
         "telefono1": "+51-1-111-1111",
         "telefono2": "+51-1-222-2222",
         "email": "carlos@empresa.com",
         "contactoPrincipal": true,
         "horarioDisponible": "9AM-6PM",
         "autorizaCambiosCriticos": true,
         "nivelAutorizacion": "Nivel 3"
       }
     ]
     ```

4. **`observaciones_generales`** (TEXT, nullable)
   - Observaciones generales de la empresa.

5. **`autorizacion_facturacion`** (BOOLEAN, default=false)
   - Flag para controlar autorización de facturación.

### Campos Deprecated (Legacy):
Los siguientes campos existen aún pero serán eliminados en futuro:
- `admin_nombre`, `admin_cargo`, `admin_telefono`, `admin_email`
- `observaciones`
- `tec_nombre`, `tec_cargo`, `tec_telefono1`, `tec_telefono2`, `tec_email`, `nivel_autorizacion`

**Nota**: Durante la migración, los datos de estos campos fueron migrados automáticamente a las nuevas arrays JSONB.

---

## Endpoints Actualizados

### POST /api/empresas
**Crear nueva empresa**

**Request Body:**
```json
{
  "nombre": "Acme Corp",
  "ruc": "20123456789",
  "direccionFiscal": "Jr. Principal 100, Lima",
  "ciudad": "Lima",
  "razonSocial": "Acme Corporativo S.A.C",
  "provincia": "Lima",
  "telefono": "+51-1-234-5678",
  "email": "contacto@acme.com",
  "tipoEmpresa": "Manufactura",
  "paginaWeb": "https://acme.com",
  "estadoContrato": "Activo",
  "contactosAdmin": [
    {
      "nombre": "Juan Pérez",
      "cargo": "Gerente General",
      "telefono": "+51-1-234-5678",
      "email": "juan@acme.com"
    }
  ],
  "contactosTecnicos": [
    {
      "nombre": "Carlos López",
      "cargo": "Jefe de TI",
      "telefono1": "+51-1-111-1111",
      "telefono2": "+51-1-222-2222",
      "email": "carlos@acme.com",
      "contactoPrincipal": true,
      "horarioDisponible": "9AM-6PM",
      "autorizaCambiosCriticos": true,
      "nivelAutorizacion": "Nivel 3"
    }
  ],
  "observacionesGenerales": "Cliente prioritario",
  "autorizacionFacturacion": true
}
```

**Response (201 Created):**
```json
{
  "id": 45,
  "nombre": "Acme Corp",
  "codigo": "ACM",
  "codigoCliente": "CLI-045",
  "ruc": "20123456789",
  "direccionFiscal": "Jr. Principal 100, Lima",
  "ciudad": "Lima",
  "razonSocial": "Acme Corporativo S.A.C",
  "provincia": "Lima",
  "telefono": "+51-1-234-5678",
  "email": "contacto@acme.com",
  "tipoEmpresa": "Manufactura",
  "paginaWeb": "https://acme.com",
  "estadoContrato": "Activo",
  "contactosAdmin": [...],
  "contactosTecnicos": [...],
  "observacionesGenerales": "Cliente prioritario",
  "autorizacionFacturacion": true,
  "creado_en": "2025-12-16T10:30:00Z"
}
```

**Notas:**
- El backend asigna automáticamente `codigo_cliente` en formato `CLI-NNN`.
- El campo `codigo` (3 letras del nombre) también es generado automáticamente.
- Acepta tanto `contactosAdministrativos` (legacy) como `contactosAdmin` (nuevo).

---

### PUT /api/empresas/:id
**Actualizar empresa existente**

**Request Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body** (campos opcionales):
```json
{
  "motivo": "Actualización de contactos técnicos",
  "nombre": "Acme Corp Updated",
  "contactosAdmin": [
    {
      "nombre": "Pedro García",
      "cargo": "Nuevo Gerente",
      "telefono": "+51-1-555-5555",
      "email": "pedro@acme.com"
    }
  ],
  "observacionesGenerales": "Nota actualizada",
  "autorizacionFacturacion": false
}
```

**Response (200 OK):**
```json
{
  "id": 45,
  "nombre": "Acme Corp Updated",
  ...
}
```

**Restricciones:**
- No se puede cambiar `codigo_cliente` (es UNIQUE y auto-generado).
- El campo `motivo` es obligatorio para registrar en el historial de cambios.

---

### GET /api/empresas/:id
**Obtener datos de una empresa**

**Response (200 OK):**
```json
{
  "id": 45,
  "nombre": "Acme Corp",
  "codigo": "ACM",
  "codigoCliente": "CLI-045",
  "ruc": "20123456789",
  "direccionFiscal": "Jr. Principal 100, Lima",
  "ciudad": "Lima",
  "razonSocial": "Acme Corporativo S.A.C",
  "provincia": "Lima",
  "telefono": "+51-1-234-5678",
  "email": "contacto@acme.com",
  "tipoEmpresa": "Manufactura",
  "paginaWeb": "https://acme.com",
  "estadoContrato": "Activo",
  "contactosAdmin": [
    {
      "nombre": "Juan Pérez",
      "cargo": "Gerente General",
      "telefono": "+51-1-234-5678",
      "email": "juan@acme.com"
    }
  ],
  "contactosTecnicos": [
    {
      "nombre": "Carlos López",
      "cargo": "Jefe de TI",
      "telefono1": "+51-1-111-1111",
      "telefono2": "+51-1-222-2222",
      "email": "carlos@acme.com",
      "contactoPrincipal": true,
      "horarioDisponible": "9AM-6PM",
      "autorizaCambiosCriticos": true,
      "nivelAutorizacion": "Nivel 3"
    }
  ],
  "observacionesGenerales": "Cliente prioritario",
  "autorizacionFacturacion": true,
  "creado_en": "2025-12-16T10:30:00Z"
}
```

---

## Migración de Datos

La migración 039 realizó lo siguiente automáticamente:

1. **Creó la secuencia** `empresas_codigo_cliente_seq` para generar códigos CLI-001, CLI-002, etc.
2. **Agregó los nuevos campos** a la tabla `empresas`.
3. **Migró datos legacy** desde columnas antiguas hacia las nuevas arrays JSONB:
   - `admin_nombre`, `admin_cargo`, `admin_telefono`, `admin_email` → `contactos_admin`
   - `tec_nombre`, `tec_cargo`, `tec_telefono1`, `tec_telefono2`, `tec_email`, `nivel_autorizacion` → `contactos_tecnicos`
4. **Backfillió** `codigo_cliente` para todas las empresas existentes (CLI-001, CLI-002, etc.).
5. **Creó índice** en `codigo_cliente` para búsquedas rápidas.

---

## Frontend Integration

### 1. Crear Empresa con Nuevos Campos
```typescript
const payload = {
  nombre: "Mi Empresa",
  ruc: "20123456789",
  direccionFiscal: "...",
  ciudad: "Lima",
  contactosAdmin: [
    {
      nombre: "Admin Name",
      cargo: "Gerente",
      telefono: "...",
      email: "..."
    }
  ],
  contactosTecnicos: [
    {
      nombre: "Tech Name",
      cargo: "TI",
      telefono1: "...",
      telefono2: "...",
      email: "...",
      contactoPrincipal: true,
      horarioDisponible: "9AM-6PM",
      autorizaCambiosCriticos: true,
      nivelAutorizacion: "Nivel 3"
    }
  ],
  observacionesGenerales: "Notas",
  autorizacionFacturacion: true
};

const response = await fetch('http://localhost:4000/api/empresas', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
});
```

### 2. Actualizar Empresa
```typescript
const payload = {
  motivo: "Actualización de contactos",
  contactosAdmin: [...],
  observacionesGenerales: "..."
};

const response = await fetch(`http://localhost:4000/api/empresas/${empresaId}`, {
  method: 'PUT',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
});
```

### 3. Leer Empresa con Nuevos Campos
```typescript
const response = await fetch(`http://localhost:4000/api/empresas/${empresaId}`, {
  headers: { Authorization: `Bearer ${token}` }
});

const empresa = await response.json();
console.log(empresa.codigoCliente);           // ej. "CLI-045"
console.log(empresa.contactosAdmin);          // array JSON
console.log(empresa.contactosTecnicos);       // array JSON
console.log(empresa.observacionesGenerales);  // string
console.log(empresa.autorizacionFacturacion); // boolean
```

---

## Compatibilidad

- **Backward Compatibility**: El código aún soporta los campos antiguos (`contactosAdministrativos`, `contactosTecnicos`, `adminNombre`, etc.) para que las llamadas legacy sigan funcionando.
- **Migration Path**: Se recomienda que el frontend actualice gradualmente para usar los nuevos campos.
- **Deprecation Notice**: Los campos antiguos serán eliminados en una versión futura.

---

## Preguntas Frecuentes

**P: ¿Puedo cambiar el `codigo_cliente` después de crear la empresa?**  
R: No. El `codigo_cliente` es UNIQUE y auto-generado. Es un identificador inmutable.

**P: ¿Qué pasa si no envío `contactosAdmin` ni `contactosTecnicos` al crear?**  
R: Se guardan como arrays vacíos `[]`.

**P: ¿Puedo usar tanto `contactosAdministrativos` como `contactosAdmin`?**  
R: Sí, durante la transición. Pero se recomienda usar `contactosAdmin` (nuevo formato).

**P: ¿Cómo se generan los `codigo_cliente`?**  
R: Automáticamente. Cada nueva empresa recibe el siguiente número en la secuencia (CLI-001, CLI-002, ..., CLI-999).
