/**
 * Test para verificar que estado_contrato se maneja correctamente:
 * 1. Al crear empresa -> estado_contrato debe ser null
 * 2. Al crear contrato -> estado_contrato se calcula según fechas
 * 3. Se actualiza en tabla empresas
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
  console.log('\n📋 TEST 2: Crear empresa SIN estado_contrato');
  const timestamp = Date.now();
  const res = await request('POST', '/empresas', {
    nombre: `Test Estado Contrato ${timestamp}`,
    ruc: `1234567890${timestamp % 1000}`,
    ciudad: 'Quito',
    provincia: 'Pichincha',
  }, authToken);

  if (res.status === 201 && res.data) {
    empresaId = res.data.id;
    console.log(`✅ Empresa creada con ID: ${empresaId}`);
    console.log(`   estado_contrato = ${res.data.estadoContrato === null ? 'null' : res.data.estadoContrato}`);
    
    if (res.data.estadoContrato === null) {
      console.log('✅ CORRECTO: estado_contrato es null al crear empresa');
      return true;
    } else {
      console.log(`❌ ERROR: estado_contrato debería ser null, pero es "${res.data.estadoContrato}"`);
      return false;
    }
  }
  console.log('❌ Error al crear empresa:', res.status, res.data);
  return false;
}

async function createContractActivo() {
  console.log('\n📋 TEST 3: Crear contrato con fechas ACTIVAS');
  
  // Fechas: inicio = hace 30 días, fin = en 60 días (ACTIVO)
  const fechaInicio = new Date();
  fechaInicio.setDate(fechaInicio.getDate() - 30);
  const fechaFin = new Date();
  fechaFin.setDate(fechaFin.getDate() + 60);

  const res = await request('POST', `/contracts/${empresaId}`, {
    tipoContrato: 'mensual',
    fechaInicio: fechaInicio.toISOString().split('T')[0],
    fechaFin: fechaFin.toISOString().split('T')[0],
    renovacionAutomatica: false,
    responsableComercial: 'Test User',
  }, authToken);

  if (res.status === 201 && res.data) {
    contractId = res.data.id;
    console.log(`✅ Contrato creado con ID: ${contractId}`);
    console.log(`   estado_contrato del contrato = ${res.data.estadoContrato}`);
    
    if (res.data.estadoContrato === 'activo') {
      console.log('✅ CORRECTO: estado_contrato calculado como "activo"');
    } else {
      console.log(`❌ ERROR: estado_contrato debería ser "activo", pero es "${res.data.estadoContrato}"`);
      return false;
    }

    // Verificar que se actualizó en la tabla empresas
    const empresaRes = await request('GET', `/empresas/${empresaId}`, null, authToken);
    if (empresaRes.status === 200 && empresaRes.data) {
      console.log(`   estado_contrato de la empresa = ${empresaRes.data.estadoContrato}`);
      
      if (empresaRes.data.estadoContrato === 'activo') {
        console.log('✅ CORRECTO: estado_contrato actualizado en tabla empresas');
        return true;
      } else {
        console.log(`❌ ERROR: estado_contrato en empresas debería ser "activo", pero es "${empresaRes.data.estadoContrato}"`);
        return false;
      }
    }
    console.log('❌ Error al verificar empresa:', empresaRes.status);
    return false;
  }
  console.log('❌ Error al crear contrato:', res.status, res.data);
  return false;
}

async function testContratoVencido() {
  console.log('\n📋 TEST 4: Crear empresa y contrato VENCIDO');
  
  // Crear nueva empresa
  const timestamp = Date.now();
  const empresaRes = await request('POST', '/empresas', {
    nombre: `Test Vencido ${timestamp}`,
    ruc: `9876543210${timestamp % 1000}`,
  }, authToken);

  if (empresaRes.status !== 201) {
    console.log('❌ Error al crear empresa para test vencido');
    return false;
  }

  const empresaId2 = empresaRes.data.id;
  console.log(`✅ Empresa creada con ID: ${empresaId2}`);

  // Crear contrato vencido (fechaFin hace 10 días)
  const fechaInicio = new Date();
  fechaInicio.setDate(fechaInicio.getDate() - 100);
  const fechaFin = new Date();
  fechaFin.setDate(fechaFin.getDate() - 10);

  const contratoRes = await request('POST', `/contracts/${empresaId2}`, {
    tipoContrato: 'mensual',
    fechaInicio: fechaInicio.toISOString().split('T')[0],
    fechaFin: fechaFin.toISOString().split('T')[0],
    renovacionAutomatica: false,
  }, authToken);

  if (contratoRes.status === 201 && contratoRes.data) {
    console.log(`✅ Contrato creado con ID: ${contratoRes.data.id}`);
    console.log(`   estado_contrato del contrato = ${contratoRes.data.estadoContrato}`);
    
    if (contratoRes.data.estadoContrato === 'vencido') {
      console.log('✅ CORRECTO: estado_contrato calculado como "vencido"');
      
      // Verificar tabla empresas
      const empresaCheck = await request('GET', `/empresas/${empresaId2}`, null, authToken);
      if (empresaCheck.data.estadoContrato === 'vencido') {
        console.log('✅ CORRECTO: estado_contrato "vencido" actualizado en tabla empresas');
        return true;
      } else {
        console.log(`❌ ERROR: estado en empresas es "${empresaCheck.data.estadoContrato}", esperado "vencido"`);
        return false;
      }
    } else {
      console.log(`❌ ERROR: estado_contrato debería ser "vencido", pero es "${contratoRes.data.estadoContrato}"`);
      return false;
    }
  }
  console.log('❌ Error al crear contrato vencido:', contratoRes.status);
  return false;
}

async function runTests() {
  console.log('🚀 Iniciando tests de estado_contrato');
  console.log('==========================================');

  try {
    if (!await login()) {
      console.log('❌ Login falló, abortando tests');
      return;
    }
    if (!await createEmpresa()) {
      console.log('❌ createEmpresa falló, abortando tests');
      return;
    }
    if (!await createContractActivo()) {
      console.log('❌ createContractActivo falló, abortando tests');
      return;
    }
    if (!await testContratoVencido()) {
      console.log('❌ testContratoVencido falló, abortando tests');
      return;
    }

    console.log('\n==========================================');
    console.log('✅ TODOS LOS TESTS PASARON');
    console.log('==========================================\n');
    console.log('📝 Resumen de la corrección:');
    console.log('   1. ✅ Empresas nuevas tienen estado_contrato = null');
    console.log('   2. ✅ estado_contrato se calcula según fechas al crear contrato');
    console.log('   3. ✅ estado_contrato se actualiza en tabla empresas');
    console.log('   4. ✅ Lógica: fechaFin < hoy → vencido, fechaInicio <= hoy <= fechaFin → activo');
    
  } catch (error) {
    console.error('\n❌ Error durante tests:', error);
    console.error('Stack:', error.stack);
  }
}

runTests();
