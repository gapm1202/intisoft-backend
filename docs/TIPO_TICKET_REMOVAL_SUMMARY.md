# Eliminación de campos tipo_ticket del catálogo

## Resumen de cambios

Se han eliminado todos los campos relacionados con "Tipo de ticket" del módulo de catálogo.

## Base de Datos

### Migration 056: `056_remove_tipo_ticket_from_catalogo.sql`

**Cambios en `catalogo_categorias`:**
- ❌ Eliminado: `tipo_ticket`

**Cambios en `catalogo_subcategorias`:**
- ❌ Eliminado: `tipo_ticket`
- ❌ Eliminado: `hereda_tipo`

**Estado:** ✅ Ejecutada exitosamente

## Código actualizado

### 1. Modelos (`catalogo.model.ts`)
- **CatalogoCategoria**: Removido campo `tipoTicket`
- **CatalogoSubcategoria**: Removido campos `tipoTicket`, `heredaTipo`, `tipoTicketEfectivo`
- **CategoriaInput**: Removido campo `tipoTicket`
- **SubcategoriaInput**: Removido campos `tipoTicket`, `heredaTipo`

### 2. Repositorio (`catalogo.repository.ts`)
- **ListCategoriaOptions**: Removido parámetro `tipo`
- **ListSubcategoriaOptions**: Removido parámetro `tipo`
- **mapCategoria()**: No retorna `tipoTicket`
- **mapSubcategoria()**: No retorna `tipoTicket`, `heredaTipo`, `tipoTicketEfectivo`
- **listCategorias()**: Eliminado filtro por `tipo_ticket`
- **listSubcategorias()**: Eliminado filtro por `tipo_ticket`, eliminado JOIN de `c.tipo_ticket`
- **createCategoria()**: No inserta `tipo_ticket`
- **createSubcategoria()**: No inserta `tipo_ticket` ni `hereda_tipo`
- **updateCategoria()**: No actualiza `tipo_ticket`
- **updateSubcategoria()**: No actualiza `tipo_ticket` ni `hereda_tipo`
- **listTipos()**: Retorna array vacío
- **createTipo()**: Lanza error "Tipos de ticket no son soportados"
- **deleteTipo()**: Lanza error "Tipos de ticket no son soportados"
- **isTipoReferenced()**: Retorna `false`

### 3. Controlador (`catalogo.controller.ts`)
- **createSubcategoria()**: Removida referencia a `tipoTicket` en logs

## Endpoints afectados

Los siguientes endpoints ya NO retornan ni aceptan campos relacionados con tipos:

### Categorías
- `GET /api/catalogo/categorias` - No retorna `tipoTicket`
- `POST /api/catalogo/categorias` - No acepta `tipoTicket`
- `PATCH /api/catalogo/categorias/:id` - No acepta `tipoTicket`
- `GET /api/catalogo/categorias/:id` - No retorna `tipoTicket`

### Subcategorías
- `GET /api/catalogo/subcategorias` - No retorna `tipoTicket`, `heredaTipo`, `tipoTicketEfectivo`
- `POST /api/catalogo/subcategorias` - No acepta `tipoTicket`, `heredaTipo`
- `PATCH /api/catalogo/subcategorias/:id` - No acepta `tipoTicket`, `heredaTipo`
- `GET /api/catalogo/subcategorias/:id` - No retorna `tipoTicket`, `heredaTipo`, `tipoTicketEfectivo`

### Tipos (Deprecados)
- `GET /api/catalogo/tipos` - Retorna array vacío `[]`
- `POST /api/catalogo/tipos` - Lanza error 500
- `DELETE /api/catalogo/tipos/:tipo` - Lanza error 500

## Verificación

```bash
# Ejecutar migración
node scripts/run_migration_056.js

# Resultado esperado:
✅ tipo_ticket removed from catalogo_categorias
✅ tipo_ticket and hereda_tipo removed from catalogo_subcategorias
```

## Impacto en Frontend

⚠️ **El frontend debe dejar de enviar/esperar estos campos:**

**Categorías:**
```typescript
// ❌ ANTES
{ tipoTicket: "incidente" }

// ✅ AHORA
// No enviar ni esperar tipoTicket
```

**Subcategorías:**
```typescript
// ❌ ANTES
{ tipoTicket: "solicitud", heredaTipo: true }

// ✅ AHORA  
// No enviar ni esperar tipoTicket o heredaTipo
```

## Estado final

✅ Todas las tablas actualizadas
✅ Todos los modelos actualizados
✅ Todos los repositorios actualizados
✅ Todos los controladores actualizados
✅ Sin errores de TypeScript
✅ Servidor funcionando correctamente

Las categorías y subcategorías ya no tienen ninguna relación con tipos de ticket.
