const { Pool } = require('pg');
const connectionString = 'postgresql://postgres:1234@localhost:5432/inticorp';
(async () => {
  // set a short connection timeout to fail fast if DB is not reachable
  const pool = new Pool({ connectionString, connectionTimeoutMillis: 2000 });
  try {
    const res = await pool.query(`SELECT id, empresa_id, sede_id, asset_id, campos_dinamicos, created_at FROM activos ORDER BY id DESC LIMIT 10`);
    console.log('activos rows:', JSON.stringify(res.rows, null, 2));
    const empresas = await pool.query(`SELECT id, nombre FROM empresas ORDER BY id LIMIT 10`);
    console.log('empresas rows:', JSON.stringify(empresas.rows, null, 2));
  } catch (err) {
    console.error('DB error:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
