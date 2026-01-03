// Script de prueba simple para el módulo de Catálogo de Servicios
// Usar con: node scripts/test_servicios_simple.js

const BASE_URL = 'http://localhost:4000';

// Helper para hacer requests HTTP
function makeRequest(method, path, body = null, token = '') {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = require('http').request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: parsed });
        } catch {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

async function runTests() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🧪 TESTING MÓDULO CATÁLOGO DE SERVICIOS');
  console.log('═══════════════════════════════════════════════════════\n');

  let authToken = '';

  // 1. Login
  console.log('🔑 TEST 1: Login');
  try {
    const loginRes = await makeRequest('POST', '/api/auth/login', {
      email: 'admin@intisoft.com',
      password: 'admin123'
    });
    
    if (loginRes.status === 200 && loginRes.data.token) {
      authToken = loginRes.data.token;
      console.log('✅ Login exitoso\n');
    } else {
      console.log('❌ Login falló:', loginRes.data, '\n');
      return;
    }
  } catch (err) {
    console.error('❌ Error en login:', err.message, '\n');
    return;
  }

  // 2. GET Tipos de Servicio
  console.log('📋 TEST 2: GET /api/catalogo/servicios/tipos');
  try {
    const res = await makeRequest('GET', '/api/catalogo/servicios/tipos', null, authToken);
    console.log(`✅ Tipos obtenidos: ${res.data.length}`);
    res.data.slice(0, 3).forEach(t => console.log(`   - ${t.nombre}`));
    console.log();
  } catch (err) {
    console.error('❌ Error:', err.message, '\n');
  }

  // 3. GET Servicios
  console.log('📋 TEST 3: GET /api/catalogo/servicios');
  try {
    const res = await makeRequest('GET', '/api/catalogo/servicios', null, authToken);
    console.log(`✅ Servicios obtenidos: ${res.data.length}`);
    res.data.slice(0, 3).forEach(s => console.log(`   - ${s.codigo}: ${s.nombre}`));
    console.log();
  } catch (err) {
    console.error('❌ Error:', err.message, '\n');
  }

  // 4. GET Servicios Activos
  console.log('📋 TEST 4: GET /api/catalogo/servicios?activo=true');
  try {
    const res = await makeRequest('GET', '/api/catalogo/servicios?activo=true', null, authToken);
    console.log(`✅ Servicios activos: ${res.data.length}\n`);
  } catch (err) {
    console.error('❌ Error:', err.message, '\n');
  }

  // 5. POST Crear Servicio
  console.log('➕ TEST 5: POST /api/catalogo/servicios');
  let servicioCreado = null;
  try {
    const nuevoServicio = {
      codigo: 'TEST-DEMO-' + Date.now(),
      nombre: 'Servicio de Prueba',
      descripcion: 'Creado por script de prueba',
      tipoServicio: 'Infraestructura',
      activo: true,
      visibleEnTickets: true
    };
    
    const res = await makeRequest('POST', '/api/catalogo/servicios', nuevoServicio, authToken);
    
    if (res.status === 201) {
      servicioCreado = res.data;
      console.log('✅ Servicio creado:', res.data.codigo);
      console.log(`   ID: ${res.data.id}\n`);
    } else {
      console.log('⚠️  Respuesta:', res.status, res.data, '\n');
    }
  } catch (err) {
    console.error('❌ Error:', err.message, '\n');
  }

  // 6. GET Servicio by ID
  if (servicioCreado) {
    console.log(`🔍 TEST 6: GET /api/catalogo/servicios/${servicioCreado.id}`);
    try {
      const res = await makeRequest('GET', `/api/catalogo/servicios/${servicioCreado.id}`, null, authToken);
      console.log('✅ Servicio obtenido:', res.data.nombre, '\n');
    } catch (err) {
      console.error('❌ Error:', err.message, '\n');
    }

    // 7. PUT Actualizar Servicio
    console.log(`✏️  TEST 7: PUT /api/catalogo/servicios/${servicioCreado.id}`);
    try {
      const actualizacion = {
        descripcion: 'Descripción actualizada',
        visibleEnTickets: false
      };
      
      const res = await makeRequest('PUT', `/api/catalogo/servicios/${servicioCreado.id}`, actualizacion, authToken);
      console.log('✅ Servicio actualizado');
      console.log(`   visibleEnTickets: ${res.data.visibleEnTickets}\n`);
    } catch (err) {
      console.error('❌ Error:', err.message, '\n');
    }

    // 8. PUT Desactivar Servicio
    console.log(`🔒 TEST 8: PUT /api/catalogo/servicios/${servicioCreado.id} (desactivar)`);
    try {
      const res = await makeRequest('PUT', `/api/catalogo/servicios/${servicioCreado.id}`, { activo: false }, authToken);
      console.log('✅ Servicio desactivado');
      console.log(`   activo: ${res.data.activo}\n`);
    } catch (err) {
      console.error('❌ Error:', err.message, '\n');
    }
  }

  // 9. GET Stats
  console.log('📊 TEST 9: GET /api/catalogo/servicios/stats');
  try {
    const res = await makeRequest('GET', '/api/catalogo/servicios/stats', null, authToken);
    console.log('✅ Estadísticas:');
    console.log(`   Total: ${res.data.total}`);
    console.log(`   Activos: ${res.data.activos}`);
    console.log(`   Inactivos: ${res.data.inactivos}`);
    console.log(`   Visibles en tickets: ${res.data.visiblesEnTickets}`);
    console.log('   Por tipo:');
    res.data.porTipo.slice(0, 3).forEach(t => {
      console.log(`     - ${t.tipoServicio}: ${t.count}`);
    });
    console.log();
  } catch (err) {
    console.error('❌ Error:', err.message, '\n');
  }

  // 10. Validación código único
  console.log('🚫 TEST 10: Validación código único (debe fallar)');
  try {
    const res = await makeRequest('POST', '/api/catalogo/servicios', {
      codigo: 'APP-001', // Ya existe
      nombre: 'Duplicado',
      tipoServicio: 'Aplicacion'
    }, authToken);
    
    if (res.status === 409) {
      console.log('✅ Validación correcta: Código duplicado rechazado');
      console.log(`   Mensaje: ${res.data.error}\n`);
    } else {
      console.log('❌ ERROR: Debería haber rechazado código duplicado\n');
    }
  } catch (err) {
    console.error('❌ Error:', err.message, '\n');
  }

  // 11. Validación tipo existe
  console.log('🚫 TEST 11: Validación tipo existe (debe fallar)');
  try {
    const res = await makeRequest('POST', '/api/catalogo/servicios', {
      codigo: 'INV-' + Date.now(),
      nombre: 'Con tipo inválido',
      tipoServicio: 'TipoQueNoExiste'
    }, authToken);
    
    if (res.status === 400) {
      console.log('✅ Validación correcta: Tipo inexistente rechazado');
      console.log(`   Mensaje: ${res.data.error}\n`);
    } else {
      console.log('❌ ERROR: Debería haber rechazado tipo inexistente\n');
    }
  } catch (err) {
    console.error('❌ Error:', err.message, '\n');
  }

  console.log('═══════════════════════════════════════════════════════');
  console.log('✅ TESTS COMPLETADOS');
  console.log('═══════════════════════════════════════════════════════\n');
}

runTests().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
