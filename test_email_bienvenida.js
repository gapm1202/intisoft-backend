const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sIjoiYWRtaW5pc3RyYWRvciIsImlhdCI6MTc2NzU2NzM1MSwiZXhwIjoxNzY4MTcyMTUxfQ.LrikhNdgdAsLCfnSsKj5ufwp3DJvk-sr0nFcyXyefwQ';

const nuevoUsuario = {
  empresaId: "86",
  sedeId: "35",
  nombreCompleto: "Test Email Bienvenida",
  correo: "greciaaperez1212@gmail.com", // Email de prueba (el mismo que SMTP_USER para recibir el correo)
  cargo: "Tester Email",
  telefono: "+51999999999",
  observaciones: "Usuario de prueba para email de bienvenida",
  activosIds: ["62", "61"]  // Asignar 2 activos con QR
};

console.log('📤 Creando usuario con email de bienvenida...');
console.log(`📧 Email destino: ${nuevoUsuario.correo}`);
console.log(`📦 Activos a asignar: ${nuevoUsuario.activosIds.join(', ')}`);

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
    console.log('\n✅ Usuario creado exitosamente!');
    console.log(`🆔 Usuario ID: ${resp.data.id}`);
    console.log(`👤 Nombre: ${resp.data.nombreCompleto}`);
    console.log(`📊 Activos asignados: ${resp.data.cantidadActivosAsignados}`);
    console.log('\n📧 Email de bienvenida enviándose en segundo plano...');
    console.log(`✉️  Revisa la bandeja de: ${nuevoUsuario.correo}`);
    console.log('\n⏰ El email puede tardar unos segundos en llegar.');
    console.log('📋 El email incluirá:');
    console.log('   - Datos del usuario');
    console.log('   - Lista de equipos asignados');
    console.log('   - Códigos QR para reportar problemas');
    console.log('   - Instrucciones de uso');
  } else {
    console.log('\n❌ Error:', resp.error);
  }
})
.catch(err => console.error('❌ Error en request:', err.message));
