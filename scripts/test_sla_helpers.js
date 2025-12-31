// Script de prueba para endpoints de ayuda de SLA
const http = require('http');

console.log('='.repeat(60));
console.log('PRUEBA DE ENDPOINTS DE AYUDA SLA');
console.log('='.repeat(60));
console.log('');

// Test 1: Obtener valores por defecto de "incidentes"
function testDefaults() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: '/api/sla/defaults/incidentes',
      method: 'GET',
    };

    console.log('📋 TEST 1: GET /api/sla/defaults/incidentes');
    console.log('-'.repeat(60));

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          const json = JSON.parse(data);
          console.log('✅ Status:', res.statusCode);
          console.log('');
          console.log('Valores por defecto para "incidentes":');
          console.log(JSON.stringify(json.defaults, null, 2));
          console.log('');
          console.log('Payload de ejemplo para guardar:');
          console.log(JSON.stringify(json.ejemplo, null, 2));
          console.log('');
        } else {
          console.log('❌ Status:', res.statusCode);
          console.log(data);
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      console.error('❌ Error:', error.message);
      reject(error);
    });

    req.end();
  });
}

// Test 2: Obtener schema de "incidentes"
function testSchema() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: '/api/sla/schema/incidentes',
      method: 'GET',
    };

    console.log('📐 TEST 2: GET /api/sla/schema/incidentes');
    console.log('-'.repeat(60));

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          const json = JSON.parse(data);
          console.log('✅ Status:', res.statusCode);
          console.log('');
          console.log('Descripción:', json.descripcion);
          console.log('');
          console.log('Estructura esperada:');
          console.log(JSON.stringify(json.estructura, null, 2));
          console.log('');
          console.log('Ejemplo mínimo:');
          console.log(JSON.stringify(json.ejemploMinimo, null, 2));
          console.log('');
        } else {
          console.log('❌ Status:', res.statusCode);
          console.log(data);
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      console.error('❌ Error:', error.message);
      reject(error);
    });

    req.end();
  });
}

// Ejecutar tests
async function runTests() {
  try {
    await testDefaults();
    console.log('='.repeat(60));
    console.log('');
    await testSchema();
    console.log('='.repeat(60));
    console.log('');
    console.log('✅ Todos los tests completados');
    console.log('');
    console.log('💡 INSTRUCCIONES PARA EL FRONTEND:');
    console.log('');
    console.log('1. Use GET /api/sla/defaults/incidentes para obtener valores iniciales');
    console.log('2. Inicialice el formulario con esos valores');
    console.log('3. Asegúrese de incluir SIEMPRE el objeto "tipos" con las 5 propiedades');
    console.log('4. Envíe el payload completo a POST /api/sla/seccion/:empresaId');
    console.log('');
  } catch (error) {
    console.error('Error ejecutando tests:', error);
  }
}

runTests();
