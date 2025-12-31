# Endpoint de Reportes de Activos - Documentación

## POST /public/activos/report

Este endpoint permite a los usuarios públicos (con o sin autenticación) reportar problemas con activos mediante un formulario multipart/form-data.

### URL
```
POST http://localhost:3000/public/activos/report
```

### Content-Type
```
multipart/form-data
```

### Campos del FormData

#### Campos Requeridos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `assetId` | string | ID del activo a reportar (requerido) |
| `reporterEmail` | string | Email del reportante (requerido) |
| `description` | string | Descripción del problema (requerido) |
| `anydesk` | string | Código AnyDesk para soporte remoto (requerido) |

#### Campos Opcionales

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `token` | string | Token de acceso público (opcional, alternativa a assetId) |
| `reporterUserId` | string | ID del usuario si hay un usuario seleccionado (opcional) |
| `reporterName` | string | Nombre del reportante si NO hay usuario seleccionado (opcional) |
| `operational` | string | Estado operacional: "Sí" o "No" (opcional) |
| `attachments` | File[] | Archivos adjuntos (imágenes/videos, máximo 10 archivos, 10MB cada uno) (opcional) |

### Tipos de Archivo Permitidos
- `image/jpeg`
- `image/png`
- `video/mp4`

### Límites
- Máximo 10 archivos por reporte
- Máximo 10MB por archivo
- Máximo 20 reportes por hora por IP+token

### Ejemplo de Request (JavaScript/Fetch)

```javascript
const formData = new FormData();

// Campos requeridos
formData.append('assetId', 'ASSET-12345');
formData.append('reporterEmail', 'usuario@example.com');
formData.append('description', 'La computadora no enciende');
formData.append('anydesk', '987654321');

// Campos opcionales
formData.append('reporterName', 'Juan Pérez');
formData.append('operational', 'No');

// Archivos adjuntos (si hay)
fileInput.files.forEach(file => {
  formData.append('attachments', file);
});

const response = await fetch('http://localhost:3000/public/activos/report', {
  method: 'POST',
  body: formData
});

const data = await response.json();
```

### Ejemplo de Request (React + TypeScript)

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  const formData = new FormData();
  formData.append('assetId', assetId);
  formData.append('reporterEmail', email);
  formData.append('description', description);
  formData.append('anydesk', anydesk);
  
  if (selectedUserId) {
    formData.append('reporterUserId', selectedUserId);
  } else {
    formData.append('reporterName', reporterName);
  }
  
  formData.append('operational', operational);
  
  // Agregar archivos
  attachments.forEach(file => {
    formData.append('attachments', file);
  });
  
  try {
    const response = await fetch('/public/activos/report', {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('Reporte creado con ID:', data.reportId);
      // Mostrar mensaje de éxito al usuario
    }
  } catch (error) {
    console.error('Error al enviar reporte:', error);
  }
};
```

### Respuestas

#### Éxito (200 OK)
```json
{
  "success": true,
  "reportId": 123
}
```

#### Errores

##### 400 Bad Request - Campos faltantes
```json
{
  "ok": false,
  "message": "Campos requeridos: reporterEmail, description, anydesk"
}
```

##### 400 Bad Request - Tipo de archivo inválido
```json
{
  "ok": false,
  "message": "Invalid file type"
}
```

##### 404 Not Found - Activo no encontrado
```json
{
  "ok": false,
  "message": "Activo no encontrado"
}
```

##### 429 Too Many Requests
```json
{
  "ok": false,
  "message": "Too many requests"
}
```

##### 500 Internal Server Error
```json
{
  "ok": false,
  "message": "Error"
}
```

---

## GET /public/ticket/:ticketId

Este endpoint permite ver los detalles de un ticket de reporte enviado, incluyendo sus archivos adjuntos. Es público (sin autenticación) para que los usuarios puedan acceder desde el enlace del correo.

### URL
```
GET http://localhost:4000/public/ticket/:ticketId
```

### Parámetros de Ruta

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `ticketId` | number | ID del ticket a consultar |

### Ejemplo de Request

```javascript
const ticketId = 123;
const response = await fetch(`http://localhost:4000/public/ticket/${ticketId}`);
const data = await response.json();

