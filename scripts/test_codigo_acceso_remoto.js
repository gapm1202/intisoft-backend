const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api';

// Configuración
const TEST_EMPRESA_ID = 1;
const TEST_SEDE_ID = 1;

async function getToken() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@test.com',
      password: 'admin123'
    });
    return response.data.token;
  } catch (error) {
    console.error('❌ Error obteniendo token:', error.response?.data || error.message);
    throw error;
  }
}

async function testCodigoAccesoRemoto() {
  console.log('🧪 Test: Campo codigoAccesoRemoto en inventario\n');

  try {
    // 1. Obtener token
    console.log('1️⃣ Obteniendo token de autenticación...');
    const token = await getToken();
    console.log('✅ Token obtenido\n');

    // 2. Crear activo con codigoAccesoRemoto
    console.log('2️⃣ Creando activo con codigoAccesoRemoto...');
    const payload = {
      empresaId: TEST_EMPRESA_ID,
      sedeId: TEST_SEDE_ID,
      categoria: 'Computadora',
      area: 'IT',
      fabricante: 'HP',
      modelo: 'EliteBook',
      serie: 'TEST123',
      estadoActivo: 'Activo',
      estadoOperativo: 'Operativo',
      codigoAccesoRemoto: '123456789',
      observaciones: 'Test de campo codigoAccesoRemoto'
    };

    console.log('📤 Payload enviado:');
    console.log(JSON.stringify(payload, null, 2));

    const createResponse = await axios.post(
      `${BASE_URL}/empresas/${TEST_EMPRESA_ID}/sedes/${TEST_SEDE_ID}/inventario`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const createdActivo = createResponse.data.data;
    console.log('\n✅ Activo creado correctamente');
    console.log(`📝 ID: ${createdActivo.id}`);
    console.log(`📝 AssetId: ${createdActivo.assetId}`);
    console.log(`📝 codigoAccesoRemoto guardado: "${createdActivo.codigoAccesoRemoto}"`);

    // 3. Verificar el valor guardado
    console.log('\n3️⃣ Verificando valor guardado en BD...');
    
    if (createdActivo.codigoAccesoRemoto === '123456789') {
      console.log('✅ ¡ÉXITO! El campo se guardó correctamente como string: "123456789"');
    } else if (createdActivo.codigoAccesoRemoto === null || createdActivo.codigoAccesoRemoto === '[null]') {
      console.log('❌ ERROR: El campo se guardó como null o [null]');
      console.log(`   Valor actual: ${JSON.stringify(createdActivo.codigoAccesoRemoto)}`);
    } else {
      console.log(`⚠️ ADVERTENCIA: Valor inesperado: ${JSON.stringify(createdActivo.codigoAccesoRemoto)}`);
    }

    // 4. Obtener el activo y verificar nuevamente
    console.log('\n4️⃣ Re-obteniendo activo por ID para doble verificación...');
    const getResponse = await axios.get(
      `${BASE_URL}/empresas/${TEST_EMPRESA_ID}/inventario/${createdActivo.id}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    const fetchedActivo = getResponse.data.data;
    console.log(`📝 codigoAccesoRemoto al re-obtener: "${fetchedActivo.codigoAccesoRemoto}"`);

    if (fetchedActivo.codigoAccesoRemoto === '123456789') {
      console.log('✅ Verificación exitosa: El campo se persiste correctamente');
    } else {
      console.log('❌ ERROR en verificación: El valor no coincide');
      console.log(`   Esperado: "123456789"`);
      console.log(`   Obtenido: ${JSON.stringify(fetchedActivo.codigoAccesoRemoto)}`);
    }

    // 5. Probar actualización del campo
    console.log('\n5️⃣ Probando actualización del campo...');
    const updatePayload = {
      codigoAccesoRemoto: '987654321'
    };

    const updateResponse = await axios.put(
      `${BASE_URL}/empresas/${TEST_EMPRESA_ID}/sedes/${TEST_SEDE_ID}/inventario/${createdActivo.id}`,
      updatePayload,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const updatedActivo = updateResponse.data.data;
    console.log(`📝 codigoAccesoRemoto actualizado: "${updatedActivo.codigoAccesoRemoto}"`);

    if (updatedActivo.codigoAccesoRemoto === '987654321') {
      console.log('✅ ¡ÉXITO! La actualización funciona correctamente');
    } else {
      console.log('❌ ERROR: La actualización no funcionó correctamente');
      console.log(`   Esperado: "987654321"`);
      console.log(`   Obtenido: ${JSON.stringify(updatedActivo.codigoAccesoRemoto)}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 Test completado');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Error en el test:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

testCodigoAccesoRemoto();
