/**
 * 🔄 PRUEBA DE SINCRONIZACIÓN BIDIRECCIONAL USUARIO ↔ ACTIVO
 * 
 * Este script prueba que la sincronización funcione correctamente en ambas direcciones
 */

const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'inticorp',
  user: 'postgres',
  password: '1234'
});

async function testSync() {
  console.log('🧪 INICIANDO PRUEBAS DE SINCRONIZACIÓN BIDIRECCIONAL\n');
  
  const client = await pool.connect();
  
  try {
    // SETUP: Crear datos de prueba
    console.log('📋 SETUP: Creando datos de prueba...\n');
    
    // Obtener una empresa y sede existente
    const empresaResult = await client.query('SELECT id FROM empresas LIMIT 1');
    if (empresaResult.rows.length === 0) {
      console.log('❌ No hay empresas en la BD');
      return;
    }
    const empresaId = empresaResult.rows[0].id;
    
    const sedeResult = await client.query('SELECT id FROM sedes WHERE empresa_id = $1 LIMIT 1', [empresaId]);
    if (sedeResult.rows.length === 0) {
      console.log('❌ No hay sedes activas para la empresa', empresaId);
      return;
    }
    const sedeId = sedeResult.rows[0].id;
    
    console.log(`✅ Empresa: ${empresaId}, Sede: ${sedeId}\n`);
    
    // Crear 2 usuarios de prueba
    const user1 = await client.query(`
      INSERT INTO usuarios_empresas (empresa_id, sede_id, nombre_completo, correo, cargo)
      VALUES ($1, $2, 'Usuario Test 1', 'test1@sync.com', 'Tester 1')
      RETURNING id
    `, [empresaId, sedeId]);
    
    const user2 = await client.query(`
      INSERT INTO usuarios_empresas (empresa_id, sede_id, nombre_completo, correo, cargo)
      VALUES ($1, $2, 'Usuario Test 2', 'test2@sync.com', 'Tester 2')
      RETURNING id
    `, [empresaId, sedeId]);
    
    const userId1 = user1.rows[0].id;
    const userId2 = user2.rows[0].id;
    
    console.log(`✅ Usuario 1 creado: ID ${userId1}`);
    console.log(`✅ Usuario 2 creado: ID ${userId2}\n`);
    
    // Crear 2 activos de prueba
    const activo1 = await client.query(`
      INSERT INTO inventario (empresa_id, sede_id, categoria, asset_id, fabricante, modelo)
      VALUES ($1, $2, 'Laptop', 'TEST-SYNC-001', 'Dell', 'Test Model 1')
      RETURNING id
    `, [empresaId, sedeId]);
    
    const activo2 = await client.query(`
      INSERT INTO inventario (empresa_id, sede_id, categoria, asset_id, fabricante, modelo)
      VALUES ($1, $2, 'Desktop', 'TEST-SYNC-002', 'HP', 'Test Model 2')
      RETURNING id
    `, [empresaId, sedeId]);
    
    const activoId1 = activo1.rows[0].id;
    const activoId2 = activo2.rows[0].id;
    
    console.log(`✅ Activo 1 creado: ID ${activoId1} (TEST-SYNC-001)`);
    console.log(`✅ Activo 2 creado: ID ${activoId2} (TEST-SYNC-002)\n`);
    
    // ========================================
    // PRUEBA 1: Asignar activo desde usuario
    // ========================================
    console.log('🧪 PRUEBA 1: Asignar Activo 1 a Usuario 1 desde usuarios_empresas');
    
    await client.query(`
      UPDATE usuarios_empresas 
      SET activo_asignado_id = $1 
      WHERE id = $2
    `, [activoId1, userId1]);
    
    // Verificar que inventario se actualizó
    const checkInventario1 = await client.query('SELECT usuario_asignado_id FROM inventario WHERE id = $1', [activoId1]);
    const checkUser1 = await client.query('SELECT activo_asignado_id FROM usuarios_empresas WHERE id = $1', [userId1]);
    
    if (checkInventario1.rows[0].usuario_asignado_id === userId1 && checkUser1.rows[0].activo_asignado_id === activoId1) {
      console.log('✅ PASÓ: Usuario 1 → Activo 1 (bidireccional)\n');
    } else {
      console.log('❌ FALLÓ: La sincronización no funcionó');
      console.log('   Inventario:', checkInventario1.rows[0]);
      console.log('   Usuario:', checkUser1.rows[0], '\n');
    }
    
    // ========================================
    // PRUEBA 2: Cambiar activo desde inventario
    // ========================================
    console.log('🧪 PRUEBA 2: Asignar Usuario 2 a Activo 1 desde inventario (debe liberar Usuario 1)');
    
    await client.query(`
      UPDATE inventario 
      SET usuario_asignado_id = $1 
      WHERE id = $2
    `, [userId2, activoId1]);
    
    // Verificar que usuario 1 se liberó y usuario 2 se asignó
    const checkUser1After = await client.query('SELECT activo_asignado_id FROM usuarios_empresas WHERE id = $1', [userId1]);
    const checkUser2After = await client.query('SELECT activo_asignado_id FROM usuarios_empresas WHERE id = $1', [userId2]);
    const checkInventario1After = await client.query('SELECT usuario_asignado_id FROM inventario WHERE id = $1', [activoId1]);
    
    if (checkUser1After.rows[0].activo_asignado_id === null &&
        checkUser2After.rows[0].activo_asignado_id === activoId1 &&
        checkInventario1After.rows[0].usuario_asignado_id === userId2) {
      console.log('✅ PASÓ: Usuario 1 liberado, Usuario 2 → Activo 1\n');
    } else {
      console.log('❌ FALLÓ: La liberación no funcionó correctamente');
      console.log('   Usuario 1 (debe ser null):', checkUser1After.rows[0].activo_asignado_id);
      console.log('   Usuario 2 (debe ser', activoId1, '):', checkUser2After.rows[0].activo_asignado_id);
      console.log('   Inventario (debe ser', userId2, '):', checkInventario1After.rows[0].usuario_asignado_id, '\n');
    }
    
    // ========================================
    // PRUEBA 3: Reasignar activo desde usuario
    // ========================================
    console.log('🧪 PRUEBA 3: Asignar Activo 2 a Usuario 1 (debe liberar Activo 1 de Usuario 2)');
    
    await client.query(`
      UPDATE usuarios_empresas 
      SET activo_asignado_id = $1 
      WHERE id = $2
    `, [activoId2, userId1]);
    
    // Verificar estado final
    const finalUser1 = await client.query('SELECT activo_asignado_id FROM usuarios_empresas WHERE id = $1', [userId1]);
    const finalUser2 = await client.query('SELECT activo_asignado_id FROM usuarios_empresas WHERE id = $1', [userId2]);
    const finalActivo1 = await client.query('SELECT usuario_asignado_id FROM inventario WHERE id = $1', [activoId1]);
    const finalActivo2 = await client.query('SELECT usuario_asignado_id FROM inventario WHERE id = $1', [activoId2]);
    
    if (finalUser1.rows[0].activo_asignado_id === activoId2 &&
        finalUser2.rows[0].activo_asignado_id === activoId1 &&
        finalActivo1.rows[0].usuario_asignado_id === userId2 &&
        finalActivo2.rows[0].usuario_asignado_id === userId1) {
      console.log('✅ PASÓ: Usuario 1 → Activo 2, Usuario 2 → Activo 1\n');
    } else {
      console.log('❌ FALLÓ: Estado final incorrecto');
      console.log('   Usuario 1 activo_asignado_id:', finalUser1.rows[0].activo_asignado_id, '(esperado:', activoId2, ')');
      console.log('   Usuario 2 activo_asignado_id:', finalUser2.rows[0].activo_asignado_id, '(esperado:', activoId1, ')');
      console.log('   Activo 1 usuario_asignado_id:', finalActivo1.rows[0].usuario_asignado_id, '(esperado:', userId2, ')');
      console.log('   Activo 2 usuario_asignado_id:', finalActivo2.rows[0].usuario_asignado_id, '(esperado:', userId1, ')\n');
    }
    
    // ========================================
    // PRUEBA 4: Liberar asignación poniendo NULL
    // ========================================
    console.log('🧪 PRUEBA 4: Liberar Usuario 1 poniendo activo_asignado_id = NULL');
    
    await client.query(`
      UPDATE usuarios_empresas 
      SET activo_asignado_id = NULL 
      WHERE id = $1
    `, [userId1]);
    
    const liberadoUser1 = await client.query('SELECT activo_asignado_id FROM usuarios_empresas WHERE id = $1', [userId1]);
    const liberadoActivo2 = await client.query('SELECT usuario_asignado_id FROM inventario WHERE id = $1', [activoId2]);
    
    if (liberadoUser1.rows[0].activo_asignado_id === null &&
        liberadoActivo2.rows[0].usuario_asignado_id === null) {
      console.log('✅ PASÓ: Usuario 1 y Activo 2 liberados correctamente\n');
    } else {
      console.log('❌ FALLÓ: La liberación no se sincronizó');
      console.log('   Usuario 1:', liberadoUser1.rows[0].activo_asignado_id);
      console.log('   Activo 2:', liberadoActivo2.rows[0].usuario_asignado_id, '\n');
    }
    
    // ========================================
    // CLEANUP
    // ========================================
    console.log('🧹 CLEANUP: Eliminando datos de prueba...');
    
    await client.query('DELETE FROM usuarios_empresas WHERE id IN ($1, $2)', [userId1, userId2]);
    await client.query('DELETE FROM inventario WHERE id IN ($1, $2)', [activoId1, activoId2]);
    
    console.log('✅ Datos de prueba eliminados\n');
    
    console.log('🎉 PRUEBAS COMPLETADAS');
    
  } catch (error) {
    console.error('❌ Error en las pruebas:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

testSync();
