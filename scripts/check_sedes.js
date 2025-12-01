const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:1234@localhost:5432/inticorp', connectionTimeoutMillis: 2000 });
(async () => {
  try {
    const res = await pool.query('SELECT id, empresa_id, nombre FROM sedes ORDER BY id DESC LIMIT 20');
    console.log('sedes:', res.rows);
  } catch (err) {
    console.error('err', err);
  } finally {
    await pool.end();
  }
})();
