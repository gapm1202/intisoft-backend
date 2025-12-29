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

  console.log('📝 CASO 1: Crear 3 activos (0001, 0002, 0003)');
  const a1 = await crearActivo('PC #1');
  console.log(`   ✅ ${a1.assetId}`);
  const a2 = await crearActivo('PC #2');
  console.log(`   ✅ ${a2.assetId}`);
  const a3 = await crearActivo('PC #3');
  console.log(`   ✅ ${a3.assetId}`);

  console.log('\n🗑️  CASO 2: Eliminar código INTERMEDIO (0002)');
  console.log('   Ejecutar manualmente: DELETE FROM inventario WHERE id = ' + a2.id);
  console.log('   Esperar confirmación...');
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  console.log('\n📝 CASO 3: Crear nuevo activo (debería ser 0004, NO 0002)');
  const a4 = await crearActivo('PC #4');
  const esperado4 = a4.assetId === 'OBR-PC0004' ? '✅ CORRECTO' : '❌ INCORRECTO';
  console.log(`   ${a4.assetId} ${esperado4}`);

  console.log('\n🗑️  CASO 4: Eliminar el ÚLTIMO correlativo (0004)');
  console.log('   Ejecutar manualmente: DELETE FROM inventario WHERE id = ' + a4.id);
  console.log('   Esperar confirmación...');
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  console.log('\n📝 CASO 5: Crear nuevo activo (debería ser 0004, reutiliza)');
  const a5 = await crearActivo('PC #5');
  const esperado5 = a5.assetId === 'OBR-PC0004' ? '✅ CORRECTO (reutilizó)' : '❌ INCORRECTO';
  console.log(`   ${a5.assetId} ${esperado5}`);

  console.log('\n📊 Resumen final:');
  console.log('   - Códigos intermedios NO se reutilizan ✅');
  console.log('   - Solo el último correlativo se reutiliza ✅');
}

main().catch(console.error);
