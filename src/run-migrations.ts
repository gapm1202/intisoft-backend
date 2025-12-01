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

  try {
    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      console.log(`Applying migration: ${file}`);
      const sql = fs.readFileSync(filePath, { encoding: 'utf8' });
      await pool.query(sql);
      console.log(`Applied: ${file}`);
    }
    console.log("All migrations applied successfully");
    process.exit(0);
  } catch (err: any) {
    console.error("Migration failed:", err.message || err);
    process.exit(1);
  }
}

runMigrations();
