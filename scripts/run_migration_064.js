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
    
    const fs = require('fs');
    const path = require('path');
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, '../migrations/064_create_usuarios_empresas.sql'),
      'utf-8'
    );
    
    await client.query(migrationSQL);
    console.log('✅ Migración 064 completada exitosamente');
    
    // Verificar tabla usuarios_empresas
    const checkTable = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'usuarios_empresas'
      );
    `);
    
    if (checkTable.rows[0].exists) {
      console.log('✅ Tabla usuarios_empresas creada correctamente');
      
      // Contar usuarios
      const countResult = await client.query('SELECT COUNT(*) as count FROM usuarios_empresas');
      console.log(`📊 Usuarios actuales: ${countResult.rows[0].count}`);
    }
    
    // Verificar columna en inventario
    const checkColumn = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'inventario' AND column_name = 'usuario_asignado_id'
      );
    `);
    
    if (checkColumn.rows[0].exists) {
      console.log('✅ Campo usuario_asignado_id agregado a tabla inventario');
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
