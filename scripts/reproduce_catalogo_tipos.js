const http = require('http');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';
const token = jwt.sign({ id: 1, rol: 'administrador' }, JWT_SECRET, { expiresIn: '1h' });

const db = new Pool({ connectionString: process.env.DATABASE_URL });

function request(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'localhost',
      port: 4000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    };
    if (payload) options.headers['Content-Length'] = Buffer.byteLength(payload);

    const req = http.request(options, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        const status = res.statusCode;
        let parsed = null;
        try { parsed = JSON.parse(body); } catch (e) { parsed = body; }
        resolve({ status, body: parsed });
      });
    });
    req.on('error', (e) => reject(e));
    if (payload) req.write(payload);
    req.end();
  });
}

(async function main() {
  try {
    console.log('Starting reproduction script...');

    // 1) Ensure tipo exists
    console.log('Creating tipo "fff"...');
    const rTipo = await request('/api/catalogo/tipos', 'POST', { tipo: 'fff' });
    console.log('POST /api/catalogo/tipos ->', rTipo.status, rTipo.body);

    // 2) Create category with tipoTicket 'fff'
    const nombreCat = 'Correos Test ' + Date.now();
    console.log('Creating categoria with tipoTicket fff...');
    const rCat = await request('/api/catalogo/categorias', 'POST', { nombre: nombreCat, tipoTicket: 'fff' });
    console.log('POST /api/catalogo/categorias ->', rCat.status, rCat.body);
    const categoriaId = rCat.body && rCat.body.data && rCat.body.data.id;
    if (!categoriaId) throw new Error('No category id returned');

    // 3) Create subcategoria with heredaTipo true and tipoTicket 'fff'
    console.log('Creating subcategoria heredaTipo true tipoTicket fff...');
    const rSub = await request('/api/catalogo/subcategorias', 'POST', { categoriaId, nombre: 'SubTest' + Date.now(), heredaTipo: true, tipoTicket: 'fff' });
    console.log('POST /api/catalogo/subcategorias ->', rSub.status, rSub.body);

    // 4) Inspect DB row directly
    const resDb = await db.query('SELECT id, categoria_id, nombre, tipo_ticket, hereda_tipo FROM catalogo_subcategorias WHERE categoria_id = $1 ORDER BY id DESC LIMIT 5', [categoriaId]);
    console.log('DB recent subcategorias for categoriaId:', JSON.stringify(resDb.rows, null, 2));

    // 5) Try GET tipos
    const rList = await request('/api/catalogo/tipos', 'GET');
    console.log('GET /api/catalogo/tipos ->', rList.status, rList.body);

    console.log('Done. Check outputs above for whether tipo_ticket was preserved or overwritten and whether tipos endpoint is available.');
  } catch (e) {
    console.error('Error during reproduction:', e);
  } finally {
    await db.end();
    process.exit(0);
  }
})();