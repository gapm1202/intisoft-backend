const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sIjoiYWRtaW5pc3RyYWRvciIsImlhdCI6MTc2NzU2NzM1MSwiZXhwIjoxNzY4MTcyMTUxfQ.LrikhNdgdAsLCfnSsKj5ufwp3DJvk-sr0nFcyXyefwQ';

console.log('📧 Probando email actualizado con QR + Link\n');

const nuevoUsuario = {
  empresaId: "86",
  sedeId: "35",
  nombreCompleto: "Test QR con Link",
  correo: "greciaaperez1212@gmail.com",
  cargo: "Tester Email",
  telefono: "+51999999999",
  observaciones: "Prueba de email con QR + link debajo",
  activosIds: ["62", "61"]
};

console.log('👤 Creando usuario:', nuevoUsuario.nombreCompleto);
console.log('📧 Email destino:', nuevoUsuario.correo);
console.log('📦 Activos:', nuevoUsuario.activosIds.join(', '));
console.log('\n🚀 Enviando petición...\n');

fetch('http://localhost:4000/api/empresas/86/usuarios', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(nuevoUsuario)
})
.then(r => r.json())
.then(resp => {
  if (resp.success) {
    console.log('✅ Usuario creado exitosamente!');
    console.log(`🆔 ID: ${resp.data.id}`);
    console.log(`📊 Activos asignados: ${resp.data.cantidadActivosAsignados}`);
    
    console.log('\n📧 EMAIL ENVIÁNDOSE...\n');
    console.log('El email ahora incluye para cada activo:');
    console.log('  1. ✅ Datos del equipo (código, tipo, marca, modelo)');
    console.log('  2. ✅ QR Code (200x200px)');
    console.log('  3. ✅ Link clickeable debajo del QR');
    console.log('  4. ✅ Instrucciones de uso\n');
    
    console.log('📬 Formato del link en el email:');
    console.log('   http://localhost:5173/public/activos?token=[token]\n');
    
    console.log('⏰ Revisa tu bandeja en unos segundos.');
    console.log('📱 El link es clickeable y el QR es escaneable.\n');
  } else {
    console.log('❌ Error:', resp.error);
  }
})
.catch(err => console.error('❌ Error:', err.message));
