require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function testAPIResponse() {
  try {
    console.log('\n🧪 Simulación de respuesta API para GET /api/empresas/:id\n');
    
    // Simular lo que hace empresa.service.ts -> getEmpresa()
    const empresaId = 85; // OBRASIN SAC que sabemos tiene contrato
    
    // 1. Obtener empresa (sin estado_contrato)
    const empresaRes = await pool.query(`
      SELECT id, nombre, codigo, codigo_cliente AS "codigoCliente", ruc,
             direccion_fiscal AS "direccionFiscal", direccion_operativa AS "direccionOperativa",
             ciudad, provincia, tipo_empresa AS "tipoEmpresa",
             pagina_web AS "paginaWeb",
             contactos_admin AS "contactosAdmin",
             contactos_tecnicos AS "contactosTecnicos",
             observaciones_generales AS "observacionesGenerales",
             autorizacion_facturacion AS "autorizacionFacturacion",
             creado_en
      FROM empresas 
      WHERE id = $1
    `, [empresaId]);
    
    if (empresaRes.rows.length === 0) {
      console.log('❌ Empresa no encontrada');
      return;
    }
    
    const empresa = empresaRes.rows[0];
    
    // 2. Obtener contrato activo
    const contratoRes = await pool.query(`
      SELECT c.id, c.empresa_id AS "empresaId", c.tipo_contrato AS "tipoContrato", 
             c.estado_contrato AS "estadoContrato",
             c.fecha_inicio AS "fechaInicio", c.fecha_fin AS "fechaFin", 
             c.renovacion_automatica AS "renovacionAutomatica",
             c.responsable_comercial AS "responsableComercial", c.observaciones
      FROM contracts c
      WHERE c.empresa_id = $1 AND c.estado_contrato = 'activo'
      LIMIT 1
    `, [empresaId]);
    
    const contrato = contratoRes.rows.length > 0 ? contratoRes.rows[0] : null;
    
    // 3. Construir respuesta como lo hace el service
    const response = {
      ...empresa,
      contrato: contrato
    };
    
    console.log('📝 Estructura de respuesta:');
    console.log(JSON.stringify(response, null, 2));
    
    console.log('\n✅ Validaciones:');
    console.log(`   - empresa.estadoContrato: ${response.estadoContrato === undefined ? 'undefined ✅' : response.estadoContrato + ' ❌'}`);
    console.log(`   - empresa.contrato existe: ${response.contrato !== undefined ? '✅' : '❌'}`);
    
    if (response.contrato) {
      console.log(`   - contrato.estadoContrato: ${response.contrato.estadoContrato || 'null'} ${response.contrato.estadoContrato ? '✅' : '❌'}`);
      console.log(`   - contrato.fechaInicio: ${response.contrato.fechaInicio || 'null'}`);
      console.log(`   - contrato.fechaFin: ${response.contrato.fechaFin || 'null'}`);
    } else {
      console.log('   - contrato es null (empresa sin contrato activo)');
    }
    
    console.log('\n💡 Frontend puede validar:');
    console.log('   if (empresa.contrato === null) {');
    console.log('     // Bloquear creación de tickets - sin contrato');
    console.log('   } else if (empresa.contrato.estadoContrato === "activo") {');
    console.log('     // Permitir tickets');
    console.log('   } else {');
    console.log('     // Bloquear - contrato vencido/suspendido');
    console.log('   }');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

testAPIResponse();
