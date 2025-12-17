#!/usr/bin/env node

const http = require('http');
const jwt = require('jsonwebtoken');

const secret = '1234';
const token = jwt.sign({ id: 1, rol: 'administrador' }, secret, { expiresIn: '1h' });

const payload = JSON.stringify({
  nombre: 'Test Auto codigo',
  ruc: '20666666666',
  direccionFiscal: 'Av Test',
  ciudad: 'Lima'
});

const options = {
  hostname: '127.0.0.1',
  port: 4000,
  path: '/api/empresas',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
    'Authorization': `Bearer ${token}`
  },
  timeout: 5000
};

console.log('Sending POST /api/empresas...');

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('\nResponse:');
    try {
      const json = JSON.parse(data);
      console.log(JSON.stringify(json, null, 2));
      
      if (json.codigoCliente) {
        console.log(`\n✅ codigoCliente: ${json.codigoCliente}`);
      }
    } catch (e) {
      console.log(data);
    }
  });
});

req.on('error', (e) => {
  console.error(`❌ Error: ${e.message}`);
  process.exit(1);
});

req.on('timeout', () => {
  console.error('❌ Request timeout');
  req.destroy();
  process.exit(1);
});

req.write(payload);
req.end();

setTimeout(() => {
  console.error('❌ Test timeout - no response');
  process.exit(1);
}, 8000);
