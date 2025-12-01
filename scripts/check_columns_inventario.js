const { Pool } = require('pg');
require('dotenv').config();

(async ()=>{
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try{
    const cols = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='inventario' ORDER BY ordinal_position");
    console.log('inventario columns:' );
    console.table(cols.rows);
    await pool.end();
  }catch(e){
    console.error('ERROR:', e && (e.stack||e));
    process.exit(1);
  }
})();
