import { pool } from "./config/db";
import fs from "fs";
import path from "path";

async function runMigrations() {
  const migrationsDir = path.join(__dirname, "migrations");
  if (!fs.existsSync(migrationsDir)) {
    console.log("No migrations folder found, skipping");
    process.exit(0);
  }

  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
  if (files.length === 0) {
    console.log("No SQL migration files found, skipping");
    process.exit(0);
  }

  let failures = 0;
  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    console.log(`Applying migration: ${file}`);
    const sql = fs.readFileSync(filePath, { encoding: 'utf8' });
    try {
      await pool.query(sql);
      console.log(`Applied: ${file}`);
    } catch (err: any) {
      failures++;
      console.warn(`Migration failed for ${file}:`, err && (err.message || err));
      // Continue to next migration
    }
  }
  if (failures > 0) {
    console.warn(`Migrations completed with ${failures} failure(s)`);
  } else {
    console.log("All migrations applied successfully");
  }
  process.exit(0);
}

runMigrations();
