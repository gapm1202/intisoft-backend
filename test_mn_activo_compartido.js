// Test crear usuario con activo ya asignado (M:N)
const http = require('http');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sIjoiYWRtaW5pc3RyYWRvciIsImlhdCI6MTc2NzU2NzM1MSwiZXhwIjoxNzY4MTcyMTUxfQ.LrikhNdgdAsLCfnSsKj5ufwp3DJvk-sr0nFcyXyefwQ';

// Activo 58 ya está asignado al usuario 11
// Vamos a crear un NUEVO usuario y asignarle el mismo activo 58
const data = JSON.stringify({
  empresaId: '86',
  sedeId: '35',
  nombreCompleto: 'Test Usuario M:N',
  correo: `test.mn.${Date.now()}@example.com`, // Email único
  cargo: 'Tester',
  telefono: '999999999',
  activoAsignadoId: '58', // MISMO activo que usuario 11
  observaciones: 'Prueba M:N - múltiples usuarios pueden tener el mismo activo'
});

const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/api/empresas/86/usuarios',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'Content-Length': data.length
  }
};

console.log('='.repeat(60));
console.log('TEST: Crear usuario con activo YA ASIGNADO a otro usuario');
console.log('='.repeat(60));
console.log('POST /api/empresas/86/usuarios');
console.log('Activo a asignar: 58 (ya asignado a usuario 11)');
console.log('Payload:', JSON.parse(data));
console.log('='.repeat(60));

const req = http.request(options, (res) => {
  console.log(`\n✅ STATUS: ${res.statusCode}`);
  
  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });
  
  res.on('end', () => {
    console.log('\n📦 RESPONSE BODY:');
    try {
      const response = JSON.parse(body);
      console.log(JSON.stringify(response, null, 2));
      
      if (res.statusCode === 201 || res.statusCode === 200) {
        console.log('\n✅ ÉXITO: Usuario creado con activo ya asignado a otro usuario');
        console.log('✅ La relación M:N permite múltiples usuarios por activo');
        console.log(`\n🔍 Verificar en la BD:`);
        console.log(`   SELECT * FROM usuarios_activos WHERE activo_id = 58;`);
        console.log(`   Deberían aparecer múltiples registros (usuario 11 + nuevo usuario)`);
      } else {
        console.log('\n❌ FALLÓ: El backend sigue rechazando activos ya asignados');
        console.log('❌ Revisar validaciones en usuario-empresa.service.ts');
      }
    } catch (e) {
      console.log(body);
    }
  });
});

req.on('error', (e) => {
  console.error(`\n❌ ERROR: ${e.message}`);
  console.error('El servidor no está respondiendo. Verifica que esté corriendo en puerto 4000');
});

req.write(data);
req.end();
