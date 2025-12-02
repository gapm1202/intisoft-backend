const jwt = require('jsonwebtoken');
const http = require('http');
require('dotenv').config();

const secret = process.env.JWT_SECRET || '1234';
const payload = { id: 1, rol: 'administrador' };
const token = jwt.sign(payload, secret, { expiresIn: '7d' });

const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/api/activos/PC-0006/token',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Content-Length': 0
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log('HEADERS:', res.headers);
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('BODY:', data);
    process.exit(0);
  });
});

req.on('error', (e) => {
  console.error('request error', e);
  process.exit(2);
});

req.end();
