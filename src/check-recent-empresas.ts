import { pool } from "./config/db";

(async () => {
  try {
    const res = await pool.query('SELECT id, nombre, ruc, codigo_cliente FROM empresas ORDER BY id DESC LIMIT 5');
    console.log('Recent empresas:');
    console.log(JSON.stringify(res.rows, null, 2));
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
})();
