const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('ERROR: DATABASE_URL environment variable is not set.');
    process.exit(2);
  }

  const sqlPath = path.join(__dirname, '..', 'src', 'migrations', '035_create_reporte_tables.sql');
  if (!fs.existsSync(sqlPath)) {
    console.error('ERROR: migration file not found:', sqlPath);
    process.exit(3);
  }

  const sql = fs.readFileSync(sqlPath, 'utf8');
  const client = new Client({ connectionString: databaseUrl });

  try {
    console.log('Connecting to database...');
    await client.connect();

    // Idempotency check: if tables already exist, skip applying the SQL
    const chk = await client.query("SELECT to_regclass('public.reporte_usuario') AS r1, to_regclass('public.reporte_adjuntos') AS r2");
    const exists1 = chk.rows[0] && chk.rows[0].r1;
    const exists2 = chk.rows[0] && chk.rows[0].r2;
    if (exists1 && exists2) {
      console.log('Migration 035: tables already exist, skipping.');
      return process.exit(0);
    }

    console.log('Starting transaction and executing migration file:', sqlPath);
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('Migration 035 applied successfully.');
  } catch (err) {
    console.error('Migration failed:', err && err.message ? err.message : err);
    try {
      await client.query('ROLLBACK');
      console.log('Rolled back transaction.');
    } catch (rbErr) {
      console.error('Rollback failed:', rbErr && rbErr.message ? rbErr.message : rbErr);
    }
    process.exit(1);
  } finally {
    await client.end().catch(() => {});
  }
}

main();
