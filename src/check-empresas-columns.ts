import { pool } from "./config/db";

async function checkColumns() {
  try {
    const sql = `
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'empresas'
      ORDER BY ordinal_position
    `;
    const res = await pool.query(sql);
    console.log('Columns in table empresas:');
    for (const row of res.rows) {
      console.log('-', row.column_name, '(', row.data_type, ')');
    }
    process.exit(0);
  } catch (err: any) {
    console.error('Error querying columns:', err.message || err);
    process.exit(1);
  }
}

checkColumns();
