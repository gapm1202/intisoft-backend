/**
 * Script de prueba para endpoints M:N Usuarios ↔ Activos
 * 
 * Ejecutar: node scripts/test_m2n_endpoints.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
let TOKEN = '';

// Configurar estos valores según tu base de datos
const TEST_CONFIG = {
  empresaId: '1',     // ID de empresa existente
  usuarioId1: '13',   // ID de usuario existente
  usuarioId2: '14',   // ID de otro usuario existente
  activoId1: '1',     // ID de activo existente
  activoId2: '2',     // ID de otro activo existente
};

// Función auxiliar para hacer requests autenticadas
async function request(method, url, data = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {},
      data,
    };
    
    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status
    };
  }
}

// Obtener token de autenticación
async function authenticate() {
  console.log('\n🔐 1. Autenticando...');
  
  const result = await request('POST', '/auth/login', {
    email: 'admin@inticorp.com',
    password: 'admin123'
  });
  
  if (result.success) {
    TOKEN = result.data.token;
    console.log('✅ Autenticado correctamente');
    return true;
  } else {
    console.error('❌ Error en autenticación:', result.error);
    return false;
  }
}

// TEST 1: Asignar múltiples usuarios a un activo
async function testAsignarUsuariosAActivo() {
  console.log('\n📝 2. TEST: Asignar usuarios a activo');
  console.log(`   Asignando usuarios [${TEST_CONFIG.usuarioId1}, ${TEST_CONFIG.usuarioId2}] al activo ${TEST_CONFIG.activoId1}`);
  
  const result = await request('POST', `/inventario/${TEST_CONFIG.activoId1}/usuarios`, {
    usuarioIds: [TEST_CONFIG.usuarioId1, TEST_CONFIG.usuarioId2],
    motivo: 'Prueba M:N - usuarios compartiendo activo',
    asignadoPor: 'Admin Test'
  });
  
  if (result.success) {
    console.log('✅ Usuarios asignados correctamente');
    console.log('   Asignaciones:', result.data.asignaciones?.length || 0);
    if (result.data.errores && result.data.errores.length > 0) {
      console.log('   ⚠️  Errores parciales:', result.data.errores);
    }
  } else {
    console.log('❌ Error:', result.error);
  }
  
  return result.success;
}

// TEST 2: Obtener usuarios de un activo
async function testObtenerUsuariosDeActivo() {
  console.log('\n📋 3. TEST: Obtener usuarios de activo');
  console.log(`   Obteniendo usuarios del activo ${TEST_CONFIG.activoId1}`);
  
  const result = await request('GET', `/inventario/${TEST_CONFIG.activoId1}/usuarios`);
  
  if (result.success) {
    console.log('✅ Usuarios obtenidos correctamente');
    console.log(`   Total usuarios: ${result.data.totalUsuarios}`);
    result.data.usuarios?.forEach((u, i) => {
      console.log(`   ${i + 1}. ${u.nombreCompleto} (${u.correo}) - Asignado: ${new Date(u.fechaAsignacion).toLocaleString()}`);
    });
  } else {
    console.log('❌ Error:', result.error);
  }
  
  return result.success;
}

// TEST 3: Asignar múltiples activos a un usuario
async function testAsignarActivosAUsuario() {
  console.log('\n📦 4. TEST: Asignar activos a usuario');
  console.log(`   Asignando activos [${TEST_CONFIG.activoId1}, ${TEST_CONFIG.activoId2}] al usuario ${TEST_CONFIG.usuarioId1}`);
  
  const result = await request('POST', `/usuarios/${TEST_CONFIG.usuarioId1}/activos`, {
    activoIds: [TEST_CONFIG.activoId1, TEST_CONFIG.activoId2],
    motivo: 'Prueba M:N - setup completo',
    asignadoPor: 'Admin Test'
  });
  
  if (result.success) {
    console.log('✅ Activos asignados correctamente');
    console.log('   Asignaciones:', result.data.asignaciones?.length || 0);
    if (result.data.errores && result.data.errores.length > 0) {
      console.log('   ⚠️  Errores parciales:', result.data.errores);
    }
  } else {
    console.log('❌ Error:', result.error);
  }
  
  return result.success;
}

// TEST 4: Obtener activos de un usuario
async function testObtenerActivosDeUsuario() {
  console.log('\n🔍 5. TEST: Obtener activos de usuario');
  console.log(`   Obteniendo activos del usuario ${TEST_CONFIG.usuarioId1}`);
  
  const result = await request('GET', `/usuarios/${TEST_CONFIG.usuarioId1}/activos`);
  
  if (result.success) {
    console.log('✅ Activos obtenidos correctamente');
    console.log(`   Total activos: ${result.data.totalActivos}`);
    result.data.activos?.forEach((a, i) => {
      console.log(`   ${i + 1}. ${a.assetId} - ${a.nombre || a.categoria} - Asignado: ${new Date(a.fechaAsignacion).toLocaleString()}`);
    });
  } else {
    console.log('❌ Error:', result.error);
  }
  
  return result.success;
}

// TEST 5: Verificar formato dual en GET inventario (compatibilidad)
async function testFormatoDualInventario() {
  console.log('\n🔄 6. TEST: Formato dual en GET inventario (compatibilidad)');
  console.log(`   Obteniendo activo ${TEST_CONFIG.activoId1} - debe tener AMBOS formatos`);
  
  const result = await request('GET', `/empresas/${TEST_CONFIG.empresaId}/inventario`);
  
  if (result.success) {
    const activo = result.data.activos?.find(a => a.id === parseInt(TEST_CONFIG.activoId1));
    
    if (activo) {
      console.log('✅ Activo encontrado');
      console.log('   📊 Campos Legacy (compatibilidad):');
      console.log(`      - usuarioAsignadoId: ${activo.usuarioAsignadoId || 'null'}`);
      console.log(`      - usuarioAsignadoData: ${activo.usuarioAsignadoData ? activo.usuarioAsignadoData.nombreCompleto : 'null'}`);
      
      console.log('   📊 Campos M:N (nuevos):');
      console.log(`      - usuariosAsignados: Array[${activo.usuariosAsignados?.length || 0}]`);
      console.log(`      - cantidadUsuariosAsignados: ${activo.cantidadUsuariosAsignados || 0}`);
      
      if (activo.usuariosAsignados && activo.usuariosAsignados.length > 0) {
        activo.usuariosAsignados.forEach((u, i) => {
          console.log(`         ${i + 1}. ${u.nombreCompleto} (${u.cargo})`);
        });
      }
    } else {
      console.log('⚠️  Activo no encontrado en respuesta');
    }
  } else {
    console.log('❌ Error:', result.error);
  }
  
  return result.success;
}

// TEST 6: Verificar formato dual en GET usuarios (compatibilidad)
async function testFormatoDualUsuarios() {
  console.log('\n🔄 7. TEST: Formato dual en GET usuarios (compatibilidad)');
  console.log(`   Obteniendo usuario ${TEST_CONFIG.usuarioId1} - debe tener AMBOS formatos`);
  
  const result = await request('GET', `/empresas/${TEST_CONFIG.empresaId}/usuarios`);
  
  if (result.success) {
    const usuario = result.data.usuarios?.find(u => u.id === parseInt(TEST_CONFIG.usuarioId1));
    
    if (usuario) {
      console.log('✅ Usuario encontrado');
      console.log('   📊 Campos Legacy (compatibilidad):');
      console.log(`      - activoAsignadoId: ${usuario.activoAsignadoId || 'null'}`);
      console.log(`      - activoCodigo: ${usuario.activoCodigo || 'null'}`);
      
      console.log('   📊 Campos M:N (nuevos):');
      console.log(`      - activosAsignados: Array[${usuario.activosAsignados?.length || 0}]`);
      console.log(`      - cantidadActivosAsignados: ${usuario.cantidadActivosAsignados || 0}`);
      
      if (usuario.activosAsignados && usuario.activosAsignados.length > 0) {
        usuario.activosAsignados.forEach((a, i) => {
          console.log(`         ${i + 1}. ${a.assetId} - ${a.nombre || a.categoria}`);
        });
      }
    } else {
      console.log('⚠️  Usuario no encontrado en respuesta');
    }
  } else {
    console.log('❌ Error:', result.error);
  }
  
  return result.success;
}

// TEST 7: Desasignar usuario de activo
async function testDesasignarUsuarioDeActivo() {
  console.log('\n🗑️  8. TEST: Desasignar usuario de activo');
  console.log(`   Desasignando usuario ${TEST_CONFIG.usuarioId2} del activo ${TEST_CONFIG.activoId1}`);
  
  const result = await request('DELETE', `/inventario/${TEST_CONFIG.activoId1}/usuarios/${TEST_CONFIG.usuarioId2}`, {
    motivo: 'Prueba M:N - desasignación'
  });
  
  if (result.success) {
    console.log('✅ Usuario desasignado correctamente');
  } else {
    console.log('❌ Error:', result.error);
  }
  
  return result.success;
}

// Ejecutar todos los tests
async function runAllTests() {
  console.log('═══════════════════════════════════════════════');
  console.log('🧪 TESTS M:N - USUARIOS ↔ ACTIVOS');
  console.log('═══════════════════════════════════════════════');
  
  const authenticated = await authenticate();
  if (!authenticated) {
    console.log('\n❌ No se pudo autenticar. Abortando tests.');
    return;
  }
  
  const results = {
    asignarUsuarios: await testAsignarUsuariosAActivo(),
    obtenerUsuarios: await testObtenerUsuariosDeActivo(),
    asignarActivos: await testAsignarActivosAUsuario(),
    obtenerActivos: await testObtenerActivosDeUsuario(),
    formatoDualInventario: await testFormatoDualInventario(),
    formatoDualUsuarios: await testFormatoDualUsuarios(),
    desasignar: await testDesasignarUsuarioDeActivo(),
  };
  
  console.log('\n═══════════════════════════════════════════════');
  console.log('📊 RESUMEN DE TESTS');
  console.log('═══════════════════════════════════════════════');
  
  const total = Object.keys(results).length;
  const passed = Object.values(results).filter(r => r).length;
  const failed = total - passed;
  
  console.log(`Total: ${total}`);
  console.log(`✅ Exitosos: ${passed}`);
  console.log(`❌ Fallidos: ${failed}`);
  console.log(`Porcentaje: ${Math.round((passed / total) * 100)}%`);
  
  console.log('\n═══════════════════════════════════════════════');
}

// Ejecutar
runAllTests().catch(error => {
  console.error('\n❌ Error fatal:', error);
  process.exit(1);
});
