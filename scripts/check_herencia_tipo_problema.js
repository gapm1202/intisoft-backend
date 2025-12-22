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
    const tipo = 'problema';
    console.log('Creating category tipo="' + tipo + '"...');
    const uniqueName = 'CatHerencia ' + Date.now() + '-' + Math.floor(Math.random() * 100000);
    const rCat = await request('/api/catalogo/categorias', 'POST', { nombre: uniqueName, tipoTicket: tipo });
    let categoriaId;
    if (rCat.status === 201) {
      categoriaId = rCat.body.data.id;
    } else if (rCat.status === 409) {
      // Colisión: tratar de reutilizar una categoría existente con el mismo tipo
      console.warn('Categoria creación devolvió 409, buscando categoría existente con tipo:', tipo);
      const list = await request('/api/catalogo/categorias?tipo=' + encodeURIComponent(tipo));
      if (list.status === 200 && Array.isArray(list.body.data) && list.body.data.length > 0) {
        categoriaId = list.body.data[0].id;
        console.log('Usando categoría existente id=', categoriaId);
      } else {
        throw new Error('create categoria failed: ' + JSON.stringify(rCat));
      }
    } else {
      throw new Error('create categoria failed: ' + JSON.stringify(rCat));
    }

    console.log('Creating subcategoria heredaTipo:true tipoTicket:"' + tipo + '"...');
    const uniqueSub = 'SubHerencia ' + Date.now() + '-' + Math.floor(Math.random() * 100000);
    const uniqueCodigo = 'TEST-' + Date.now() + '-' + Math.floor(Math.random() * 100000);
    const rSub = await request('/api/catalogo/subcategorias', 'POST', { categoriaId, nombre: uniqueSub, codigo: uniqueCodigo, heredaTipo: true, tipoTicket: tipo });
    console.log('SUB RESPONSE:', rSub.status, rSub.body);
    if (rSub.status !== 201) throw new Error('create subcategoria failed: ' + JSON.stringify(rSub));

    const dbRes = await db.query('SELECT id, categoria_id, nombre, tipo_ticket FROM catalogo_subcategorias WHERE categoria_id = $1 ORDER BY id DESC LIMIT 1', [categoriaId]);
    console.log('DB ROW:', dbRes.rows[0]);
    const savedTipo = dbRes.rows[0].tipo_ticket ? dbRes.rows[0].tipo_ticket.trim().toLowerCase() : null;
    if (savedTipo !== tipo) {
      throw new Error('Herencia falló: esperado "' + tipo + '" pero DB guardó: ' + savedTipo);
    }

    console.log('Herencia OK: saved tipo is', tipo);
    process.exit(0);
  } catch (e) {
    console.error('Check failed:', e.message || e);
    process.exit(1);
  } finally {
    await db.end();
  }
})();