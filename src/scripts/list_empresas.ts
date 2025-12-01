import { pool } from "../config/db";
(async () => {
  try {
    const res = await pool.query('SELECT id, nombre FROM empresas ORDER BY id LIMIT 20');
    console.log('Empresas:', res.rows);
    process.exit(0);
  } catch (err: any) {
    console.error('Error querying empresas:', err && (err.stack || err));
    process.exit(1);
  }
})();
