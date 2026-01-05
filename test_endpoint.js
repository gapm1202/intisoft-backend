// Test asignar-activo endpoint
const http = require('http');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sIjoiYWRtaW5pc3RyYWRvciIsImlhdCI6MTczNzQ3MjkxNiwiZXhwIjoxNzM4MDc3NzE2fQ.SshDs8del2XCgmJVgVp6xkWfCdMNBnc5HWaMzrQlno4';

const data = JSON.stringify({
  activoId: '58',
  fechaAsignacion: '2026-01-04',
  motivo: 'gdfdfdfdfdfdf',
  observacion: 'gg'
});

const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/api/empresas/86/usuarios/11/asignar-activo',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'Content-Length': data.length
  }
};

console.log('Testing POST /api/empresas/86/usuarios/11/asignar-activo');
console.log('Payload:', data);

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  
  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });
  
  res.on('end', () => {
    console.log('\nRESPONSE BODY:');
    try {
      console.log(JSON.stringify(JSON.parse(body), null, 2));
    } catch (e) {
      console.log(body);
    }
  });
});

req.on('error', (e) => {
  console.error(`ERROR: ${e.message}`);
  console.error('El servidor no está respondiendo. Verifica que esté corriendo en puerto 4000');
});

req.write(data);
req.end();
