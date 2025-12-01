const http = require('http');
const { Pool } = require('pg');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sIjoiYWRtaW5pc3RyYWRvciIsImlhdCI6MTc2MzQxMDQyOCwiZXhwIjoxNzYzNDE0MDI4fQ.SAXKcnKhnQGJA8cjMsk2tuYIbPn5Y4w5Gv-Er0QTvJo';

const payload = JSON.stringify({
  assetId: 'FRONT-END-TEST-01',
  categoria: 'Laptop',
  area: 'Oficina',
  fabricante: 'ACME',
  modelo: 'X1',
  serie: 'SN123',
  estadoActivo: 'Activo',
  estadoOperativo: 'Operativo',
  fechaCompra: '2025-11-01',
  fechaFinGarantia: '2026-11-01',
  proveedor: 'ProveedorX',
  ip: '192.168.1.10',
  mac: 'AA:BB:CC:DD:EE:FF',
  usuarioAsignado: 'Juan Perez',
  correoUsuario: 'juan@example.com',
  cargoUsuario: 'Analista',
  camposPersonalizados: { RAM: '8GB', CPU: 'i5' },
  camposPersonalizadosArray: [{ tipo: 'RAM', capacidad: '8GB' }],
  observaciones: 'Prueba desde script',
  fotos: [{ name: 'foto1', description: 'frontal' }],
  empresaNombre: 'pruebaa22',
  sedeNombre: 'prueba 1344'
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
  console.log('STATUS:', res.statusCode);
  res.setEncoding('utf8');
  let body = '';
  res.on('data', (chunk) => { body += chunk; });
  res.on('end', async () => {
    console.log('BODY:', body);
    const pool = new Pool({ connectionString: 'postgresql://postgres:1234@localhost:5432/inticorp' });
    try {
      const r = await pool.query('SELECT id, empresa_id, sede_id, asset_id, categoria, area, campos_personalizados, campos_personalizados_array, fotos, created_at FROM inventario WHERE asset_id = $1', ['FRONT-END-TEST-01']);
      console.log('DB rows for asset:', JSON.stringify(r.rows, null, 2));
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
