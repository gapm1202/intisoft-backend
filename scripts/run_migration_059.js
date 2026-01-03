require('dotenv').config();
const { Client } = require('pg');

async function runMigration() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  
  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos');
    
    console.log('\n📋 Ejecutando migración 059: Remover DEFAULT de estado_contrato...');
    
    // Leer migración
    const fs = require('fs');
    const migrationSQL = fs.readFileSync('./migrations/059_remove_default_estado_contrato.sql', 'utf8');
    
    await client.query(migrationSQL);
    console.log('✅ Migración 059 completada exitosamente');
    
    // Verificar el cambio
    const result = await client.query(`
      SELECT column_name, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'empresas' AND column_name = 'estado_contrato'
    `);
    
    console.log('\n📋 Verificación - estado_contrato en tabla empresas:');
    console.log('   column_default:', result.rows[0].column_default || 'NULL ✅');
    
    // Contar empresas sin contrato que tenían 'Activo'
    const countResult = await client.query(`
      SELECT COUNT(*) as total
      FROM empresas e
      WHERE estado_contrato IS NULL
        AND NOT EXISTS (SELECT 1 FROM contracts c WHERE c.empresa_id = e.id)
    `);
    
    console.log(`\n📊 Empresas sin contrato ahora con estado_contrato = NULL: ${countResult.rows[0].total}`);
    
  } catch (error) {
    console.error('❌ Error en migración:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

runMigration();
