const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sIjoiYWRtaW5pc3RyYWRvciIsImlhdCI6MTc2NzU2NzM1MSwiZXhwIjoxNzY4MTcyMTUxfQ.LrikhNdgdAsLCfnSsKj5ufwp3DJvk-sr0nFcyXyefwQ';

const nuevoUsuario = {
  empresaId: "86",
  sedeId: "35",
  nombreCompleto: "Test ActivosIds",
  correo: "test.activosids@gmail.com",
  cargo: "Tester",
  activoAsignadoId: null,
  activosIds: ["62", "61"]  // Array con 2 activos
};

console.log('📤 Enviando POST con activosIds:', nuevoUsuario.activosIds);

fetch('http://localhost:4000/api/empresas/86/usuarios', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(nuevoUsuario)
})
.then(r => r.json())
.then(async resp => {
  console.log('\n✅ Usuario creado, ID:', resp.data.id);
  console.log('📝 Nombre:', resp.data.nombreCompleto);
  console.log('📊 Cantidad Activos (CREATE):', resp.data.cantidadActivosAsignados);
  console.log('📦 activosAsignados (CREATE):', JSON.stringify(resp.data.activosAsignados, null, 2));
  
  // Hacer GET para verificar
  console.log('\n🔍 Verificando con GET...');
  const getResp = await fetch(`http://localhost:4000/api/empresas/86/usuarios/${resp.data.id}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const getData = await getResp.json();
  
  console.log('\n✅ GET Response:');
  console.log('📊 Cantidad Activos (GET):', getData.data.cantidadActivosAsignados);
  console.log('📦 activosAsignados (GET):');
  if (getData.data.activosAsignados && getData.data.activosAsignados.length > 0) {
    getData.data.activosAsignados.forEach(a => {
      console.log(`  - [${a.id}] ${a.codigo} (${a.categoria})`);
    });
  } else {
    console.log('  ⚠️ VACÍO');
  }
})
.catch(err => console.error('❌ Error:', err.message));
