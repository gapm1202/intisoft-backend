const http = require('http');
const https = require('https');

const BASE_URL = 'http://localhost:5000';
const API_URL = `${BASE_URL}/api`;

// Token de autenticación (generar con gen_jwt.js si es necesario)
let authToken = '';

async function login() {
  try {
    console.log('\n🔑 Iniciando sesión...');
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@intisoft.com',
      password: 'admin123'
    });
    authToken = response.data.token;
    console.log('✅ Sesión iniciada correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error al iniciar sesión:', error.response?.data || error.message);
    return false;
  }
}

const axiosWithAuth = () => axios.create({
  headers: {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  }
});

async function testGetTiposServicio() {
  console.log('\n📋 TEST 1: GET /api/catalogo/servicios/tipos');
  try {
    const response = await axiosWithAuth().get(`${API_URL}/catalogo/servicios/tipos`);
    console.log('✅ Tipos de servicio:', response.data);
    console.log(`   Total: ${response.data.length} tipos`);
    return response.data;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    return null;
  }
}

async function testCreateTipoServicio() {
  console.log('\n➕ TEST 2: POST /api/catalogo/servicios/tipos');
  try {
    const nuevoTipo = {
      nombre: 'Desarrollo',
      descripcion: 'Servicios de desarrollo de software'
    };
    const response = await axiosWithAuth().post(`${API_URL}/catalogo/servicios/tipos`, nuevoTipo);
    console.log('✅ Tipo creado:', response.data);
    return response.data;
  } catch (error) {
    if (error.response?.status === 409) {
      console.log('⚠️  Tipo ya existe (esperado en segunda ejecución)');
      return null;
    }
    console.error('❌ Error:', error.response?.data || error.message);
    return null;
  }
}

async function testGetServicios() {
  console.log('\n📋 TEST 3: GET /api/catalogo/servicios');
  try {
    const response = await axiosWithAuth().get(`${API_URL}/catalogo/servicios`);
    console.log('✅ Servicios obtenidos:', response.data.length);
    response.data.slice(0, 3).forEach(s => {
      console.log(`   - ${s.codigo}: ${s.nombre} (${s.tipoServicio})`);
    });
    return response.data;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    return null;
  }
}

async function testGetServiciosActivos() {
  console.log('\n📋 TEST 4: GET /api/catalogo/servicios?activo=true');
  try {
    const response = await axiosWithAuth().get(`${API_URL}/catalogo/servicios?activo=true`);
    console.log('✅ Servicios activos:', response.data.length);
    return response.data;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    return null;
  }
}

async function testGetServiciosVisiblesEnTickets() {
  console.log('\n📋 TEST 5: GET /api/catalogo/servicios?visibleEnTickets=true');
  try {
    const response = await axiosWithAuth().get(`${API_URL}/catalogo/servicios?visibleEnTickets=true`);
    console.log('✅ Servicios visibles en tickets:', response.data.length);
    return response.data;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    return null;
  }
}

async function testCreateServicio() {
  console.log('\n➕ TEST 6: POST /api/catalogo/servicios');
  try {
    const nuevoServicio = {
      codigo: 'TEST-001',
      nombre: 'Servicio de Prueba',
      descripcion: 'Este es un servicio de prueba creado por el script',
      tipoServicio: 'Infraestructura',
      activo: true,
      visibleEnTickets: true
    };
    const response = await axiosWithAuth().post(`${API_URL}/catalogo/servicios`, nuevoServicio);
    console.log('✅ Servicio creado:', response.data);
    return response.data;
  } catch (error) {
    if (error.response?.status === 409) {
      console.log('⚠️  Servicio ya existe (esperado en segunda ejecución)');
      // Obtener el servicio existente
      const servicios = await axiosWithAuth().get(`${API_URL}/catalogo/servicios`);
      return servicios.data.find(s => s.codigo === 'TEST-001');
    }
    console.error('❌ Error:', error.response?.data || error.message);
    return null;
  }
}

