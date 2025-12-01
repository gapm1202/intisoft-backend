import { pool } from "./config/db";

async function testConnection() {
  try {
    console.log("🔍 Intentando conectar a:", process.env.DATABASE_URL);
    const result = await pool.query("SELECT version()");
    console.log("✅ Conexión exitosa!");
    console.log("PostgreSQL version:", result.rows[0].version);
    
    // Intentar consultar usuarios
    const usuarios = await pool.query("SELECT * FROM usuarios");
    console.log("✅ Tabla usuarios encontrada con", usuarios.rows.length, "registros");
    console.log("Usuarios:", usuarios.rows);
    
    process.exit(0);
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    console.error("Detalles:", error.code);
    process.exit(1);
  }
}

testConnection();
