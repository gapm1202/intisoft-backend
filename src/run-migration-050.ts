import { pool } from "./config/db";
import fs from "fs";
import path from "path";

async function runSingleMigration() {
  const migrationFile = path.join(__dirname, "migrations", "050_fix_historial_sla_usuario_id_type.sql");
  
  try {
    console.log(`Applying migration: 050_fix_historial_sla_usuario_id_type.sql`);
    const sql = fs.readFileSync(migrationFile, { encoding: 'utf8' });
    await pool.query(sql);
    console.log(`✅ Applied successfully - usuario_id changed from UUID to INTEGER`);
    process.exit(0);
  } catch (err: any) {
    console.error("❌ Migration failed:", err.message || err);
    process.exit(1);
  }
}

runSingleMigration();
