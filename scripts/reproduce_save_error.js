const http = require('http');
const { Pool } = require('pg');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sIjoiYWRtaW5pc3RyYWRvciIsImlhdCI6MTc2MzQxMjcxNCwiZXhwIjoxNzYzNDQxNTE0fQ.bu-HLX0UQPkG9Cumg9DUZgLHMUM1CqVKLNkLKnucUv4';

const payload = JSON.stringify({
  id: Date.now(),
  nombre: 'Laptop d,w,ldw',
  categoria: 'Laptop',
  fabricante: 'swsw ',
  modelo: 'd,w,ldw',
  serie: '254158',
  assetId: '',
  area: 'hola',
  estadoActivo: 'inactivo',
  estadoOperativo: 'mantenimiento',
  fechaCompra: '2025-10-29',
  fechaFinGarantia: '2025-11-06',
  proveedor: 'cdscds',
  ip: '5551515',
  mac: '558485515ds',
  usuarioAsignado: 'grecia',
  correoUsuario: 'admin@intisoft.com',
  cargoUsuario: 'Almacen',
  observaciones: 'www',
  empresaId: '29',
  sedeId: '16',
  empresaNombre: 'pruebaa22',
  sedeNombre: 'prueba 1344',
  camposPersonalizados: {},
  camposPersonalizadosArray: { RAM: [{ Tipo: 'wsw', Capacidad: '16' }] },
  fotos: [{ name: 'ddd.jpg', description: 'ww' }]
});

const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/api/empresas/29/sedes/16/inventario',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
    'Authorization': `Bearer ${token}`
  }
};

const req = http.request(options, (res) => {
  console.log('CLIENT STATUS:', res.statusCode);
  res.setEncoding('utf8');
  let body = '';
  res.on('data', (chunk) => { body += chunk; });
  res.on('end', async () => {
    console.log('CLIENT BODY:', body);
    const pool = new Pool({ connectionString: 'postgresql://postgres:1234@localhost:5432/inticorp' });
    try {
      const r = await pool.query('SELECT id, asset_id, empresa_id, sede_id, created_at FROM inventario ORDER BY id DESC LIMIT 10');
      console.log('DB LAST ROWS:', JSON.stringify(r.rows, null, 2));
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
