# Template de Correo Compatible con Clientes de Email

## ✅ Características Implementadas

El template de correo ha sido completamente reescrito para ser compatible con **Gmail, Outlook y otros clientes de correo** que tienen limitaciones en cuanto a CSS y HTML moderno.

### Tecnologías Usadas

- ✅ **HTML con tablas** para layout (no flexbox, no grid)
- ✅ **CSS inline** en cada elemento
- ✅ **Tipografía simple**: Arial, Helvetica
- ✅ **Logo cargado desde el backend**: `${BACKEND_URL}/logo.png`
- ✅ **Estructura compatible** con clientes de correo antiguos

### Estructura del Correo

```
┌─────────────────────────────────────┐
│  Fondo gris claro (#f1f5f9)         │
│  ┌───────────────────────────────┐  │
│  │ Tarjeta blanca (600px)        │  │
│  │ ┌───────────────────────────┐ │  │
│  │ │ Header azul con logo      │ │  │
│  │ │ - Logo circular blanco    │ │  │
│  │ │ - Nombre INTISOFT         │ │  │
│  │ │ - Título                  │ │  │
│  │ └───────────────────────────┘ │  │
│  │                               │  │
│  │ ┌───────────────────────────┐ │  │
│  │ │ Contenido                 │ │  │
│  │ │ - Icono de éxito          │ │  │
│  │ │ - Texto de confirmación   │ │  │
│  │ │ - Número de ticket        │ │  │
│  │ │ - Tabla de información    │ │  │
│  │ │ - Estado (pasos)          │ │  │
│  │ │ - Botón CTA               │ │  │
│  │ └───────────────────────────┘ │  │
│  │                               │  │
│  │ ┌───────────────────────────┐ │  │
│  │ │ Footer                    │ │  │
│  │ │ - Información adicional   │ │  │
│  │ │ - Copyright               │ │  │
│  │ └───────────────────────────┘ │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

## Configuración Requerida

### Variables de Entorno

Agrega al archivo `.env`:

```env
# Backend URL for assets (logo in emails, etc)
BACKEND_PUBLIC_URL=http://localhost:4000

# Frontend URL for email links
FRONTEND_PUBLIC_URL=http://localhost:5173
```

**Importante:** En producción, usa URLs públicas:
```env
BACKEND_PUBLIC_URL=https://api.tudominio.com
FRONTEND_PUBLIC_URL=https://app.tudominio.com
```

### Logo

El logo debe estar en: `public/logo.png`

El backend sirve automáticamente la carpeta `public/` como estática, por lo que el logo estará disponible en:
```
http://localhost:4000/logo.png
```

## Verificación

### 1. Verificar que el logo es accesible

```bash
node scripts/check_logo.js
```

### 2. Probar envío de correo

```bash
node scripts/test_email.js
```

### 3. Verificar en navegador

Abre en tu navegador:
```
http://localhost:4000/logo.png
```

Deberías ver el logo de INTISOFT.

## Compatibilidad

### ✅ Clientes de Correo Soportados

- Gmail (web y móvil)
- Outlook (todas las versiones)
- Apple Mail
- Yahoo Mail
- Thunderbird
- Otros clientes populares

### Técnicas de Compatibilidad Usadas

1. **Layout con tablas**: En lugar de div + flexbox/grid
2. **CSS inline**: Todo el CSS está en atributos `style`
3. **Colores en formato hex**: `#0ea5e9` en lugar de `rgb()`
4. **Tipografía segura**: Arial, Helvetica, sans-serif
5. **Imágenes con tamaño fijo**: width y height especificados
6. **Sin JavaScript**: Solo HTML + CSS inline
7. **Border-radius limitado**: Solo en lugares soportados
8. **Gradientes con fallback**: Color sólido si no soporta gradiente

## Elementos del Diseño

### Header
- Fondo azul con gradiente (fallback a color sólido)
- Logo en círculo blanco de 100px
- Nombre de la empresa en blanco
- Título del correo

### Contenido
- Icono de éxito circular verde
- Texto descriptivo
- Caja del número de ticket con borde punteado
- Tabla de información del ticket
- Sección de estado con 3 pasos
- Botón de acción principal

### Footer
- Información sobre notificaciones
- Instrucciones de contacto
- Copyright con año dinámico

## Colores Corporativos

```css
Azul primario:   #0ea5e9
Azul secundario: #0284c7
Verde éxito:     #10b981
Gris texto:      #64748b
Gris oscuro:     #1e293b
Gris claro:      #e2e8f0
Fondo claro:     #f8fafc
Fondo página:    #f1f5f9
```

## Pruebas Recomendadas

1. **Enviar correo de prueba** a tu propia cuenta
2. **Revisar en Gmail** (web y móvil)
3. **Revisar en Outlook** (si tienes acceso)
4. **Verificar que el logo carga** correctamente
5. **Probar el botón** de ver ticket
6. **Revisar en modo oscuro** (si aplica)

## Solución de Problemas

### El logo no aparece en el correo

1. Verifica que el servidor esté corriendo
2. Confirma que `BACKEND_PUBLIC_URL` esté en `.env`
3. Verifica que el logo exista en `public/logo.png`
4. Prueba abrir `http://localhost:4000/logo.png` en el navegador
5. En producción, usa HTTPS y una URL pública

### El diseño se ve roto en Outlook

- Asegúrate de usar solo tablas para layout
- Verifica que todo el CSS esté inline
- No uses flexbox ni grid
- Usa colores en formato hex (#rrggbb)

### Los colores se ven diferentes

- Algunos clientes de correo ajustan los colores
- Usa colores web-safe cuando sea posible
- Prueba en diferentes clientes

## Recursos Adicionales

- [Can I Email](https://www.caniemail.com/) - Compatibilidad CSS en emails
- [Litmus](https://litmus.com/) - Testing de emails
- [Email on Acid](https://www.emailonacid.com/) - Testing multiplataforma
