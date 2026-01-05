const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sIjoiYWRtaW5pc3RyYWRvciIsImlhdCI6MTc2NzU2NzM1MSwiZXhwIjoxNzY4MTcyMTUxfQ.LrikhNdgdAsLCfnSsKj5ufwp3DJvk-sr0nFcyXyefwQ';

fetch('http://localhost:4000/api/empresas/86/usuarios', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(resp => {
  console.log(`\n✅ Total usuarios: ${resp.data.length}\n`);
  
  // Mostrar solo usuarios con activos asignados
  const usuariosConActivos = resp.data.filter(u => u.activosAsignados && u.activosAsignados.length > 0);
  
  console.log(`📦 Usuarios con activos (${usuariosConActivos.length}):`);
  usuariosConActivos.forEach(u => {
    console.log(`\n  👤 ${u.nombreCompleto} (ID: ${u.id})`);
    console.log(`     Cantidad: ${u.cantidadActivosAsignados}`);
    u.activosAsignados.forEach(a => {
      console.log(`     - [${a.id}] ${a.codigo} (${a.categoria})`);
    });
  });
})
.catch(err => console.error('❌ Error:', err.message));
