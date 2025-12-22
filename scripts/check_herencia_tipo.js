const { Pool } = require('pg');
const http = require('http');
const jwt = require('jsonwebtoken');
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
    console.log('Creating category tipo="solicitud"...');
    const rCat = await request('/api/catalogo/categorias', 'POST', { nombre: 'CatHerencia ' + Date.now(), tipoTicket: 'Solicitud' });
    if (rCat.status !== 201) throw new Error('create categoria failed: ' + JSON.stringify(rCat));
    const categoriaId = rCat.body.data.id;

    console.log('Creating subcategoria heredaTipo:true tipoTicket:"solicitud"...');
    const rSub = await request('/api/catalogo/subcategorias', 'POST', { categoriaId, nombre: 'SubHerencia', heredaTipo: true, tipoTicket: 'solicitud' });
    console.log('SUB RESPONSE:', rSub.status, rSub.body);
    if (rSub.status !== 201) throw new Error('create subcategoria failed: ' + JSON.stringify(rSub));

    const dbRes = await db.query('SELECT id, categoria_id, nombre, tipo_ticket FROM catalogo_subcategorias WHERE categoria_id = $1 ORDER BY id DESC LIMIT 1', [categoriaId]);
    console.log('DB ROW:', dbRes.rows[0]);
    const savedTipo = dbRes.rows[0].tipo_ticket ? dbRes.rows[0].tipo_ticket.trim().toLowerCase() : null;
    if (savedTipo !== 'solicitud') {
      throw new Error('Herencia falló: esperado "solicitud" pero DB guardó: ' + savedTipo);
    }

    console.log('Herencia OK: saved tipo is solicitud');
    process.exit(0);
  } catch (e) {
    console.error('Check failed:', e.message || e);
    process.exit(1);
  } finally {
    await db.end();
  }
})();