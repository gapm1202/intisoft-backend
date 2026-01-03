require('dotenv').config();
const { Client } = require('pg');

async function runMigration() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  
  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos');
    
    console.log('\n📋 Ejecutando migración 060: Actualizar constraint de estado_contrato...');
    
    const fs = require('fs');
    const migrationSQL = fs.readFileSync('./migrations/060_update_estado_contrato_constraint.sql', 'utf8');
    
    await client.query(migrationSQL);
    console.log('✅ Migración 060 completada exitosamente');
    
    // Verificar el constraint
    const result = await client.query(`
      SELECT conname, pg_get_constraintdef(oid) as definition
      FROM pg_constraint
      WHERE conname = 'chk_estado_contrato' AND conrelid = 'empresas'::regclass
    `);
    
    console.log('\n📋 Verificación - Constraint actualizado:');
    console.log('  ', result.rows[0]?.definition || 'No encontrado');
    
  } catch (error) {
    console.error('❌ Error en migración:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

runMigration();
