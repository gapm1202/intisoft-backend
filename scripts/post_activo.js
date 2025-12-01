const http = require('http');
const data = JSON.stringify({ assetId: 'TEST-API-003', categoria: 'CategoriaAPI' });

const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/api/empresas/29/inventario',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sIjoiYWRtaW5pc3RyYWRvciIsImlhdCI6MTc2MzQwOTcyOSwiZXhwIjoxNzYzNDEzMzI5fQ.CJ3x1nV1SppiMtB-Snq9p9ph9Lt2Fzf2i4CjCEnlGUg'
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log('HEADERS:', res.headers);
  res.setEncoding('utf8');
  let body = '';
  res.on('data', (chunk) => { body += chunk; });
  res.on('end', () => { console.log('BODY:', body); });
});

req.on('error', (e) => { console.error(`problem with request: ${e.message}`); });

req.write(data);
req.end();
