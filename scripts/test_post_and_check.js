const http = require('http');
const { Pool } = require('pg');

// Allow overriding token via environment variable for easy local testing
const token = process.env.TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sIjoiYWRtaW5pc3RyYWRvciIsImlhdCI6MTc2MzQxMDQyOCwiZXhwIjoxNzYzNDE0MDI4fQ.SAXKcnKhnQGJA8cjMsk2tuYIbPn5Y4w5Gv-Er0QTvJo';
const payload = JSON.stringify({ assetId: 'TEST-END-001', categoria: 'CategoriaTest', area: 'AreaTest', fabricante: 'MarcaX' });

const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/api/empresas/29/inventario',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
    'Authorization': `Bearer ${token}`
  }
};

const req = http.request(options, (res) => {
  console.log('STATUS:', res.statusCode);
  res.setEncoding('utf8');
  let body = '';
  res.on('data', (chunk) => { body += chunk; });
  res.on('end', async () => {
    console.log('BODY:', body);
    // after response, query DB for latest activos
    const pool = new Pool({ connectionString: 'postgresql://postgres:1234@localhost:5432/inticorp' });
    try {
      const r = await pool.query('SELECT id, empresa_id, sede_id, asset_id, categoria, area, campos_dinamicos, created_at FROM activos ORDER BY id DESC LIMIT 5');
      console.log('DB rows:', r.rows);
    } catch (e) {
      console.error('DB query error', e);
    } finally {
      await pool.end();
      process.exit(0);
    }
  });
});

req.on('error', (e) => { console.error('request error', e); process.exit(1); });
req.write(payload);
req.end();
