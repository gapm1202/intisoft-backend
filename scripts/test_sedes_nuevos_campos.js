#!/usr/bin/env node
/**
 * Test nuevos campos de sedes
 * Prueba la creación de una sede con los nuevos campos
 */
const http = require('http');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sIjoiYWRtaW5pc3RyYWRvciIsImlhdCI6MTc2NTkwNDQ5OSwiZXhwIjoxNzY2NTA5Mjk5fQ.sxvlO7kTnLUXsJtIP0GhPjXPC6_QyGm6zWobghIuT8Q';
const host = 'localhost';
const port = 4000;

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: host,
      port: port,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: data ? JSON.parse(data) : null
          });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, error: 'Parse error' });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  console.log('\n🧪 Testing nuevos campos de sedes\n');

  try {
    // Primero crear una empresa de prueba
    console.log('📝 Step 1: Creating test empresa...');
    const empresaBody = {
      nombre: `Empresa-Sedes-Test-${Date.now()}`,
      ruc: `${Math.floor(Math.random() * 1000000000000)}`.padStart(11, '0'),
      direccionFiscal: 'Av Test 123',
      ciudad: 'Lima'
    };

    const empresaRes = await makeRequest('POST', '/api/empresas', empresaBody);
    if (empresaRes.status !== 201) {
      console.log('❌ Failed to create empresa:', empresaRes.data);
      process.exit(1);
    }

    const empresaId = empresaRes.data.id;
    console.log(`✅ Empresa created: id=${empresaId}, codigoCliente=${empresaRes.data.codigoCliente}`);

    // Crear sede con nuevos campos
    console.log('\n📝 Step 2: Creating sede with new fields...');
    const sedeBody = {
      nombre: 'Sede Test Principal',
      codigoInterno: 'SED-TST',
      direccion: 'Av Principal 456',
      ciudad: 'Lima',
      provincia: 'Lima',
      telefono: '987654321',
      email: 'sede@test.com',
      tipo: 'principal',
      horarioAtencion: 'Lunes a Viernes 8am-6pm, Sábado 9am-1pm',
      observaciones: 'Sede de prueba con todos los nuevos campos',
      responsables: [
        {
          nombre: 'Juan Pérez',
          cargo: 'Gerente de Sede',
          telefono: '999888777',
          email: 'juan@test.com'
        },
        {
          nombre: 'María García',
          cargo: 'Coordinadora',
          telefono: '999888666',
          email: 'maria@test.com'
        }
      ],
      autorizaIngresoTecnico: true,
      autorizaMantenimientoFueraHorario: false
    };

    const sedeRes = await makeRequest('POST', `/api/empresas/${empresaId}/sedes`, sedeBody);
    
    if (sedeRes.status === 201) {
      const sede = sedeRes.data;
      console.log('✅ Sede created successfully!');
      console.log('\n📊 Sede details:');
      console.log(`  ID: ${sede.id}`);
      console.log(`  Nombre: ${sede.nombre}`);
      console.log(`  Código Interno: ${sede.codigoInterno}`);
      console.log(`  Horario: ${sede.horarioAtencion}`);
      console.log(`  Observaciones: ${sede.observaciones}`);
      console.log(`  Responsables: ${JSON.stringify(sede.responsables, null, 2)}`);
      console.log(`  Autoriza Ingreso Técnico: ${sede.autorizaIngresoTecnico}`);
      console.log(`  Autoriza Mantenimiento Fuera Horario: ${sede.autorizaMantenimientoFueraHorario}`);
      
      // Verify fields are correctly stored
      let errors = 0;
      if (sede.codigoInterno !== 'SED-TST') {
        console.log(`\n❌ codigoInterno mismatch: expected SED-TST, got ${sede.codigoInterno}`);
        errors++;
      }
      if (sede.horarioAtencion !== sedeBody.horarioAtencion) {
        console.log(`\n❌ horarioAtencion mismatch`);
        errors++;
      }
      if (sede.autorizaIngresoTecnico !== true) {
        console.log(`\n❌ autorizaIngresoTecnico should be true`);
        errors++;
      }
      if (sede.autorizaMantenimientoFueraHorario !== false) {
        console.log(`\n❌ autorizaMantenimientoFueraHorario should be false`);
        errors++;
      }
      if (!sede.responsables || sede.responsables.length !== 2) {
        console.log(`\n❌ responsables should have 2 items, got ${sede.responsables?.length}`);
        errors++;
      }

      if (errors === 0) {
        console.log('\n🎉 All fields validated successfully!');
        process.exit(0);
      } else {
        console.log(`\n⚠️ ${errors} validation errors found`);
        process.exit(1);
      }
    } else {
      console.log('❌ Failed to create sede:', sedeRes.data);
      process.exit(1);
    }

  } catch (error) {
    console.error('\n💥 Unexpected error:');
    console.error(error);
    process.exit(2);
  }
}

main();
