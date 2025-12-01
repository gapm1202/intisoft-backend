const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:1234@localhost:5432/inticorp', connectionTimeoutMillis: 2000 });
(async () => {
  try {
    const res = await pool.query('SELECT * FROM inventario ORDER BY id DESC LIMIT 50');
    console.log('inventario rows count:', res.rows.length);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error('Error querying inventario:', err);
  } finally {
    await pool.end();
  }
})();
