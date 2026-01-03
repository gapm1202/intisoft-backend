# API de Catálogo de Servicios - Documentación para Frontend

## Descripción General
El módulo de Catálogo de Servicios permite gestionar los servicios que ofrece la empresa. Cada servicio tiene un código único, pertenece a un tipo de servicio, y puede estar activo/inactivo y visible/oculto en la creación de tickets.

## Base URL
```
http://localhost:4000/api/catalogo/servicios
```

## Autenticación
Todos los endpoints requieren autenticación mediante Bearer Token:
```javascript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

---

## Endpoints

### 1. GET `/api/catalogo/servicios`
Obtiene la lista de servicios con filtros opcionales.

**Query Parameters (opcionales):**
- `activo` (boolean): Filtrar por estado activo/inactivo
- `visibleEnTickets` (boolean): Filtrar por visibilidad en tickets
- `tipoServicio` (string): Filtrar por tipo de servicio

**Ejemplo de Request:**
```javascript
// Sin filtros
GET /api/catalogo/servicios

// Con filtros
GET /api/catalogo/servicios?activo=true&visibleEnTickets=true
GET /api/catalogo/servicios?tipoServicio=Infraestructura
```

**Response 200 OK:**
```json
[
  {
    "id": 1,
    "codigo": "INFRA-001",
    "nombre": "Mantenimiento de Servidores",
    "descripcion": "Servicio de mantenimiento preventivo y correctivo",
    "tipoServicio": "Infraestructura",
    "activo": true,
    "visibleEnTickets": true,
    "creadoPor": "admin",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
]
```

---

### 2. GET `/api/catalogo/servicios/:id`
Obtiene un servicio específico por ID.

**Ejemplo de Request:**
```javascript
GET /api/catalogo/servicios/1
```

**Response 200 OK:**
```json
{
  "id": 1,
  "codigo": "INFRA-001",
  "nombre": "Mantenimiento de Servidores",
  "descripcion": "Servicio de mantenimiento preventivo y correctivo",
  "tipoServicio": "Infraestructura",
  "activo": true,
  "visibleEnTickets": true,
  "creadoPor": "admin",
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z"
}
```

**Response 404 Not Found:**
```json
{
  "error": "Servicio no encontrado"
}
```

---

### 3. POST `/api/catalogo/servicios`
Crea un nuevo servicio.

**Request Body:**
```json
{
  "codigo": "DEV-001",
  "nombre": "Desarrollo Web",
  "descripcion": "Servicios de desarrollo de aplicaciones web",
  "tipoServicio": "Desarrollo",
  "activo": true,
  "visibleEnTickets": true
}
```

**Campos requeridos:**
- `codigo` (string): Código único del servicio
- `nombre` (string): Nombre del servicio
- `tipoServicio` (string): Tipo de servicio (debe existir en tipos_servicio)

**Campos opcionales:**
- `descripcion` (string): Descripción del servicio
- `activo` (boolean): Estado activo/inactivo (default: true)
- `visibleEnTickets` (boolean): Visibilidad en tickets (default: true)

**Response 201 Created:**
```json
{
  "id": 6,
  "codigo": "DEV-001",
  "nombre": "Desarrollo Web",
  "descripcion": "Servicios de desarrollo de aplicaciones web",
  "tipoServicio": "Desarrollo",
  "activo": true,
  "visibleEnTickets": true,
  "creadoPor": "admin",
  "createdAt": "2024-01-15T11:00:00.000Z",
  "updatedAt": "2024-01-15T11:00:00.000Z"
}
```

**Response 409 Conflict (código duplicado):**
```json
{
  "error": "Ya existe un servicio con el código: DEV-001"
}
```

**Response 400 Bad Request (tipo no existe):**
```json
{
  "error": "El tipo de servicio \"TipoInvalido\" no existe"
}
```

---

### 4. PUT `/api/catalogo/servicios/:id`
Actualiza un servicio existente.

**⚠️ IMPORTANTE:** El campo `codigo` NO se puede actualizar.

**Request Body:**
```json
{
  "nombre": "Desarrollo Web Actualizado",
  "descripcion": "Descripción actualizada",
  "tipoServicio": "Aplicacion",
  "activo": false,
  "visibleEnTickets": false
}
```

**Todos los campos son opcionales** (se actualizan solo los enviados)

**Response 200 OK:**
```json
{
  "id": 6,
  "codigo": "DEV-001",
  "nombre": "Desarrollo Web Actualizado",
  "descripcion": "Descripción actualizada",
  "tipoServicio": "Aplicacion",
  "activo": false,
  "visibleEnTickets": false,
  "creadoPor": "admin",
  "createdAt": "2024-01-15T11:00:00.000Z",
  "updatedAt": "2024-01-15T11:30:00.000Z"
}
```

---

### 5. ❌ NO existe endpoint DELETE
Para "eliminar" un servicio, utilizar PUT para desactivarlo:
```json
PUT /api/catalogo/servicios/:id
{
  "activo": false
}
```

---

### 6. GET `/api/catalogo/servicios/stats`
Obtiene estadísticas de servicios.

**Ejemplo de Request:**
```javascript
GET /api/catalogo/servicios/stats
```

**Response 200 OK:**
```json
{
  "total": 10,
  "activos": 8,
  "inactivos": 2,
  "visiblesEnTickets": 7,
  "porTipo": [
    {
      "tipo": "Infraestructura",
      "count": 3
    },
    {
      "tipo": "Aplicacion",
      "count": 2
    },
    {
      "tipo": "Seguridad",
      "count": 2
    },
    {
      "tipo": "Comunicaciones",
      "count": 2
    },
    {
      "tipo": "Soporte general",
      "count": 1
    }
  ]
}
```

---

### 7. GET `/api/catalogo/servicios/tipos`
Obtiene todos los tipos de servicio disponibles.

**Ejemplo de Request:**
```javascript
GET /api/catalogo/servicios/tipos
```

**Response 200 OK:**
```json
[
  {
    "id": 1,
    "tipo": "Infraestructura",
    "activo": true,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  },
  {
    "id": 2,
    "tipo": "Aplicacion",
    "activo": true,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
]
```

---

### 8. POST `/api/catalogo/servicios/tipos`
Crea un nuevo tipo de servicio.

**Request Body:**
```json
{
  "tipo": "Desarrollo",
  "activo": true
}
```

**Campos requeridos:**
- `tipo` (string): Nombre del tipo de servicio (único)

**Campos opcionales:**
- `activo` (boolean): Estado activo/inactivo (default: true)

**Response 201 Created:**
```json
{
  "id": 6,
  "tipo": "Desarrollo",
  "activo": true,
  "createdAt": "2024-01-15T12:00:00.000Z",
  "updatedAt": "2024-01-15T12:00:00.000Z"
}
```

**Response 409 Conflict:**
```json
{
  "error": "Ya existe un tipo de servicio con el nombre: Desarrollo"
}
```

---

## Tipos de Servicio Predefinidos
El sistema incluye 5 tipos predefinidos:
1. **Infraestructura**
2. **Aplicacion**
3. **Comunicaciones**
4. **Seguridad**
5. **Soporte general**

---

## Ejemplos de Uso en React/TypeScript

### Interfaces TypeScript
```typescript
interface Servicio {
  id?: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipoServicio: string;
  activo: boolean;
  visibleEnTickets: boolean;
  creadoPor?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface TipoServicio {
  id?: number;
  tipo: string;
  activo: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ServicioStats {
  total: number;
  activos: number;
  inactivos: number;
  visiblesEnTickets: number;
  porTipo: {
    tipo: string;
    count: number;
  }[];
}
```

### Obtener Servicios
```typescript
const obtenerServicios = async (filtros?: {
  activo?: boolean;
  visibleEnTickets?: boolean;
  tipoServicio?: string;
}) => {
  const params = new URLSearchParams();
  if (filtros?.activo !== undefined) params.append('activo', String(filtros.activo));
  if (filtros?.visibleEnTickets !== undefined) params.append('visibleEnTickets', String(filtros.visibleEnTickets));
  if (filtros?.tipoServicio) params.append('tipoServicio', filtros.tipoServicio);

  const queryString = params.toString();
  const url = queryString 
    ? `/api/catalogo/servicios?${queryString}` 
    : '/api/catalogo/servicios';

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) throw new Error('Error al obtener servicios');
  return await response.json() as Servicio[];
};
```

### Crear Servicio
```typescript
const crearServicio = async (data: {
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipoServicio: string;
  activo?: boolean;
  visibleEnTickets?: boolean;
}) => {
  const response = await fetch('/api/catalogo/servicios', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al crear servicio');
  }

  return await response.json() as Servicio;
};
```

### Actualizar Servicio
```typescript
const actualizarServicio = async (id: number, data: Partial<Servicio>) => {
  const response = await fetch(`/api/catalogo/servicios/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al actualizar servicio');
  }

  return await response.json() as Servicio;
};
```

### Desactivar Servicio
```typescript
const desactivarServicio = async (id: number) => {
  return await actualizarServicio(id, { activo: false });
};
```

### Obtener Tipos de Servicio
```typescript
const obtenerTiposServicio = async () => {
  const response = await fetch('/api/catalogo/servicios/tipos', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) throw new Error('Error al obtener tipos de servicio');
  return await response.json() as TipoServicio[];
};
```

### Obtener Estadísticas
```typescript
const obtenerEstadisticas = async () => {
  const response = await fetch('/api/catalogo/servicios/stats', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) throw new Error('Error al obtener estadísticas');
  return await response.json() as ServicioStats;
};
```

---

## Casos de Uso Comunes

### 1. Listar servicios activos para selección en formulario
```typescript
const serviciosActivos = await obtenerServicios({ activo: true });
```

### 2. Listar servicios visibles en tickets
```typescript
const serviciosParaTickets = await obtenerServicios({ 
  activo: true, 
  visibleEnTickets: true 
});
```

### 3. Filtrar servicios por tipo
```typescript
const serviciosInfraestructura = await obtenerServicios({ 
  tipoServicio: 'Infraestructura' 
});
```

### 4. Desactivar servicio en lugar de eliminar
```typescript
await desactivarServicio(servicioId);
```

---

## Validaciones del Backend

1. **Código único**: No se pueden crear dos servicios con el mismo código
2. **Tipo debe existir**: El `tipoServicio` debe existir en la tabla `tipos_servicio`
3. **Campos requeridos**: `codigo`, `nombre`, `tipoServicio`
4. **Código no actualizable**: El campo `codigo` no se puede modificar vía PUT

---

## Notas Importantes

- ❌ **NO existe endpoint DELETE** - Solo desactivar con `activo: false`
- ✅ El campo `codigo` es **único** y **no modificable**
- ✅ El campo `visibleEnTickets` controla si el servicio aparece al crear tickets
- ✅ Los servicios inactivos (`activo: false`) pueden seguir siendo consultados
- ✅ El `creadoPor` se obtiene automáticamente del token JWT

---

## Errores Comunes

### 409 Conflict
- Código duplicado al crear servicio
- Tipo de servicio duplicado

### 400 Bad Request
- Tipo de servicio no existe
- Campos requeridos faltantes
- ID inválido en parámetros

### 404 Not Found
- Servicio no encontrado por ID

### 401 Unauthorized
- Token JWT faltante o inválido

---

## Testing con Postman/Insomnia

**1. Login:**
```
POST http://localhost:4000/api/auth/login
{
  "email": "admin@intisoft.com",
  "password": "admin123"
}
```

**2. Usar el token en todos los requests:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**3. Crear servicio:**
```
POST http://localhost:4000/api/catalogo/servicios
{
  "codigo": "TEST-001",
  "nombre": "Servicio de Prueba",
  "tipoServicio": "Infraestructura"
}
```