if (data.ok) {
  const ticket = data.data;
  console.log('Ticket ID:', ticket.id);
  console.log('Asset:', ticket.asset_id);
  console.log('Description:', ticket.description);
  console.log('Attachments:', ticket.attachments);
}
```

### Respuestas

#### Éxito (200 OK)
```json
{
  "ok": true,
  "data": {
    "id": 123,
    "asset_id": "ASSET-12345",
    "reporter_user_id": null,
    "reporter_name": "Juan Pérez",
    "reporter_email": "juan@example.com",
    "description": "La computadora no enciende",
    "operational": "No",
    "anydesk": "987654321",
    "created_at": "2025-12-30T19:30:00.000Z",
    "attachments": [
      {
        "id": 1,
        "file_name": "photo.jpg",
        "file_path": "/uploads/1735593000000-photo.jpg",
        "file_type": "image/jpeg"
      },
      {
        "id": 2,
        "file_name": "video.mp4",
        "file_path": "/uploads/1735593001000-video.mp4",
        "file_type": "video/mp4"
      }
    ]
  }
}
```

**Nota:** Si el ticket no tiene adjuntos, `attachments` será `null`.

#### Errores

##### 400 Bad Request - ID inválido
```json
{
  "ok": false,
  "message": "ID de ticket inválido"
}
```

##### 404 Not Found - Ticket no existe
```json
{
  "ok": false,
  "message": "Ticket no encontrado"
}
```

##### 500 Internal Server Error
```json
{
  "ok": false,
  "message": "Error al obtener el ticket"
}
```

### Ejemplo de Uso en React

```typescript
import { useEffect, useState } from 'react';

function TicketView({ ticketId }: { ticketId: number }) {
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`/public/ticket/${ticketId}`)
      .then(res => res.json())
      .then(data => {
        if (data.ok) {
          setTicket(data.data);
        } else {
          setError(data.message);
        }
      })
      .catch(err => setError('Error de conexión'))
      .finally(() => setLoading(false));
  }, [ticketId]);

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!ticket) return <div>Ticket no encontrado</div>;

  return (
    <div>
      <h1>Ticket #{ticket.id}</h1>
      <p><strong>Activo:</strong> {ticket.asset_id}</p>
      <p><strong>Reportado por:</strong> {ticket.reporter_name || 'Usuario'}</p>
      <p><strong>Email:</strong> {ticket.reporter_email}</p>
      <p><strong>Descripción:</strong> {ticket.description}</p>
      <p><strong>Operacional:</strong> {ticket.operational}</p>
      <p><strong>AnyDesk:</strong> {ticket.anydesk}</p>
      
      {ticket.attachments && (
        <div>
          <h3>Archivos Adjuntos</h3>
          <ul>
            {ticket.attachments.map(file => (
              <li key={file.id}>
                <a href={file.file_path} target="_blank">
                  {file.file_name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

---

## Tablas de Base de Datos
  "ok": false,
  "message": "Error"
}
```

## Tablas de Base de Datos

### Tabla: `reporte_usuario`

Almacena la información principal del reporte.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | SERIAL | ID único del reporte (PK) |
| asset_id | VARCHAR(50) | ID del activo reportado |
| reporter_user_id | INTEGER | ID del usuario reportante (FK, nullable) |
| reporter_name | VARCHAR(255) | Nombre del reportante (nullable) |
| reporter_email | VARCHAR(255) | Email del reportante |
| description | TEXT | Descripción del problema |
| operational | VARCHAR(10) | Estado operacional ("Sí"/"No") |
| anydesk | VARCHAR(255) | Código AnyDesk |
| created_at | TIMESTAMP | Fecha de creación |

### Tabla: `reporte_adjuntos`

Almacena los archivos adjuntos del reporte.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | SERIAL | ID único del adjunto (PK) |
| reporte_id | INTEGER | ID del reporte (FK) |
| file_name | VARCHAR(255) | Nombre original del archivo |
| file_path | TEXT | Ruta del archivo en el servidor |
| file_type | VARCHAR(100) | Tipo MIME del archivo |
| created_at | TIMESTAMP | Fecha de creación |

## Consultas Útiles

### Obtener reporte con sus adjuntos
```sql
SELECT 
  r.*,
  json_agg(
    json_build_object(
      'id', a.id,
      'file_name', a.file_name,
      'file_path', a.file_path,
      'file_type', a.file_type
    )
  ) FILTER (WHERE a.id IS NOT NULL) as attachments
FROM reporte_usuario r
LEFT JOIN reporte_adjuntos a ON a.reporte_id = r.id
WHERE r.id = $1
GROUP BY r.id;
```

### Obtener últimos reportes
```sql
SELECT 
  r.*,
  COUNT(a.id) as attachment_count
FROM reporte_usuario r
LEFT JOIN reporte_adjuntos a ON a.reporte_id = r.id
GROUP BY r.id
ORDER BY r.created_at DESC
LIMIT 50;
```

### Obtener reportes por activo
```sql
SELECT * FROM reporte_usuario
WHERE asset_id = 'ASSET-12345'
ORDER BY created_at DESC;
```
