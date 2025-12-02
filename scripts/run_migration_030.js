require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const MIGRATION = path.resolve(__dirname, '..', 'src', 'migrations', '030_add_etiqueta_token.sql');
if (!fs.existsSync(MIGRATION)) {
  console.error('Migration file not found:', MIGRATION);
  process.exit(2);
}

const sql = fs.readFileSync(MIGRATION, 'utf8');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL not set in environment. Please set it in your shell or .env file.');
  process.exit(3);
}

const pool = new Pool({ connectionString });

(async () => {
  const client = await pool.connect();
  try {
    console.log('Running migration:', MIGRATION);
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('Migration executed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    try { await client.query('ROLLBACK'); } catch(e){}
    process.exit(4);
  } finally {
    client.release();
    await pool.end();
  }
})();
