#!/usr/bin/env node
const http = require('http');

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sIjoiYWRtaW5pc3RyYWRvciIsImlhdCI6MTc2NTkwODAzNCwiZXhwIjoxNzY2NTEyODM0fQ.tTqrGiSeMNII2AkRlCN-6pXhEzaT5uF15cPysP3etYM';
const BASE_URL = 'http://localhost:4000';

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            body: data ? JSON.parse(data) : null,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            body: data,
          });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function test() {
  try {
    console.log('=== Test: Soft Delete Sedes ===\n');

    // 1. Get empresas
    console.log('1. Obteniendo empresas...');
    const empresasRes = await makeRequest('GET', '/api/empresas');
    if (!empresasRes.body || empresasRes.body.length === 0) {
      console.log('   ❌ No hay empresas');
      return;
    }
    const empresaId = empresasRes.body[0].id;
    console.log(`   ✅ Empresa ID: ${empresaId}\n`);

    // 2. Get sedes
    console.log('2. Obteniendo sedes activas...');
    const sedesRes = await makeRequest('GET', `/api/empresas/${empresaId}/sedes`);
    if (!sedesRes.body || sedesRes.body.length === 0) {
      console.log('   ⚠️  No hay sedes. Creando una...');
      
      const newSedeRes = await makeRequest('POST', `/api/empresas/${empresaId}/sedes`, {
        nombre: 'Test Desactivar',
        direccion: 'Av. Test 123',
      });
      if (newSedeRes.status !== 201) {
        console.log(`   ❌ Error creando sede: ${newSedeRes.status}`, newSedeRes.body);
        return;
      }
      console.log('   ✅ Sede creada:', newSedeRes.body);
      var sedeId = newSedeRes.body.id;
    } else {
      sedeId = sedesRes.body[0].id;
      console.log(`   ✅ Sede ID: ${sedeId}`);
      console.log(`      Nombre: ${sedesRes.body[0].nombre}`);
      console.log(`      Activo: ${sedesRes.body[0].activo}\n`);
    }

    // 3. Get sede details ANTES de desactivar
    console.log('3. Obteniendo detalles de la sede...');
    const sedeDetailsRes = await makeRequest('GET', `/api/empresas/${empresaId}/sedes/${sedeId}`);
    console.log(`   ✅ Estado antes: activo=${sedeDetailsRes.body.activo}, motivo="${sedeDetailsRes.body.motivo}"\n`);

    // 4. DESACTIVAR sede con PATCH
    console.log('4. Desactivando sede con PATCH...');
    const patchBody = {
      activo: false,
      motivo: 'Cierre temporal para renovación'
    };
    console.log(`   Enviando: ${JSON.stringify(patchBody)}`);
    const patchRes = await makeRequest('PATCH', `/api/empresas/${empresaId}/sedes/${sedeId}`, patchBody);
    
    if (patchRes.status !== 200) {
      console.log(`   ❌ Error (HTTP ${patchRes.status}):`, patchRes.body);
      return;
    }
    console.log(`   ✅ Sede desactivada`);
    console.log(`      Respuesta: activo=${patchRes.body.data.activo}, motivo="${patchRes.body.data.motivo}"\n`);

    // 5. Verificar que NO aparece en listado de sedes activas
    console.log('5. Verificando que no aparece en listado de sedes...');
    const sedesAfterRes = await makeRequest('GET', `/api/empresas/${empresaId}/sedes`);
    const foundInactive = sedesAfterRes.body.find(s => s.id === sedeId);
    if (foundInactive) {
      console.log(`   ❌ Sede desactivada aún aparece en listado: ${foundInactive.nombre}`);
    } else {
      console.log(`   ✅ Sede desactivada NO aparece en listado de activas\n`);
    }

    // 6. REACTIVAR sede con PATCH
    console.log('6. Reactivando sede con PATCH...');
    const reactivateBody = {
      activo: true,
      motivo: 'Renovación completada'
    };
    console.log(`   Enviando: ${JSON.stringify(reactivateBody)}`);
    const reactivateRes = await makeRequest('PATCH', `/api/empresas/${empresaId}/sedes/${sedeId}`, reactivateBody);
    
    if (reactivateRes.status !== 200) {
      console.log(`   ❌ Error (HTTP ${reactivateRes.status}):`, reactivateRes.body);
      return;
    }
    console.log(`   ✅ Sede reactivada`);
    console.log(`      Respuesta: activo=${reactivateRes.body.data.activo}, motivo="${reactivateRes.body.data.motivo}"\n`);

    // 7. Verificar que SÍ aparece en listado de sedes activas
    console.log('7. Verificando que aparece nuevamente en listado...');
    const sedesAfterReactivateRes = await makeRequest('GET', `/api/empresas/${empresaId}/sedes`);
    const foundActive = sedesAfterReactivateRes.body.find(s => s.id === sedeId);
    if (foundActive) {
      console.log(`   ✅ Sede reactivada aparece en listado: ${foundActive.nombre}`);
      console.log(`      activo=${foundActive.activo}, motivo="${foundActive.motivo}"\n`);
    } else {
      console.log(`   ❌ Sede reactivada NO aparece en listado\n`);
    }

    console.log('=== ✅ TEST COMPLETADO CON ÉXITO ===');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

test();
