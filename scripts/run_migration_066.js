const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'inticorp',
  user: 'postgres',
  password: '1234'
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Ejecutando migración 066 - Tabla usuarios_activos (M:N)\n');
    
    const sqlPath = path.join(__dirname, '..', 'migrations', '066_create_usuarios_activos_m2n.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    await client.query(sql);
    
    console.log('✅ Tabla usuarios_activos creada exitosamente\n');
    
    // Verificar migración
    const result = await client.query(`
      SELECT 
        COUNT(*) as total_asignaciones,
        COUNT(DISTINCT usuario_id) as usuarios_con_activos,
        COUNT(DISTINCT activo_id) as activos_asignados
      FROM usuarios_activos
      WHERE activo = TRUE
    `);
    
    const stats = result.rows[0];
    console.log('📊 Estadísticas de migración:');
    console.log(`   ✓ Total asignaciones: ${stats.total_asignaciones}`);
    console.log(`   ✓ Usuarios con activos: ${stats.usuarios_con_activos}`);
    console.log(`   ✓ Activos asignados: ${stats.activos_asignados}`);
    
    // Verificar que se eliminaron los triggers
    const triggersResult = await client.query(`
      SELECT trigger_name 
      FROM information_schema.triggers 
      WHERE trigger_name LIKE 'trigger_sync%'
    `);
    
    if (triggersResult.rows.length === 0) {
      console.log('\n✅ Triggers 1:1 eliminados correctamente');
    } else {
      console.log('\n⚠️ Algunos triggers aún existen:', triggersResult.rows);
    }
    
    console.log('\n🎉 Migración 066 completada - Relación M:N configurada');
    
  } catch (error) {
    console.error('❌ Error en migración:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
