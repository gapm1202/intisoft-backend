const https = require('https');

const BASE_URL = 'http://localhost:4000/api';
let token = '';

function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}${path}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = require('http').request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode >= 400) {
            reject(parsed);
          } else {
            resolve(parsed);
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function login() {
  console.log('🔐 Login...');
  const response = await makeRequest('POST', '/auth/login', {
    email: 'admin@intisoft.com',
    password: 'admin123'
  });
  token = response.token;
  console.log('✅ Token obtenido\n');
}

async function crearActivo(sedeId, categoria, descripcion) {
  try {
    const response = await makeRequest(
      'POST',
      `/empresas/72/sedes/${sedeId}/inventario`,
      {
        categoria,
        descripcion,
        modelo: 'Test',
        marca: 'Test',
        condicionActual: 'nuevo',
        garantia: false
      },
      { Authorization: `Bearer ${token}` }
    );
    const activo = response.data || response;
    console.log(`✅ Activo creado: ${activo.assetId || 'N/A'} - ${descripcion}`);
    return activo;
  } catch (error) {
    console.error('❌ Error creando activo:', error);
    throw error;
  }
}

async function eliminarActivo(activoId) {
  try {
    await makeRequest(
      'DELETE',
      `/empresas/72/inventario/${activoId}`,
      null,
      { Authorization: `Bearer ${token}` }
    );
    console.log(`🗑️  Activo ${activoId} eliminado\n`);
  } catch (error) {
    console.error('❌ Error eliminando:', error);
  }
}

async function main() {
  await login();

  console.log('📝 Creando 3 activos PC...\n');
  const activo1 = await crearActivo(30, 'PC', 'PC #1');
  const activo2 = await crearActivo(30, 'PC', 'PC #2');
  const activo3 = await crearActivo(30, 'PC', 'PC #3');

  console.log('\n🗑️  Eliminando el activo #2 (OBR-PC0002)...\n');
  await eliminarActivo(activo2.id);

  console.log('📝 Creando un nuevo activo PC...');
  console.log('❓ ¿Debería generarse OBR-PC0002? (reutilizar hueco)\n');
  const activo4 = await crearActivo(30, 'PC', 'PC #4 - Debería ser 0002');

  console.log('\n📊 Resumen:');
  console.log(`   Activo #1: ${activo1.assetId || activo1.asset_id || 'N/A'}`);
  console.log(`   Activo #2: ${activo2.assetId || activo2.asset_id || 'N/A'} ❌ Eliminado`);
  console.log(`   Activo #3: ${activo3.assetId || activo3.asset_id || 'N/A'}`);
  const codigo4 = activo4.assetId || activo4.asset_id || '';
  console.log(`   Activo #4: ${codigo4} ${codigo4.includes('0002') ? '✅ Reutilizó el hueco' : '❌ No reutilizó'}`);
}

main().catch(console.error);
