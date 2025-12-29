const http = require('http');

let token = '';

function login() {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ email: 'admin@intisoft.com', password: 'admin123' });
    const req = http.request({
      hostname: 'localhost',
      port: 4000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': data.length }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        token = JSON.parse(body).token;
        resolve();
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function crearActivo(descripcion) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      categoria: 'PC',
      descripcion,
      modelo: 'Test',
      marca: 'Test',
      condicionActual: 'nuevo',
      garantia: false
    });
    const req = http.request({
      hostname: 'localhost',
      port: 4000,
      path: '/api/empresas/72/sedes/30/inventario',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'Authorization': `Bearer ${token}`
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        const response = JSON.parse(body);
        if (response.ok) {
          resolve(response.data);
        } else {
          reject(new Error(response.message));
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('🔐 Login...');
  await login();
  console.log('✅ Autenticado\n');

  console.log('📝 Creando 5 activos PC...');
  const a1 = await crearActivo('PC #1');
  console.log(`   ✅ ${a1.assetId}`);
  const a2 = await crearActivo('PC #2');
  console.log(`   ✅ ${a2.assetId}`);
  const a3 = await crearActivo('PC #3');
  console.log(`   ✅ ${a3.assetId}`);
  const a4 = await crearActivo('PC #4');
  console.log(`   ✅ ${a4.assetId}`);
  const a5 = await crearActivo('PC #5');
  console.log(`   ✅ ${a5.assetId}`);

  console.log('\n🗑️  Simular eliminación manual del #2 y #4 desde la base de datos');
  console.log('   (Ejecutar: DELETE FROM inventario WHERE id IN (...))');
  console.log('\n📝 Luego crear 2 activos más y verificar que se reutilizan los códigos 0002 y 0004');
}

main().catch(console.error);
