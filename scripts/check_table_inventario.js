const { Pool } = require('pg');
require('dotenv').config();

(async ()=>{
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try{
    const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name");
    console.log('public tables:', tables.rows.map(r=>r.table_name).join(', '));
    const exists = await pool.query("SELECT to_regclass('public.inventario') as reg");
    console.log("to_regclass('public.inventario') =", exists.rows[0].reg);
    if (exists.rows[0].reg) {
      const cnt = await pool.query('SELECT COUNT(*) as c FROM inventario');
      console.log('inventario count =', cnt.rows[0].c);
      const sample = await pool.query('SELECT id, asset_id, fecha_fin_garantia, campos_personalizados, campos_personalizados_array, fotos, usuario_asignado FROM inventario ORDER BY id DESC LIMIT 3');
      console.log('latest rows:', sample.rows);
    }
    await pool.end();
  }catch(e){
    console.error('ERROR:', e && (e.stack||e));
    process.exit(1);
  }
})();
