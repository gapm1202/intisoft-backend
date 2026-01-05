/**
 * Script simple para verificar si los endpoints retornan campos M:N
 */

const http = require('http');

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sIjoiYWRtaW5pc3RyYWRvciIsImlhdCI6MTczNzQ3MjkxNiwiZXhwIjoxNzM4MDc3NzE2fQ.SshDs8del2XCgmJVgVp6xkWfCdMNBnc5HWaMzrQlno4';

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: path,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TOKEN}`
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function main() {
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║  VERIFICACIÓN CAMPOS M:N - RESPUESTA BACKEND  ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  try {
    // Test 1: GET Inventario
    console.log('📦 TEST 1: GET /api/empresas/1/inventario');
    console.log('─────────────────────────────────────────────────');
    const invResponse = await makeRequest('/api/empresas/1/inventario');
    
    if (invResponse.activos && invResponse.activos.length > 0) {
      const firstActivo = invResponse.activos[0];
      
      console.log(`✓ Total activos: ${invResponse.activos.length}`);
      console.log(`✓ Primer activo ID: ${firstActivo.id}`);
      console.log(`✓ AssetId: ${firstActivo.assetId || 'N/A'}`);
      console.log('');
      
      // Verificar campos M:N
      const hasUsuariosAsignados = 'usuariosAsignados' in firstActivo;
      const hasCantidad = 'cantidadUsuariosAsignados' in firstActivo;
      
      if (hasUsuariosAsignados && hasCantidad) {
        console.log('✅ CAMPOS M:N PRESENTES:');
        console.log(`   - usuariosAsignados: ${Array.isArray(firstActivo.usuariosAsignados) ? 'Array' : typeof firstActivo.usuariosAsignados}`);
        console.log(`   - Longitud array: ${firstActivo.usuariosAsignados?.length || 0}`);
        console.log(`   - cantidadUsuariosAsignados: ${firstActivo.cantidadUsuariosAsignados}`);
        
        if (firstActivo.usuariosAsignados && firstActivo.usuariosAsignados.length > 0) {
          console.log('\n   Ejemplo de usuario asignado:');
          const user = firstActivo.usuariosAsignados[0];
          console.log(`   {`);
          console.log(`     id: ${user.id},`);
          console.log(`     nombreCompleto: "${user.nombreCompleto}",`);
          console.log(`     correo: "${user.correo}",`);
          console.log(`     cargo: "${user.cargo || 'N/A'}"`);
          console.log(`   }`);
        }
      } else {
        console.log('❌ CAMPOS M:N FALTANTES:');
        console.log(`   - usuariosAsignados: ${hasUsuariosAsignados ? '✓' : '✗'}`);
        console.log(`   - cantidadUsuariosAsignados: ${hasCantidad ? '✓' : '✗'}`);
      }
      
      // Verificar campos legacy
      console.log('\n📝 Campos Legacy (compatibilidad):');
      console.log(`   - usuarioAsignadoId: ${firstActivo.usuarioAsignadoId || 'null'}`);
      console.log(`   - usuarioAsignadoData: ${firstActivo.usuarioAsignadoData ? '✓' : 'null'}`);
    } else {
      console.log('⚠️  No hay activos en la respuesta');
    }

    console.log('\n─────────────────────────────────────────────────');
    console.log('👥 TEST 2: GET /api/empresas/1/usuarios');
    console.log('─────────────────────────────────────────────────');
    
    const userResponse = await makeRequest('/api/empresas/1/usuarios');
    
    if (userResponse.usuarios && userResponse.usuarios.length > 0) {
      const firstUser = userResponse.usuarios[0];
      
      console.log(`✓ Total usuarios: ${userResponse.usuarios.length}`);
      console.log(`✓ Primer usuario ID: ${firstUser.id}`);
      console.log(`✓ Nombre: ${firstUser.nombreCompleto || 'N/A'}`);
      console.log('');
      
      // Verificar campos M:N
      const hasActivosAsignados = 'activosAsignados' in firstUser;
      const hasCantidad = 'cantidadActivosAsignados' in firstUser;
      
      if (hasActivosAsignados && hasCantidad) {
        console.log('✅ CAMPOS M:N PRESENTES:');
        console.log(`   - activosAsignados: ${Array.isArray(firstUser.activosAsignados) ? 'Array' : typeof firstUser.activosAsignados}`);
        console.log(`   - Longitud array: ${firstUser.activosAsignados?.length || 0}`);
        console.log(`   - cantidadActivosAsignados: ${firstUser.cantidadActivosAsignados}`);
        
        if (firstUser.activosAsignados && firstUser.activosAsignados.length > 0) {
          console.log('\n   Ejemplo de activo asignado:');
          const activo = firstUser.activosAsignados[0];
          console.log(`   {`);
          console.log(`     id: ${activo.id},`);
          console.log(`     assetId: "${activo.assetId}",`);
          console.log(`     nombre: "${activo.nombre || activo.categoria}",`);
          console.log(`     categoria: "${activo.categoria || 'N/A'}"`);
          console.log(`   }`);
        }
      } else {
        console.log('❌ CAMPOS M:N FALTANTES:');
        console.log(`   - activosAsignados: ${hasActivosAsignados ? '✓' : '✗'}`);
        console.log(`   - cantidadActivosAsignados: ${hasCantidad ? '✓' : '✗'}`);
      }
      
      // Verificar campos legacy
      console.log('\n📝 Campos Legacy (compatibilidad):');
      console.log(`   - activoAsignadoId: ${firstUser.activoAsignadoId || 'null'}`);
      console.log(`   - activoCodigo: ${firstUser.activoCodigo || 'null'}`);
    } else {
      console.log('⚠️  No hay usuarios en la respuesta');
    }

    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║              RESULTADO FINAL                   ║');
    console.log('╚════════════════════════════════════════════════╝\n');
    
    const inventarioOK = invResponse.activos?.[0]?.usuariosAsignados !== undefined;
    const usuariosOK = userResponse.usuarios?.[0]?.activosAsignados !== undefined;
    
    if (inventarioOK && usuariosOK) {
      console.log('✅ SÍ - Los endpoints YA devuelven los arrays M:N');
      console.log('');
      console.log('🚀 FRONTEND PUEDE EMPEZAR A USAR:');
      console.log('   • GET /api/empresas/:id/inventario → campo "usuariosAsignados"');
      console.log('   • GET /api/empresas/:id/usuarios → campo "activosAsignados"');
      console.log('');
      console.log('📖 Ver documentación: docs/M2N_FRONTEND_GUIDE.md');
    } else {
      console.log('❌ NO - Faltan campos M:N en las respuestas');
      console.log('');
      console.log('Campos presentes:');
      console.log(`   • Inventario → usuariosAsignados: ${inventarioOK ? '✓' : '✗'}`);
      console.log(`   • Usuarios → activosAsignados: ${usuariosOK ? '✓' : '✗'}`);
    }

    console.log('\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\n⚠️  Asegúrate de que el servidor esté corriendo en puerto 4000');
    process.exit(1);
  }
}

main();
