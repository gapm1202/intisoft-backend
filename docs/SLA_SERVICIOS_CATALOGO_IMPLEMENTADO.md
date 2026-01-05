# ✅ Campo serviciosCatalogoSLA implementado en Backend

## Confirmación de implementación

El backend ahora soporta el nuevo campo `serviciosCatalogoSLA` en la columna `alcance` (JSONB) de la tabla `sla_configuracion`.

---

## Estructura implementada

### TypeScript Interface actualizado:
```typescript
export interface SLAAlcance {
  slaActivo: boolean;
  aplicaA: string;
  tipoServicioCubierto: string;
  serviciosCubiertos: { ... };
  activosCubiertos: { ... };
  sedesCubiertas: { ... };
  serviciosCatalogoSLA?: {
    tipo: 'todos' | 'seleccionados';
    servicios: string[]; // IDs de servicios del catálogo
  };
  observaciones?: string;
}
```

---

## Validaciones implementadas

✅ **Tipo correcto**: Valida que `tipo` sea `'todos'` o `'seleccionados'`  
✅ **Array de servicios**: Valida que `servicios` sea un array  
⚠️ **Advertencia**: Si `tipo = 'seleccionados'` y el array está vacío, se muestra warning en consola

---

## Ejemplos de uso

### 1. Todos los servicios cubiertos
```json
POST/PUT /api/sla/configuracion/:empresaId/alcance
{
  "serviciosCatalogoSLA": {
    "tipo": "todos",
    "servicios": []
  }
}
```

### 2. Solo servicios seleccionados
```json
POST/PUT /api/sla/configuracion/:empresaId/alcance
{
  "serviciosCatalogoSLA": {
    "tipo": "seleccionados",
    "servicios": ["1", "3", "5"]
  }
}
```

### 3. No especificar el campo (opcional)
```json
POST/PUT /api/sla/configuracion/:empresaId/alcance
{
  "slaActivo": true,
  "aplicaA": "incidentes"
  // serviciosCatalogoSLA es opcional
}
```

---

## Respuesta del backend

Al hacer GET de la configuración SLA, el campo se retornará tal como fue guardado:

```json
{
  "id": 123,
  "empresaId": 85,
  "alcance": {
    "slaActivo": true,
    "aplicaA": "incidentes",
    "serviciosCatalogoSLA": {
      "tipo": "seleccionados",
      "servicios": ["1", "3", "5"]
    },
    ...
  },
  ...
}
```

---

## Notas importantes

1. **Campo opcional**: Si no se envía `serviciosCatalogoSLA`, el backend no lo requiere
2. **IDs como strings**: Los IDs se guardan como strings en el array (ejemplo: `["1", "3", "5"]`)
3. **Sin validación FK**: Por ahora no se valida que los IDs existan en `catalogo_servicios` (se puede agregar si es necesario)
4. **JSONB**: El campo se guarda en la columna `alcance` que es de tipo JSONB, permitiendo estructura flexible

---

## Validación sugerida adicional (opcional)

Si desean validar que los IDs existan en `catalogo_servicios`, podemos agregar:

```typescript
// En sla.service.ts
if (scs.tipo === 'seleccionados' && scs.servicios.length > 0) {
  // Verificar que todos los IDs existan en catalogo_servicios
  const serviciosRepo = new ServiciosRepository();
  for (const id of scs.servicios) {
    const existe = await serviciosRepo.getServicioById(parseInt(id));
    if (!existe) {
      throw new Error(`Servicio con ID ${id} no existe en catálogo`);
    }
  }
}
```

**¿Desean que agregue esta validación?**

---

## Archivos modificados

- ✅ `src/models/sla.model.ts` - Interface `SLAAlcance` actualizado
- ✅ `src/services/sla.service.ts` - Validación agregada en `validateSeccionData()`

---

## Estado: ✅ LISTO PARA USAR

El frontend puede comenzar a enviar el campo `serviciosCatalogoSLA` en las peticiones de actualización de alcance SLA.
