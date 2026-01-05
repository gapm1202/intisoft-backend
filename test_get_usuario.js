const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sIjoiYWRtaW5pc3RyYWRvciIsImlhdCI6MTc2NzU2NzM1MSwiZXhwIjoxNzY4MTcyMTUxfQ.LrikhNdgdAsLCfnSsKj5ufwp3DJvk-sr0nFcyXyefwQ';

fetch('http://localhost:4000/api/empresas/86/usuarios/16', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(resp => {
  console.log('\n✅ Usuario ID:', resp.data.id);
  console.log('📝 Nombre:', resp.data.nombreCompleto);
  console.log('📊 Cantidad Activos:', resp.data.cantidadActivosAsignados);
  console.log('\n📦 activosAsignados:');
  console.log(JSON.stringify(resp.data.activosAsignados, null, 2));
})
.catch(err => console.error('❌ Error:', err.message));
