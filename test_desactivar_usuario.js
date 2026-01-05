// Test desactivar usuario endpoint
const http = require('http');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sIjoiYWRtaW5pc3RyYWRvciIsImlhdCI6MTc2NzU2NzM1MSwiZXhwIjoxNzY4MTcyMTUxfQ.LrikhNdgdAsLCfnSsKj5ufwp3DJvk-sr0nFcyXyefwQ';

const data = JSON.stringify({
  motivo: 'Motivo de la desactivacion (minimo 10 caracteres)',
  observacionAdicional: 'Informacion adicional opcional'
});

const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/api/empresas/86/usuarios/11/desactivar',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'Content-Length': data.length
  }
};

console.log('Testing POST /api/empresas/86/usuarios/11/desactivar');
console.log('Payload:', data);

const req = http.request(options, (res) => {
  console.log(`\nSTATUS: ${res.statusCode}`);
  
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
  console.error(`\nERROR: ${e.message}`);
  console.error('El servidor no está respondiendo. Verifica que esté corriendo en puerto 4000');
});

req.write(data);
req.end();
