const http = require('http');

/**
 * Script de prueba: Verifica que POST /api/sla/seccion/:empresaId
 * automáticamente crea entry en historial_sla con valorAnterior y valorNuevo
 */

const BASE_URL = 'http://localhost:4000';

// Primero verificar y obtener una empresa existente
let EMPRESA_ID = null;

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
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: data ? JSON.parse(data) : null,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data,
          });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function test() {
  console.log('🧪 SLA Module - End-to-End Test');
  console.log('================================\n');

  try {
    // 0. Obtener una empresa existente
    console.log('0️⃣  Getting existing enterprise...');
    const empresasResp = await makeRequest('GET', `/api/empresas`);
    
    let empresas = empresasResp.data;
    if (empresas && empresas.empresas && Array.isArray(empresas.empresas)) {
      empresas = empresas.empresas;
    } else if (!Array.isArray(empresas)) {
      console.error('❌ Unexpected response format:', empresasResp.data);
      process.exit(1);
    }
    
    if (empresas.length === 0) {
      console.error('❌ No enterprises found. Please create an enterprise first.');
      process.exit(1);
    }
    
    EMPRESA_ID = empresas[0].id;
    console.log(`✅ Using Enterprise ID: ${EMPRESA_ID}\n`);

    // 1. Crear configuración SLA inicial
    console.log('1️⃣  Creating initial SLA configuration...');
    const createResp = await makeRequest('POST', `/api/sla/configuracion/${EMPRESA_ID}`, {
      alcance: {
        slaActivo: true,
        aplicaA: 'incidentes',
        tipoServicioCubierto: 'incidente',
        serviciosCubiertos: {
          soporteRemoto: true,
          soportePresencial: false,
          atencionEnSede: true,
        },
        activosCubiertos: {
          tipo: 'todos',
          categorias: [],
          categoriasPersonalizadas: [],
        },
        sedesCubiertas: {
          tipo: 'todas',
          sedes: [],
        },
        observaciones: 'SLA inicial',
      },
      gestionIncidentes: {
        tipos: { hardware: true, software: true, red: false, accesos: false, otros: false },
        impacto: 'alto',
        urgencia: 'alta',
        prioridadCalculada: 'Alta',
      },
      tiempos: {
        medicionSLA: 'horasHabiles',
        tiemposPorPrioridad: [],
      },
      horarios: {
        dias: ['Lunes', 'Martes'],
        horaInicio: '08:00',
        horaFin: '18:00',
        atencionFueraHorario: false,
        aplicaSLAFueraHorario: false,
        excluirFeriados: true,
        calendarioFeriados: [],
      },
      requisitos: {
        obligacionesCliente: { autorizarIntervencion: true, accesoEquipo: true, infoClara: true },
        condicionesTecnicas: { equipoEncendido: true, conectividadActiva: true, accesoRemoto: true },
        responsabilidadesProveedor: { tecnicoAsignado: true, registroAtencion: true, informeTecnico: true },
      },
      exclusiones: {
        flags: {
          pendienteRespuestaCliente: false,
          esperandoRepuestos: false,
          esperandoProveedorExterno: false,
          fueraDeAlcance: false,
          fuerzaMayor: false,
        },
      },
      alertas: {
        umbrales: [50, 75, 90],
        notificarA: { tecnicoAsignado: true, supervisor: true },
        accionAutomatica: 'notificar',
        estadosVisibles: ['🟢 Cumpliendo', '🟡 En riesgo', '🔴 Incumplido'],
      },
    });

    if (createResp.status !== 201) {
      console.error('❌ Failed to create SLA configuration');
      console.error('Response:', createResp);
      process.exit(1);
    }
    console.log('✅ SLA configuration created');
    console.log(`   ID: ${createResp.data.id}\n`);

    // 2. Obtener configuración para verificar
    console.log('2️⃣  Getting current configuration...');
    const getResp = await makeRequest('GET', `/api/sla/configuracion/${EMPRESA_ID}`);
    if (getResp.status !== 200) {
      console.error('❌ Failed to get configuration');
      process.exit(1);
    }
    console.log('✅ Configuration retrieved');
    console.log(`   SLA ID: ${getResp.data.id}`);
    console.log(`   SLA Activo (initial): ${getResp.data.alcance.slaActivo}\n`);

    // 3. Actualizar sección ALCANCE (esto debe crear entry en historial)
    console.log('3️⃣  Updating ALCANCE section...');
    const updateResp = await makeRequest('POST', `/api/sla/seccion/${EMPRESA_ID}`, {
      seccion: 'alcance',
      data: {
        slaActivo: false, // ← Cambio: true → false
        aplicaA: 'incidentes',
        tipoServicioCubierto: 'incidenteCritico', // ← Cambio: incidente → incidenteCritico
        serviciosCubiertos: {
          soporteRemoto: false,
          soportePresencial: true,
          atencionEnSede: false,
        },
        activosCubiertos: {
          tipo: 'porCategoria',
          categorias: ['PC', 'Servidor'],
          categoriasPersonalizadas: ['Tablet'],
        },
        sedesCubiertas: {
          tipo: 'seleccionadas',
          sedes: [1, 2],
        },
        observaciones: 'SLA actualizada',
      },
    });

    if (updateResp.status !== 200 || !updateResp.data.success) {
      console.error('❌ Failed to update section');
      console.error('Response:', updateResp);
      process.exit(1);
    }
    console.log('✅ ALCANCE section updated');
    console.log(`   New SLA Activo: ${updateResp.data.data.slaActivo}\n`);

    // 4. Verificar que el historial se creó automáticamente
    console.log('4️⃣  Checking history (should have 1+ entries)...');
    const histResp = await makeRequest('GET', `/api/sla/historial/${EMPRESA_ID}?limit=10`);

    if (histResp.status !== 200) {
      console.error('❌ Failed to get history');
      process.exit(1);
    }

    const total = histResp.data.total;
    const items = histResp.data.items;

    if (total === 0) {
      console.error('❌ No history entries found!');
      process.exit(1);
    }

    console.log(`✅ History retrieved: ${total} entries\n`);

    // 5. Verificar la entrada más reciente
    console.log('5️⃣  Verifying latest history entry...');
    const latestEntry = items[0]; // DESC order

    console.log(`   ✅ seccion: ${latestEntry.seccion}`);
    console.log(`   ✅ campo: ${latestEntry.campo}`);
    console.log(`   ✅ motivo: ${latestEntry.motivo}`);
    console.log(`   ✅ usuario: ${latestEntry.usuario || '(null)'}`);

    // Parsear y verificar valores
    const valorAnterior = JSON.parse(latestEntry.valorAnterior);
    const valorNuevo = JSON.parse(latestEntry.valorNuevo);

    console.log(`\n   Checking valorAnterior:`);
    console.log(`   ✅ slaActivo: ${valorAnterior.slaActivo}`);
    console.log(`   ✅ tipoServicioCubierto: ${valorAnterior.tipoServicioCubierto}`);

    console.log(`\n   Checking valorNuevo:`);
    console.log(`   ✅ slaActivo: ${valorNuevo.slaActivo}`);
    console.log(`   ✅ tipoServicioCubierto: ${valorNuevo.tipoServicioCubierto}`);

    // Verificar que son diferentes
    if (valorAnterior.slaActivo === valorNuevo.slaActivo) {
      console.error('\n❌ ERROR: slaActivo values are the same!');
      process.exit(1);
    }

    if (valorAnterior.tipoServicioCubierto === valorNuevo.tipoServicioCubierto) {
      console.error('\n❌ ERROR: tipoServicioCubierto values are the same!');
      process.exit(1);
    }

    console.log('\n✅ Values correctly changed in history!\n');

    // 6. Test edit intention
    console.log('6️⃣  Testing edit intention...');
    const editResp = await makeRequest('POST', `/api/sla/editar/${EMPRESA_ID}`, {
      seccion: 'tiempos',
      motivo: 'Actualizar tiempos de respuesta',
    });

    if (editResp.status !== 200 || !editResp.data.success) {
      console.error('❌ Failed to record edit intention');
      process.exit(1);
    }
    console.log('✅ Edit intention recorded\n');

    // 7. Verificar que se creó el entry "Guardado" → "Editando"
    console.log('7️⃣  Verifying edit intention in history...');
    const hist2Resp = await makeRequest('GET', `/api/sla/historial/${EMPRESA_ID}?limit=10&seccion=tiempos`);
    const editEntry = hist2Resp.data.items[0];

    if (editEntry.valorAnterior === 'Guardado' && editEntry.valorNuevo === 'Editando') {
      console.log('   ✅ valorAnterior: "Guardado"');
      console.log('   ✅ valorNuevo: "Editando"');
      console.log(`   ✅ motivo: ${editEntry.motivo}\n`);
    } else {
      console.error('❌ Edit intention entry has wrong values');
      console.error(`   Got: ${editEntry.valorAnterior} → ${editEntry.valorNuevo}`);
      process.exit(1);
    }

    // 8. Test clear section
    console.log('8️⃣  Testing clear section...');
    const clearResp = await makeRequest('POST', `/api/sla/limpiar/${EMPRESA_ID}`, {
      seccion: 'alertas',
    });

    if (clearResp.status !== 200 || !clearResp.data.success) {
      console.error('❌ Failed to clear section');
      process.exit(1);
    }

    console.log('✅ Section cleared to defaults');
    console.log(`   Default umbrales: ${JSON.stringify(clearResp.data.defaultValues.umbrales)}\n`);

    // Final summary
    console.log('================================');
    console.log('✅ ALL TESTS PASSED!');
    console.log('================================');
    console.log('\n📋 Summary:');
    console.log('✅ Create SLA configuration');
    console.log('✅ Get configuration');
    console.log('✅ Update section with auto-history');
    console.log('✅ History entry created with valorAnterior/valorNuevo');
    console.log('✅ Record edit intention');
    console.log('✅ Clear section to defaults');
    console.log('\n🚀 API is ready for frontend testing!');
    console.log(`📍 Base URL: ${BASE_URL}/api/sla`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

test();
