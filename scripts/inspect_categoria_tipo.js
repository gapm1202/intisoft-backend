const { Pool } = require('pg');
require('dotenv').config();
const db = new Pool({ connectionString: process.env.DATABASE_URL });
(async function(){
  const id = process.argv[2] || 25;
  const r = await db.query('SELECT id, codigo, nombre, tipo_ticket FROM catalogo_categorias WHERE id = $1', [id]);
  console.log('CATEGORY ROW:', r.rows[0]);
  await db.end();
})();