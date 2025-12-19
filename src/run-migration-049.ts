import { pool } from "./config/db";
import fs from "fs";
import path from "path";

async function runSingleMigration() {
  const migrationFile = path.join(__dirname, "migrations", "049_add_completo_to_historial_sla_check.sql");
  
  try {
    console.log(`Applying migration: 049_add_completo_to_historial_sla_check.sql`);
    const sql = fs.readFileSync(migrationFile, { encoding: 'utf8' });
    await pool.query(sql);
    console.log(`✅ Applied successfully`);
    process.exit(0);
  } catch (err: any) {
    console.error("❌ Migration failed:", err.message || err);
    process.exit(1);
  }
}

runSingleMigration();
