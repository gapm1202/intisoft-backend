const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'inticorp',
  user: 'postgres',
  password: '1234',
});

async function verify() {
  try {
    // Verificar tabla usuarios_empresas
    const tableCheck = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'usuarios_empresas' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n✅ Columnas tabla usuarios_empresas:');
    tableCheck.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
    
    // Verificar columna en inventario
    const columnCheck = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'inventario' 
      AND column_name = 'usuario_asignado_id'
    `);
    
    console.log('\n✅ Campo usuario_asignado_id en inventario:', 
      columnCheck.rows.length > 0 ? 'Existe' : 'No existe');
    
    if (columnCheck.rows.length > 0) {
      console.log(`  Tipo: ${columnCheck.rows[0].data_type}`);
    }
    
    // Contar usuarios
    const count = await pool.query('SELECT COUNT(*) as total FROM usuarios_empresas');
    console.log(`\n📊 Total usuarios en tabla: ${count.rows[0].total}`);
    
    pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    pool.end();
  }
}

verify();
