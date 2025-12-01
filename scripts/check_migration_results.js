const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  try {
    console.log('Using DATABASE_URL:', process.env.DATABASE_URL ? '[REDACTED]' : 'not set');
    const dbInfo = await pool.query("SELECT current_database() AS db, current_user AS user");
    console.log('Connected DB info:', dbInfo.rows[0]);
    console.log('Checking migration audit table: migration_inventario_usuario_asignado_invalid');
    const res1 = await pool.query('SELECT count(*) AS cnt FROM migration_inventario_usuario_asignado_invalid');
    console.log('Invalid rows count:', res1.rows[0].cnt);

    const res2 = await pool.query('SELECT id, usuario_asignado, migrated_at FROM migration_inventario_usuario_asignado_invalid ORDER BY migrated_at DESC LIMIT 50');
    console.log('Sample invalid rows (up to 50):');
    console.log(JSON.stringify(res2.rows, null, 2));

    console.log('\nChecking recent inventario rows...');
    const res3 = await pool.query(`SELECT id, asset_id, usuarios_asignados, campos_personalizados, campos_personalizados_array, fotos, fecha_fin_garantia FROM inventario ORDER BY id DESC LIMIT 20`);
    console.log('Recent inventario rows (up to 20):');
    console.log(JSON.stringify(res3.rows, null, 2));
  } catch (err) {
    console.error('Error running checks:', err && (err.stack || err));
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
