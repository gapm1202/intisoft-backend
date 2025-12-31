require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'reporte%'
      ORDER BY table_name
    `);
    
    console.log('✅ Tablas de reporte encontradas:');
    result.rows.forEach(row => {
      console.log('  -', row.table_name);
    });
    
    if (result.rows.length === 0) {
      console.log('❌ No se encontraron tablas de reporte');
    }
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
