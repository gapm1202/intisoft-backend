import { pool } from '../config/db';

async function check() {
  const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='inventario' AND column_name='condicion_fisica'");
  console.log('rows:', res.rows);
  process.exit(0);
}

check().catch(err => { console.error(err); process.exit(1); });
