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
    const tipo = 'problema';
    const rCat = await request('/api/catalogo/categorias', 'POST', { nombre: 'CatVal ' + Date.now(), tipoTicket: tipo });
    if (rCat.status !== 201 && rCat.status !== 409) throw new Error('create categoria failed: ' + JSON.stringify(rCat));
    const categoriaId = rCat.status === 201 ? rCat.body.data.id : (await request('/api/catalogo/categorias?tipo=' + tipo)).body.data[0].id;

    // Intentar crear subcategoria con mismatch de tipo
    const rSub = await request('/api/catalogo/subcategorias', 'POST', { categoriaId, nombre: 'MismatchTest ' + Date.now(), codigo: 'TEST-' + Date.now(), heredaTipo: true, tipoTicket: 'otro' });
    console.log('Mismatch response:', rSub.status, rSub.body);
    if (rSub.status === 400) {
      console.log('Validación OK: servidor rechazó el tipo diferente con 400');
      process.exit(0);
    }
    throw new Error('Se esperaba 400 pero se recibió: ' + JSON.stringify(rSub));
  } catch (e) {
    console.error('Test failed:', e.message || e);
    process.exit(1);
  }
})();