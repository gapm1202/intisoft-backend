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
    console.log('🔄 Ejecutando migración 065 - Triggers de sincronización bidireccional\n');
    
    const sqlPath = path.join(__dirname, '..', 'migrations', '065_create_sync_triggers.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    await client.query(sql);
    
    console.log('✅ Triggers creados exitosamente\n');
    
    // Verificar
    const result = await client.query(`
      SELECT 
        trigger_name, 
        event_object_table, 
        action_timing, 
        event_manipulation
      FROM information_schema.triggers 
      WHERE trigger_name LIKE 'trigger_sync%'
      ORDER BY event_object_table
    `);
    
    console.log('📋 Triggers instalados:');
    result.rows.forEach(row => {
      console.log(`   ✓ ${row.trigger_name} en ${row.event_object_table} (${row.action_timing} ${row.event_manipulation})`);
    });
    
    console.log('\n🎉 Migración 065 completada');
    
  } catch (error) {
    console.error('❌ Error en migración:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
