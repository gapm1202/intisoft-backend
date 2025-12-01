import { pool } from "./config/db";

async function run() {
  try {
    const name = 'pruebaaaee';
    const res = await pool.query('SELECT * FROM empresas WHERE nombre = $1', [name]);
    if (res.rows.length === 0) {
      console.log('No rows found for', name);
      process.exit(0);
    }
    console.log('Row:');
    console.dir(res.rows[0], { depth: null });
    process.exit(0);
  } catch (err: any) {
    console.error('Error:', err.message || err);
    process.exit(1);
  }
}

run();
