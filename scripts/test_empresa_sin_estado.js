/**
 * Test para verificar que estado_contrato fue eliminado de empresas
 * y que ahora viene desde el contrato activo
 */

const http = require('http');

const API_BASE = 'http://localhost:4000/api';
let authToken = '';
let empresaId = null;
let contractId = null;

// ========== HTTP Helper ==========
function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// ========== Tests ==========
async function login() {
  console.log('\n📋 TEST 1: Login');
  const res = await request('POST', '/auth/login', {
    email: 'admin@intisoft.com',
    password: 'Admin@2025',
  });
  if (res.status === 200 && res.data.token) {
    authToken = res.data.token;
    console.log('✅ Login exitoso');
    return true;
  }
  console.log('❌ Login falló:', res.status, res.data);
  return false;
}

async function createEmpresa() {
  console.log('\n📋 TEST 2: Crear empresa (NO debe incluir estado_contrato)');
  const timestamp = Date.now();
  const res = await request('POST', '/empresas', {
    nombre: `Test Sin Estado ${timestamp}`,
    ruc: `${timestamp}`,
    ciudad: 'Quito',
    provincia: 'Pichincha',
  }, authToken);

  if (res.status === 201 && res.data) {
    empresaId = res.data.id;
    console.log(`✅ Empresa creada con ID: ${empresaId}`);
    
    if (res.data.estadoContrato === undefined) {
      console.log('✅ CORRECTO: empresas NO tiene campo estadoContrato');
      return true;
    } else {
      console.log(`❌ ERROR: empresas todavía tiene estadoContrato = ${res.data.estadoContrato}`);
      return false;
    }
  }
  console.log('❌ Error al crear empresa:', res.status, res.data);
  return false;
}

async function getEmpresaSinContrato() {
  console.log('\n📋 TEST 3: GET empresa sin contrato (debe incluir contrato = null)');
  
  const res = await request('GET', `/empresas/${empresaId}`, null, authToken);
  
  if (res.status === 200 && res.data) {
    console.log(`✅ Empresa obtenida con ID: ${res.data.id}`);
    console.log(`   nombre: ${res.data.nombre}`);
    console.log(`   contrato:`, res.data.contrato);
    
    if (res.data.estadoContrato === undefined && res.data.contrato === null) {
      console.log('✅ CORRECTO: Sin campo estadoContrato, contrato = null');
      return true;
    } else if (res.data.estadoContrato !== undefined) {
      console.log(`❌ ERROR: Todavía existe estadoContrato en empresa`);
      return false;
    } else if (res.data.contrato !== null) {
      console.log(`❌ ERROR: contrato debería ser null`);
      return false;
    }
  }
  console.log('❌ Error al obtener empresa:', res.status);
  return false;
}

async function createContrato() {
  console.log('\n📋 TEST 4: Crear contrato activo');
  
  const fechaInicio = new Date();
  fechaInicio.setDate(fechaInicio.getDate() - 30);
  const fechaFin = new Date();
  fechaFin.setDate(fechaFin.getDate() + 60);

  const res = await request('POST', `/contracts/${empresaId}`, {
    tipoContrato: 'servicios',
    fechaInicio: fechaInicio.toISOString().split('T')[0],
    fechaFin: fechaFin.toISOString().split('T')[0],
    renovacionAutomatica: false,
    responsableComercial: 'Test User',
  }, authToken);

  if (res.status === 201 && res.data) {
    contractId = res.data.id;
    console.log(`✅ Contrato creado con ID: ${contractId}`);
    console.log(`   estadoContrato: ${res.data.estadoContrato}`);
    
    if (res.data.estadoContrato === 'activo') {
      console.log('✅ CORRECTO: contrato tiene estado_contrato = "activo"');
      return true;
    } else {
      console.log(`❌ ERROR: estadoContrato debería ser "activo", es "${res.data.estadoContrato}"`);
      return false;
    }
  }
  console.log('❌ Error al crear contrato:', res.status, res.data);
  return false;
}

async function getEmpresaConContrato() {
  console.log('\n📋 TEST 5: GET empresa con contrato (debe incluir objeto contrato)');
  
  const res = await request('GET', `/empresas/${empresaId}`, null, authToken);
  
  if (res.status === 200 && res.data) {
    console.log(`✅ Empresa obtenida con ID: ${res.data.id}`);
    console.log(`   nombre: ${res.data.nombre}`);
    console.log(`   contrato:`, res.data.contrato ? `{ id: ${res.data.contrato.id}, estado: ${res.data.contrato.estadoContrato} }` : 'null');
    
    if (res.data.estadoContrato === undefined) {
      console.log('✅ CORRECTO: Empresa NO tiene campo estadoContrato');
    } else {
      console.log(`❌ ERROR: Empresa todavía tiene estadoContrato = ${res.data.estadoContrato}`);
      return false;
    }
    
    if (res.data.contrato && res.data.contrato.estadoContrato === 'activo') {
      console.log('✅ CORRECTO: contrato.estadoContrato = "activo"');
      return true;
    } else if (!res.data.contrato) {
      console.log('❌ ERROR: contrato debería estar presente');
      return false;
    } else {
      console.log(`❌ ERROR: contrato.estadoContrato debería ser "activo", es "${res.data.contrato.estadoContrato}"`);
      return false;
    }
  }
  console.log('❌ Error al obtener empresa:', res.status);
  return false;
}

async function runTests() {
  console.log('🚀 Iniciando tests - estado_contrato eliminado de empresas');
  console.log('===========================================================');

  try {
    if (!await login()) {
      console.log('❌ Login falló, abortando tests');
      return;
    }
    if (!await createEmpresa()) {
      console.log('❌ createEmpresa falló, abortando tests');
      return;
    }
    if (!await getEmpresaSinContrato()) {
      console.log('❌ getEmpresaSinContrato falló, abortando tests');
      return;
    }
    if (!await createContrato()) {
      console.log('❌ createContrato falló, abortando tests');
      return;
    }
    if (!await getEmpresaConContrato()) {
      console.log('❌ getEmpresaConContrato falló, abortando tests');
      return;
    }

    console.log('\n===========================================================');
    console.log('✅ TODOS LOS TESTS PASARON');
    console.log('===========================================================\n');
    console.log('📝 Resumen de la corrección:');
    console.log('   1. ✅ Columna estado_contrato eliminada de tabla empresas');
    console.log('   2. ✅ Empresas NO incluyen campo estadoContrato');
    console.log('   3. ✅ GET /api/empresas/:id incluye objeto "contrato"');
    console.log('   4. ✅ contrato.estadoContrato muestra el estado del contrato activo');
    console.log('   5. ✅ contrato = null cuando no hay contrato activo');
    console.log('\n💡 Estructura de respuesta del frontend:');
    console.log('   {');
    console.log('     "_id": "85",');
    console.log('     "nombre": "Empresa Test",');
    console.log('     "contrato": {');
    console.log('       "estadoContrato": "activo",');
    console.log('       "fechaInicio": "2024-12-01",');
    console.log('       "fechaFin": "2025-02-28",');
    console.log('       ...');
    console.log('     }');
    console.log('   }');
    
  } catch (error) {
    console.error('\n❌ Error durante tests:', error);
    console.error('Stack:', error.stack);
  }
}

runTests();
