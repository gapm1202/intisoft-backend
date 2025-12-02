require('dotenv').config();
const { Pool } = require('pg');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL not set. Please set it in .env or env.');
  process.exit(2);
}

const pool = new Pool({ connectionString });
const LOG_DIR = path.resolve(process.cwd(), 'logs');
const OUT_LOG = path.join(LOG_DIR, 'generated_tokens.log');
try { fs.mkdirSync(LOG_DIR, { recursive: true }); } catch(e){}

(async () => {
  const client = await pool.connect();
  try {
    console.log('Querying activos without etiqueta_token...');
    const res = await client.query("SELECT id, asset_id FROM inventario WHERE etiqueta_token IS NULL OR etiqueta_token = ''");
    const rows = res.rows;
    console.log(`Found ${rows.length} activos without token.`);
    if (rows.length === 0) process.exit(0);

    const results = [];
    for (const r of rows) {
      const id = r.id;
      let token = crypto.randomBytes(32).toString('hex');
      // Try to set token only if still null/empty (avoid race)
      let attempts = 0;
      while (attempts < 5) {
        try {
          const upd = await client.query("UPDATE inventario SET etiqueta_token = $1, updated_at = NOW() WHERE id = $2 AND (etiqueta_token IS NULL OR etiqueta_token = '') RETURNING id", [token, id]);
          if (upd.rowCount === 1) {
            results.push({ id, assetId: r.asset_id, token });
            fs.appendFileSync(OUT_LOG, JSON.stringify({ ts: new Date().toISOString(), id, assetId: r.asset_id, token }) + '\n');
            break;
          } else {
            // maybe another process set it; fetch current
            const cur = await client.query('SELECT etiqueta_token FROM inventario WHERE id = $1 LIMIT 1', [id]);
            const existing = cur.rows[0] && cur.rows[0].etiqueta_token ? cur.rows[0].etiqueta_token : null;
            if (existing) {
              results.push({ id, assetId: r.asset_id, token: existing, note: 'already set by others' });
              break;
            }
            // else collision? regenerate
            token = crypto.randomBytes(32).toString('hex');
          }
        } catch (err) {
          // possible unique constraint violation if token exists; regenerate and retry
          if (err && err.code === '23505') {
            token = crypto.randomBytes(32).toString('hex');
            attempts++;
            continue;
          }
          throw err;
        }
      }
    }

    console.log(`Completed. Generated/confirmed tokens for ${results.length} activos.`);
    console.log('Sample:', results.slice(0,10));
    process.exit(0);
  } catch (err) {
    console.error('Error generating tokens:', err && (err.stack || err));
    process.exit(3);
  } finally {
    client.release();
    await pool.end();
  }
})();
