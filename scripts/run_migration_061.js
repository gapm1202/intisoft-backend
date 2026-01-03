require('dotenv').config();
const { Client } = require('pg');

async function runMigration() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  
  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos');
    
    console.log('\n📋 Ejecutando migración 061: Eliminar estado_contrato de empresas...');
    
    const fs = require('fs');
    const migrationSQL = fs.readFileSync('./migrations/061_drop_estado_contrato_from_empresas.sql', 'utf8');
    
    await client.query(migrationSQL);
    console.log('✅ Migración 061 completada exitosamente');
    
    // Verificar que la columna fue eliminada
    const result = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'empresas' AND column_name = 'estado_contrato'
    `);
    
    if (result.rows.length === 0) {
      console.log('✅ Columna estado_contrato eliminada correctamente de tabla empresas');
    } else {
      console.log('❌ La columna estado_contrato todavía existe');
    }
    
    // Verificar columnas restantes
    const columnsResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'empresas' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Columnas actuales en tabla empresas:');
    columnsResult.rows.forEach(row => {
      console.log(`   - ${row.column_name}`);
    });
    
  } catch (error) {
    console.error('❌ Error en migración:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

runMigration();
