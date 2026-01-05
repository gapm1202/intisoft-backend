const axios = require('axios');
const fs = require('fs');

const BASE_URL = 'http://localhost:4000/api';

// Leer el token actual
let token;
try {
  const rawToken = fs.readFileSync('./current_token.txt', 'utf-8');
  // Limpiar el token de caracteres especiales y newlines
  token = rawToken.replace(/[\r\n\x00-\x1F\x7F-\x9F]/g, '').trim();
  console.log('✅ Token cargado y limpiado');
  console.log('Token (primeros 50 chars):', token.substring(0, 50) + '...');
} catch (error) {
  console.error('❌ Error leyendo token. Asegúrate de tener current_token.txt');
  process.exit(1);
}

const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
};

let empresaId;
let sedeId;
let activoId;
let usuarioId;

async function testUsuariosEmpresas() {
  try {
    console.log('\n=== TEST MÓDULO USUARIOS DE EMPRESAS ===\n');

    // 1. Obtener una empresa de prueba
    console.log('1️⃣ Obteniendo empresas...');
    const empresasRes = await axios.get(`${BASE_URL}/empresas`, { headers });
    if (empresasRes.data.length === 0) {
      console.log('❌ No hay empresas. Debes crear una primero.');
      return;
    }
    empresaId = empresasRes.data[0].id;
    console.log(`✅ Empresa ID: ${empresaId} - ${empresasRes.data[0].nombreEmpresa}`);

    // 2. Obtener una sede de la empresa
    console.log('\n2️⃣ Obteniendo sedes de la empresa...');
    const sedesRes = await axios.get(`${BASE_URL}/empresas/${empresaId}/sedes`, { headers });
    if (sedesRes.data.length === 0) {
      console.log('❌ La empresa no tiene sedes. Debes crear una primero.');
      return;
    }
    sedeId = sedesRes.data[0].id;
    console.log(`✅ Sede ID: ${sedeId} - ${sedesRes.data[0].nombreSede}`);

    // 3. Obtener un activo disponible (sin usuario asignado)
    console.log('\n3️⃣ Buscando activo disponible...');
    const inventarioRes = await axios.get(`${BASE_URL}/activos/sede/${sedeId}`, { headers });
    const activoDisponible = inventarioRes.data.find(a => !a.usuarioAsignadoId);
    
    if (activoDisponible) {
      activoId = activoDisponible.id;
      console.log(`✅ Activo disponible ID: ${activoId} - ${activoDisponible.codigo}`);
    } else {
      console.log('⚠️ No hay activos disponibles. Se creará usuario sin activo.');
      activoId = null;
    }

    // 4. LISTAR usuarios (debería estar vacío)
    console.log('\n4️⃣ Listar usuarios de la empresa (inicial)...');
    const listRes1 = await axios.get(`${BASE_URL}/empresas/${empresaId}/usuarios`, { headers });
    console.log(`✅ Total usuarios: ${listRes1.data.data.length}`);
    console.log('Datos recibidos:', JSON.stringify(listRes1.data, null, 2));

    // 5. CREAR usuario
    console.log('\n5️⃣ Crear nuevo usuario...');
    const nuevoUsuario = {
      nombreCompleto: 'Juan Pérez García',
      correo: 'juan.perez@empresa.com',
      cargo: 'Gerente de IT',
      telefono: '555-1234',
      observaciones: 'Usuario de prueba',
      empresaId: empresaId,
      sedeId: sedeId,
      activoAsignadoId: activoId
    };
    
    const createRes = await axios.post(
      `${BASE_URL}/empresas/${empresaId}/usuarios`,
      nuevoUsuario,
      { headers }
    );
    console.log('✅ Usuario creado:', JSON.stringify(createRes.data, null, 2));
    usuarioId = createRes.data.data.id;

    // 6. OBTENER usuario por ID
    console.log(`\n6️⃣ Obtener usuario ID ${usuarioId}...`);
    const getRes = await axios.get(`${BASE_URL}/empresas/${empresaId}/usuarios/${usuarioId}`, { headers });
    console.log('✅ Usuario obtenido:', JSON.stringify(getRes.data, null, 2));

    // 7. ACTUALIZAR usuario
    console.log(`\n7️⃣ Actualizar usuario ID ${usuarioId}...`);
    const updateData = {
      nombreCompleto: 'Juan Pérez García (Actualizado)',
      cargo: 'Director de IT',
      telefono: '555-9999'
    };
    
    const updateRes = await axios.put(
      `${BASE_URL}/empresas/${empresaId}/usuarios/${usuarioId}`,
      updateData,
      { headers }
    );
    console.log('✅ Usuario actualizado:', JSON.stringify(updateRes.data, null, 2));

    // 8. LISTAR usuarios (debería tener 1)
    console.log('\n8️⃣ Listar usuarios de la empresa (después de crear)...');
    const listRes2 = await axios.get(`${BASE_URL}/empresas/${empresaId}/usuarios`, { headers });
    console.log(`✅ Total usuarios: ${listRes2.data.data.length}`);
    console.log('Usuarios:', JSON.stringify(listRes2.data.data, null, 2));

    // 9. ELIMINAR usuario (soft delete)
    console.log(`\n9️⃣ Eliminar usuario ID ${usuarioId}...`);
    const deleteRes = await axios.delete(
      `${BASE_URL}/empresas/${empresaId}/usuarios/${usuarioId}`,
      { headers }
    );
    console.log('✅ Usuario eliminado:', JSON.stringify(deleteRes.data, null, 2));

    // 10. LISTAR usuarios (debería estar vacío nuevamente porque activo=false)
    console.log('\n🔟 Listar usuarios de la empresa (después de eliminar)...');
    const listRes3 = await axios.get(`${BASE_URL}/empresas/${empresaId}/usuarios`, { headers });
    console.log(`✅ Total usuarios activos: ${listRes3.data.data.length}`);

    console.log('\n✅ ¡TODAS LAS PRUEBAS COMPLETADAS EXITOSAMENTE!');

  } catch (error) {
    console.error('\n❌ ERROR en las pruebas:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('StatusText:', error.response.statusText);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
      console.error('URL:', error.config.url);
    } else if (error.request) {
      console.error('No response received');
      console.error('Request:', error.request);
    } else {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    process.exit(1);
  }
}

testUsuariosEmpresas();
