# Configuración de Correo Electrónico para Reportes

## Variables de Entorno Requeridas

Agrega las siguientes variables a tu archivo `.env`:

```env
# SMTP Configuration for email notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=CORREO
SMTP_PASS=CALVE_PRIVADA

# Frontend URL for email links (opcional, por defecto usa localhost:5173)
FRONTEND_PUBLIC_URL=http://localhost:5173
```

## ¿Cómo obtener la contraseña de aplicación de Gmail?

Si usas Gmail, necesitas generar una **contraseña de aplicación**:

1. Ve a tu cuenta de Google: https://myaccount.google.com/
2. Ve a **Seguridad** > **Verificación en 2 pasos** (debe estar activada)
3. En la parte inferior, busca **Contraseñas de aplicaciones**
4. Selecciona **Correo** y **Otro (nombre personalizado)**
5. Escribe "Backend Intisoft"
6. Copia la contraseña de 16 caracteres generada
7. Usa esa contraseña en `SMTP_PASS` (sin espacios)

## Funcionamiento

Cuando un usuario envía un reporte mediante `POST /public/activos/report`:

1. ✅ Se guarda el reporte en la base de datos
2. ✅ Se guardan los archivos adjuntos
3. ✅ Se envía un correo de confirmación al `reporter_email`

### Contenido del Correo

El correo incluye:
- Número de ticket (#ID)
- Descripción del problema
- Código del activo
- Barra de estado visual (Enviado → En proceso → Finalizado)
- Botón para ver el ticket en el frontend
- Mensaje sobre futuras actualizaciones

### Manejo de Errores

Si el envío de correo falla:
- ❌ El error se registra en los logs
- ✅ La solicitud NO falla (status 200)
- ✅ El reporte se guarda correctamente
- ✅ Se retorna `{success: true, reportId: X}`

Esto asegura que aunque el servidor de correo esté caído, los reportes se registren exitosamente.

## Prueba el Envío de Correo

Ejecuta este script para probar la configuración SMTP:

```bash
node scripts/test_email.js
```

(Crear el script `scripts/test_email.js` si necesitas probar manualmente)

## Logs

Los correos enviados se registran en la consola:
```
✅ Confirmation email sent to usuario@ejemplo.com for report #123
```

Los errores también se registran:
```
❌ Failed to send confirmation email: Error details...
```

## Personalización del Email

Para personalizar el template del correo, edita el HTML en:
- Archivo: `src/routes/public.routes.ts`
- Busca: `const htmlEmail = `
- Modifica los estilos CSS o el contenido HTML según necesites

## Variables Disponibles en el Template

Dentro del template HTML puedes usar:
- `${reportId}` - ID del reporte
- `${description}` - Descripción del problema
- `${activo.assetId}` - Código del activo
- `${reporterName}` - Nombre del reportante (si existe)
- `${process.env.FRONTEND_PUBLIC_URL}` - URL del frontend
