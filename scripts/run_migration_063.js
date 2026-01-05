const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'inticorp',
  user: 'postgres',
  password: '1234',
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('✅ Conectado a la base de datos');
    
    // Leer el archivo de migración
    const fs = require('fs');
    const path = require('path');
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, '../migrations/063_drop_catalogo_tipos.sql'),
      'utf-8'
    );
    
    // Ejecutar migración
    await client.query(migrationSQL);
    console.log('✅ Migración 063 completada: Tabla catalogo_tipos eliminada');
    
    // Verificar que la tabla fue eliminada
    const checkTable = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'catalogo_tipos'
      );
    `);
    
    if (!checkTable.rows[0].exists) {
      console.log('✅ Verificado: La tabla catalogo_tipos ya no existe');
    } else {
      console.log('⚠️  Advertencia: La tabla catalogo_tipos todavía existe');
    }
    
  } catch (error) {
    console.error('❌ Error al ejecutar migración:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
