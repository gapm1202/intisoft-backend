const http = require('http');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';
const token = jwt.sign({ id: 1, rol: 'administrador' }, JWT_SECRET, { expiresIn: '1h' });

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
    console.log('Checking GET /api/catalogo/tipos');
    const rGet = await request('/api/catalogo/tipos', 'GET');
    console.log('GET /api/catalogo/tipos ->', rGet.status, rGet.body);
    if (rGet.status !== 200) throw new Error('GET /api/catalogo/tipos not 200');
    if (!rGet.body || !Array.isArray(rGet.body.data)) throw new Error('GET /api/catalogo/tipos returned unexpected body');

    const tipo = 'testtipo' + Date.now();
    console.log('Creating tipo:', tipo);
    const rPostTipo = await request('/api/catalogo/tipos', 'POST', { tipo });
    console.log('POST /api/catalogo/tipos ->', rPostTipo.status, rPostTipo.body);
    if (rPostTipo.status !== 201) throw new Error('POST /api/catalogo/tipos failed');

    // create category
    const nombreCat = 'CatTest ' + Date.now();
    const rCat = await request('/api/catalogo/categorias', 'POST', { nombre: nombreCat, tipoTicket: tipo });
    console.log('POST /api/catalogo/categorias ->', rCat.status, rCat.body);
    if (rCat.status !== 201) throw new Error('POST /api/catalogo/categorias failed');
    const categoriaId = rCat.body && rCat.body.data && rCat.body.data.id;
    if (!categoriaId) throw new Error('No category id returned');

    // create subcategoria with heredaTipo true
    const rSub = await request('/api/catalogo/subcategorias', 'POST', { categoriaId, nombre: 'SubTest', heredaTipo: true, tipoTicket: tipo });
    console.log('POST /api/catalogo/subcategorias ->', rSub.status, rSub.body);
    if (rSub.status !== 201) throw new Error('POST /api/catalogo/subcategorias failed');
    const savedTipo = rSub.body && rSub.body.data && rSub.body.data.tipoTicket;
    if (savedTipo !== tipo.toLowerCase() && savedTipo !== tipo) {
      throw new Error(`Subcategoria saved tipo mismatch: expected ${tipo} but got ${savedTipo}`);
    }

    console.log('All checks passed');
    process.exit(0);
  } catch (e) {
    console.error('Check failed:', e.message || e);
    process.exit(1);
  }
})();