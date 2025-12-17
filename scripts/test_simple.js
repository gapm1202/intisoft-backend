const http = require('http');
const jwt = require('jsonwebtoken');

const secret = '1234';
const token = jwt.sign({ id: 1, rol: 'administrador' }, secret, { expiresIn: '1h' });

const payload = JSON.stringify({
  nombre: 'Test Empresa Simple',
  ruc: '20111111111',
  direccionFiscal: 'Av. Test 123',
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
  }
};

console.log('Testing simple POST...\n');

const req = http.request(options, (res) => {
  console.log('Status:', res.statusCode);
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('\nResponse:\n');
    try {
      const json = JSON.parse(data);
      console.log(JSON.stringify(json, null, 2));
    } catch (e) {
      console.log(data);
    }
    process.exit(0);
  });
});

req.on('error', (e) => {
  console.error('Error:', e);
  process.exit(1);
});

req.write(payload);
req.end();
