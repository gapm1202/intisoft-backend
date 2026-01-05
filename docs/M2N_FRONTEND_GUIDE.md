# 🎯 GUÍA RÁPIDA - M:N USUARIOS ↔ ACTIVOS (Para Frontend)

## ✅ ¿Qué cambió?

**ANTES (1:1):**
- Un usuario = UN activo
- Un activo = UN usuario

**AHORA (M:N):**
- Un usuario = MÚLTIPLES activos
- Un activo = MÚLTIPLES usuarios

## 🔌 Nuevos Endpoints

### 1. Asignar usuarios a un activo
```typescript
POST /api/inventario/:activoId/usuarios

const response = await api.post(`/inventario/${activoId}/usuarios`, {
  usuarioIds: ['123', '456'],
  motivo: 'Impresora compartida',
  asignadoPor: 'Admin'
});
```

### 2. Ver usuarios de un activo
```typescript
GET /api/inventario/:activoId/usuarios

const { usuarios, totalUsuarios } = await api.get(`/inventario/${activoId}/usuarios`);
```

### 3. Quitar usuario de activo
```typescript
DELETE /api/inventario/:activoId/usuarios/:usuarioId

await api.delete(`/inventario/${activoId}/usuarios/${usuarioId}`, {
  motivo: 'Ya no usa el equipo'
});
```

### 4. Asignar activos a un usuario
```typescript
POST /api/usuarios/:usuarioId/activos

await api.post(`/usuarios/${usuarioId}/activos`, {
  activoIds: ['789', '790', '791'],
  motivo: 'Setup completo',
  asignadoPor: 'IT'
});
```

### 5. Ver activos de un usuario
```typescript
GET /api/usuarios/:usuarioId/activos

const { activos, totalActivos } = await api.get(`/usuarios/${usuarioId}/activos`);
```

### 6. Quitar activo de usuario
```typescript
DELETE /api/usuarios/:usuarioId/activos/:activoId

await api.delete(`/usuarios/${usuarioId}/activos/${activoId}`, {
  motivo: 'Cambio de equipo'
});
```

## 🔄 Cambios en Endpoints Existentes

### GET /api/inventario/:id

**NUEVOS CAMPOS:**
```typescript
{
  // ... campos existentes ...
  
  // 🆕 Campos M:N (USAR ESTOS)
  usuariosAsignados: [
    {
      id: 123,
      nombreCompleto: "Juan Pérez",
      correo: "juan@empresa.com",
      cargo: "Desarrollador",
      telefono: "+1234567890",
      fechaAsignacion: "2024-01-15T10:30:00Z"
    }
  ],
  cantidadUsuariosAsignados: 2,
  
  // ⚠️ Legacy (NO USAR - solo compatibilidad)
  usuarioAsignadoId: "123",  // Primer usuario del array
  usuarioAsignadoData: {...}
}
```

### GET /api/empresas/:empresaId/usuarios

**NUEVOS CAMPOS:**
```typescript
{
  // ... campos existentes ...
  
  // 🆕 Campos M:N (USAR ESTOS)
  activosAsignados: [
    {
      id: 789,
      assetId: "LPT-001",
      nombre: "Laptop Dell",
      categoria: "Laptop",
      fechaAsignacion: "2024-01-15T10:30:00Z"
    }
  ],
  cantidadActivosAsignados: 3,
  
  // ⚠️ Legacy (NO USAR - solo compatibilidad)
  activoAsignadoId: "789",  // Primer activo del array
  activoCodigo: "LPT-001"
}
```

## 📝 Cómo Migrar tu Código

### ANTES (❌ Código viejo):
```typescript
// Mostrar usuario asignado (solo 1)
if (inventario.usuarioAsignadoData) {
  return <span>{inventario.usuarioAsignadoData.nombreCompleto}</span>;
}
```

### AHORA (✅ Código nuevo):
```typescript
// Mostrar usuarios asignados (múltiples)
if (inventario.usuariosAsignados && inventario.usuariosAsignados.length > 0) {
  return (
    <ul>
      {inventario.usuariosAsignados.map(u => (
        <li key={u.id}>
          {u.nombreCompleto} - {u.cargo}
          <button onClick={() => desasignarUsuario(inventario.id, u.id)}>
            Quitar
          </button>
        </li>
      ))}
    </ul>
  );
}
```

### Asignar múltiples usuarios:
```typescript
// Modal para asignar usuarios
const asignarUsuarios = async () => {
  await api.post(`/inventario/${activoId}/usuarios`, {
    usuarioIds: selectedUserIds,  // ['123', '456', '789']
    motivo: motivoAsignacion,
    asignadoPor: currentUser.nombre
  });
  
  // Refrescar datos
  await refetchInventario();
};
```

## 🎨 Componentes Sugeridos

### Badge de Contador
```tsx
<Badge color="primary">
  {inventario.cantidadUsuariosAsignados} usuarios
</Badge>
```

### Lista Expandible
```tsx
{inventario.cantidadUsuariosAsignados > 0 && (
  <details>
    <summary>
      {inventario.cantidadUsuariosAsignados} usuario(s) asignado(s)
    </summary>
    <ul>
      {inventario.usuariosAsignados.map(u => (
        <li key={u.id}>
          {u.nombreCompleto} ({u.correo})
          <small>Desde: {formatDate(u.fechaAsignacion)}</small>
        </li>
      ))}
    </ul>
  </details>
)}
```

### Selector Múltiple
```tsx
<select multiple value={selectedUserIds} onChange={handleChange}>
  {usuarios.map(u => (
    <option key={u.id} value={u.id}>
      {u.nombreCompleto} - {u.cargo}
    </option>
  ))}
</select>
```

## 🚨 Límites

- **Máximo 10 usuarios por activo**
- **Máximo 20 activos por usuario**

Si se excede:
```json
{
  "error": "El activo no puede tener más de 10 usuarios asignados"
}
```

## 🧪 Testing

Ejecutar tests backend:
```bash
node scripts/test_m2n_endpoints.js
```

## 📞 Soporte

Cualquier duda sobre la implementación:
1. Revisar [M2N_IMPLEMENTATION.md](./M2N_IMPLEMENTATION.md) para detalles técnicos
2. Probar endpoints con Postman usando los ejemplos
3. Consultar logs del servidor para debugging

---

## ✨ Beneficios

- ✅ Múltiples usuarios pueden compartir equipos (impresoras, proyectores)
- ✅ Un usuario puede tener setup completo (laptop + mouse + teclado)
- ✅ Historial completo de asignaciones (auditoría)
- ✅ Compatibilidad con código existente (dual format)
- ✅ Soft delete (no se pierde información)

**🎉 La implementación está lista y funcionando en el backend.**
