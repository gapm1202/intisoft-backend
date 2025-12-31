// Test de validación actualizada - SIN campo tipos
const http = require('http');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sIjoiYWRtaW5pc3RyYWRvciIsImlhdCI6MTc2Njk4NjUxOSwiZXhwIjoxNzY3NTkxMzE5fQ.yuOTTwmxKSM9XjGfdxlnsYJRTSdJP9UkuPnA-UhjvzY';

console.log('='.repeat(70));
console.log('PRUEBA DE VALIDACIÓN ACTUALIZADA - CAMPO TIPOS ELIMINADO');
console.log('='.repeat(70));
console.log('');

function testPayload(testName, payload) {
  return new Promise((resolve) => {
    const data = JSON.stringify(payload);

    const options = {
      hostname: 'localhost',
      port: 4000,
      path: '/api/sla/seccion/72',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'Authorization': `Bearer ${token}`
      }
    };

    console.log(`📝 TEST: ${testName}`);
    console.log('-'.repeat(70));
    console.log('Payload enviado:');
    console.log(JSON.stringify(payload, null, 2));
    console.log('');

    const req = http.request(options, (res) => {
      let response = '';

      res.on('data', (chunk) => {
        response += chunk;
      });

      res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        
        try {
          const json = JSON.parse(response);
          
          if (res.statusCode === 200 || res.statusCode === 201) {
            console.log('✅ ÉXITO - Payload aceptado');
          } else {
            console.log('❌ ERROR');
            console.log('Mensaje:', json.error);
          }
          
          console.log('');
          console.log('='.repeat(70));
          console.log('');
        } catch (e) {
          console.log('Respuesta:', response);
          console.log('');
          console.log('='.repeat(70));
          console.log('');
        }
        
        resolve();
      });
    });

    req.on('error', (error) => {
      console.error('❌ Error de conexión:', error.message);
      console.log('');
      console.log('='.repeat(70));
      console.log('');
      resolve();
    });

    req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log('⏳ Esperando que el servidor esté listo...');
  console.log('');
  
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 1: Payload mínimo (solo impacto y urgencia)
  await testPayload('Payload mínimo - Solo campos requeridos', {
    seccion: 'incidentes',
    data: {
      impacto: 'medio',
      urgencia: 'media'
    }
  });

  // Test 2: Payload completo (todos los campos)
  await testPayload('Payload completo - Todos los campos', {
    seccion: 'incidentes',
    data: {
      categoriaITIL: 'infraestructura',
      impacto: 'alto',
      urgencia: 'alta',
      prioridadCalculada: 'Alta'
    }
  });

  // Test 3: Con campo tipos (debería aceptarse e ignorarse)
  await testPayload('Payload con tipos (compatibilidad) - Debería aceptarse', {
    seccion: 'incidentes',
    data: {
      tipos: [],
      impacto: 'bajo',
      urgencia: 'baja',
      prioridadCalculada: 'Baja'
    }
  });

  // Test 4: Con tipos como objeto (debería aceptarse e ignorarse)
  await testPayload('Payload con tipos como objeto - Debería aceptarse', {
    seccion: 'incidentes',
    data: {
      tipos: { hardware: false, software: false },
      impacto: 'alto',
      urgencia: 'media',
      categoriaITIL: 'usuario'
    }
  });

  // Test 5: Error - valor inválido de impacto
  await testPayload('ERROR esperado - Impacto inválido', {
    seccion: 'incidentes',
    data: {
      impacto: 'critico',
      urgencia: 'alta'
    }
  });

  // Test 6: Error - valor inválido de urgencia
  await testPayload('ERROR esperado - Urgencia inválida', {
    seccion: 'incidentes',
    data: {
      impacto: 'alto',
      urgencia: 'critica'
    }
  });

  console.log('');
  console.log('📊 RESUMEN:');
  console.log('');
  console.log('✅ Tests 1-4 deberían ser EXITOSOS (status 200/201)');
  console.log('❌ Tests 5-6 deberían fallar (status 400) con mensajes descriptivos');
  console.log('');
  console.log('💡 CONFIRMACIÓN:');
  console.log('- El campo "tipos" ya NO se valida');
  console.log('- Solo se validan: impacto, urgencia, prioridadCalculada, categoriaITIL');
  console.log('- El backend acepta "tipos" por compatibilidad pero lo ignora');
  console.log('');
}

runTests().catch(console.error);
