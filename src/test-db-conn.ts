import { pool } from "./config/db";

async function test() {
  console.log("Testing DB connection...");
  try {
    const result = await pool.query("SELECT 1");
    console.log("✅ DB connection OK:", result.rows[0]);
    process.exit(0);
  } catch (err: any) {
    console.error("❌ DB connection failed:", err.message);
    process.exit(1);
  }
}

test();
