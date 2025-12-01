import { pool } from "../config/db";
(async () => {
  try {
    const res = await pool.query('SELECT id, nombre, empresa_id FROM sedes ORDER BY id LIMIT 50');
    console.log('Sedes:', res.rows);
    process.exit(0);
  } catch (err: any) {
    console.error('Error querying sedes:', err && (err.stack || err));
    process.exit(1);
  }
})();