async function testGetServicioById(servicioId) {
  console.log(`\n🔍 TEST 7: GET /api/catalogo/servicios/${servicioId}`);
  try {
    const response = await axiosWithAuth().get(`${API_URL}/catalogo/servicios/${servicioId}`);
    console.log('✅ Servicio obtenido:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    return null;
  }
}

async function testUpdateServicio(servicioId) {
  console.log(`\n✏️  TEST 8: PUT /api/catalogo/servicios/${servicioId}`);
  try {
    const actualizacion = {
      descripcion: 'Descripción actualizada por script de prueba',
      activo: true,
      visibleEnTickets: false
    };
    const response = await axiosWithAuth().put(`${API_URL}/catalogo/servicios/${servicioId}`, actualizacion);
    console.log('✅ Servicio actualizado:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    return null;
  }
}

async function testDesactivarServicio(servicioId) {
  console.log(`\n🔒 TEST 9: PUT /api/catalogo/servicios/${servicioId} (desactivar)`);
  try {
    const actualizacion = {
      activo: false
    };
    const response = await axiosWithAuth().put(`${API_URL}/catalogo/servicios/${servicioId}`, actualizacion);
    console.log('✅ Servicio desactivado:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    return null;
  }
}

async function testGetStats() {
  console.log('\n📊 TEST 10: GET /api/catalogo/servicios/stats');
  try {
    const response = await axiosWithAuth().get(`${API_URL}/catalogo/servicios/stats`);
    console.log('✅ Estadísticas obtenidas:', response.data);
    console.log('   Total:', response.data.total);
    console.log('   Activos:', response.data.activos);
    console.log('   Inactivos:', response.data.inactivos);
    console.log('   Visibles en tickets:', response.data.visiblesEnTickets);
    console.log('   Por tipo:');
    response.data.porTipo.forEach(t => {
      console.log(`     - ${t.tipoServicio}: ${t.count} servicios`);
    });
    return response.data;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    return null;
  }
}

async function testValidacionCodigoUnico() {
  console.log('\n🚫 TEST 11: Validación código único (debe fallar)');
  try {
    const servicioConCodigoExistente = {
      codigo: 'APP-001', // Ya existe en migration 062
      nombre: 'Duplicado',
      tipoServicio: 'Aplicacion'
    };
    await axiosWithAuth().post(`${API_URL}/catalogo/servicios`, servicioConCodigoExistente);
    console.log('❌ ERROR: Debería haber rechazado código duplicado');
  } catch (error) {
    if (error.response?.status === 409) {
      console.log('✅ Validación correcta: Código duplicado rechazado');
      console.log('   Mensaje:', error.response.data.error);
    } else {
      console.error('❌ Error inesperado:', error.response?.data || error.message);
    }
  }
}

async function testValidacionTipoExiste() {
  console.log('\n🚫 TEST 12: Validación tipo existe (debe fallar)');
  try {
    const servicioConTipoInvalido = {
      codigo: 'INV-001',
      nombre: 'Servicio con tipo inválido',
      tipoServicio: 'TipoQueNoExiste'
    };
    await axiosWithAuth().post(`${API_URL}/catalogo/servicios`, servicioConTipoInvalido);
    console.log('❌ ERROR: Debería haber rechazado tipo inexistente');
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ Validación correcta: Tipo inexistente rechazado');
      console.log('   Mensaje:', error.response.data.error);
    } else {
      console.error('❌ Error inesperado:', error.response?.data || error.message);
    }
  }
}

async function runAllTests() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🧪 TESTING MÓDULO CATÁLOGO DE SERVICIOS');
  console.log('═══════════════════════════════════════════════════════');

  // Login
  const loggedIn = await login();
  if (!loggedIn) {
    console.log('\n❌ No se pudo iniciar sesión. Abortando tests.');
    return;
  }

  // Tests
  await testGetTiposServicio();
  await testCreateTipoServicio();
  await testGetServicios();
  await testGetServiciosActivos();
  await testGetServiciosVisiblesEnTickets();
  
  const nuevoServicio = await testCreateServicio();
  if (nuevoServicio) {
    await testGetServicioById(nuevoServicio.id);
    await testUpdateServicio(nuevoServicio.id);
    await testDesactivarServicio(nuevoServicio.id);
  }

  await testGetStats();
  await testValidacionCodigoUnico();
  await testValidacionTipoExiste();

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('✅ TESTS COMPLETADOS');
  console.log('═══════════════════════════════════════════════════════\n');
}

// Ejecutar tests
runAllTests().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
