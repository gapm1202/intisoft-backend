const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:1234@localhost:5432/inticorp' });
(async()=>{
  try{
    const r = await pool.query("SELECT id, asset_id FROM inventario WHERE asset_id LIKE 'LPT-%' ORDER BY id DESC");
    console.log('LPT rows:', JSON.stringify(r.rows, null, 2));
  }catch(e){console.error('err',e);}finally{await pool.end();}
})();