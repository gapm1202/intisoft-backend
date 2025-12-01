import { pool } from '../config/db';

async function runCheck() {
  const checkQuery = `
WITH parsed AS (
  SELECT
    id,
    asset_id,
    regexp_replace(asset_id, '^([A-Za-z]+)-?0*([0-9]+)$', '\\1') AS prefix,
    regexp_replace(asset_id, '^([A-Za-z]+)-?0*([0-9]+)$', '\\2') AS num
  FROM inventario
  WHERE asset_id ~ '^[A-Za-z]+-?\\d+$'
)
SELECT
  prefix || '-' || lpad(num, 4, '0') AS normalized_asset,
  COUNT(*) AS count_examples,
  array_agg(id) AS ids,
  array_agg(asset_id) AS examples
FROM parsed
GROUP BY normalized_asset
ORDER BY count_examples DESC;
`;
  const res = await pool.query(checkQuery);
  return res.rows;
}

async function applyNormalization(dryRun = true) {
  // create mapping
  const mappingQuery = `
WITH parsed AS (
  SELECT
    id,
    asset_id,
    regexp_replace(asset_id, '^([A-Za-z]+)-?0*([0-9]+)$', '\\1') AS prefix,
    regexp_replace(asset_id, '^([A-Za-z]+)-?0*([0-9]+)$', '\\2') AS num
  FROM inventario
  WHERE asset_id ~ '^[A-Za-z]+-?\\d+$'
)
SELECT p.id, p.asset_id, (p.prefix || '-' || lpad(p.num,4,'0')) AS normalized
FROM parsed p;
`;
  const mapping = await pool.query(mappingQuery);
  console.log('Mapping preview (first 20):');
  console.table(mapping.rows.slice(0, 20));

  if (dryRun) {
    console.log('Dry run mode: no changes applied. Use --apply to perform updates.');
    return mapping.rows;
  }

  // Apply: create mapping table and update in transaction
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // create mapping table if not exists
    await client.query(`CREATE TABLE IF NOT EXISTS asset_id_mapping (id INTEGER PRIMARY KEY, old_asset_id VARCHAR, new_asset_id VARCHAR, changed_at TIMESTAMP DEFAULT NOW())`);
    // insert into mapping
    await client.query(`
INSERT INTO asset_id_mapping (id, old_asset_id, new_asset_id)
SELECT p.id, p.asset_id, (p.prefix || '-' || lpad(p.num,4,'0'))
FROM (
  SELECT id, asset_id, regexp_replace(asset_id, '^([A-Za-z]+)-?0*([0-9]+)$', '\\1') AS prefix,
         regexp_replace(asset_id, '^([A-Za-z]+)-?0*([0-9]+)$', '\\2') AS num
  FROM inventario
  WHERE asset_id ~ '^[A-Za-z]+-?\\d+$'
) p
ON CONFLICT (id) DO UPDATE SET old_asset_id = EXCLUDED.old_asset_id, new_asset_id = EXCLUDED.new_asset_id, changed_at = now();
`);
    // perform update
    const updateRes = await client.query(`
WITH parsed AS (
  SELECT
    id,
    asset_id,
    regexp_replace(asset_id, '^([A-Za-z]+)-?0*([0-9]+)$', '\\1') AS prefix,
    regexp_replace(asset_id, '^([A-Za-z]+)-?0*([0-9]+)$', '\\2') AS num
  FROM inventario
  WHERE asset_id ~ '^[A-Za-z]+-?\\d+$'
)
UPDATE inventario i
SET asset_id = p.prefix || '-' || lpad(p.num, 4, '0')
FROM parsed p
WHERE i.id = p.id
  AND i.asset_id IS DISTINCT FROM (p.prefix || '-' || lpad(p.num,4,'0'))
RETURNING i.id, i.asset_id;
`);
    console.log('Updated rows count:', updateRes.rowCount);
    await client.query('COMMIT');
    return updateRes.rows;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function createIndex() {
  // Create unique index concurrently
  try {
    console.log('Creating UNIQUE INDEX CONCURRENTLY idx_inventario_asset_id_unique ON inventario(asset_id)');
    await pool.query("CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_inventario_asset_id_unique ON inventario (asset_id);");
    console.log('Index created (or already exists)');
  } catch (err: any) {
    console.error('Error creating index:', err.message || err);
    throw err;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const checkOnly = args.includes('--check') || args.includes('--check-only');
  const apply = args.includes('--apply');
  const createIdx = args.includes('--create-index');

  try {
    console.log('Running asset_id normalization script');
    const rows = await runCheck();
    const collisions = rows.filter((r: any) => parseInt(r.count_examples, 10) > 1);
    console.log(`Total distinct normalized candidates: ${rows.length}`);
    if (collisions.length > 0) {
      console.warn('Found potential collisions (normalized values with multiple rows):');
      collisions.forEach((c: any) => {
        console.warn(`- ${c.normalized_asset}: count=${c.count_examples} ids=${c.ids}`);
      });
    } else {
      console.log('No collisions detected. Safe to normalize.');
    }

    if (checkOnly) {
      process.exit(collisions.length > 0 ? 2 : 0);
    }

    if (apply) {
      if (collisions.length > 0) {
        console.error('Aborting apply: collisions detected. Resolve them first.');
        process.exit(3);
      }
      const res = await applyNormalization(false);
      console.log('Normalization applied. Sample of changes:');
      console.table(res.slice(0, 20));
    }

    if (createIdx) {
      // create concurrently
      await createIndex();
    }

    if (!checkOnly && !apply && !createIdx) {
      console.log('No action requested. Use --check, --apply, or --create-index');
    }
  } catch (err: any) {
    console.error('Error:', err && (err.stack || err));
    process.exit(1);
  } finally {
    // pool.end() if needed
    // await pool.end();
  }
}

if (require.main === module) {
  main();
}
