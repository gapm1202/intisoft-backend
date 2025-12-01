import { pool } from "../config/db";

const empresas = [
  "Imer",
  "Bametsa",
  "Monstruos",
  "Obrasin Tradesur",
  "Huancatex",
  "Belts",
];

async function run() {
  try {
    // Crear tabla si no existe
    await pool.query(`CREATE TABLE IF NOT EXISTS empresas (
      id SERIAL PRIMARY KEY,
      nombre VARCHAR(255) NOT NULL UNIQUE,
      creado_en TIMESTAMP WITH TIME ZONE DEFAULT now()
    )`);

    for (const nombre of empresas) {
      // Insertar solo si no existe
      await pool.query(
        `INSERT INTO empresas (nombre) VALUES ($1) ON CONFLICT (nombre) DO NOTHING`,
        [nombre]
      );
    }

    const res = await pool.query("SELECT id, nombre FROM empresas ORDER BY id");
    console.log("Empresas en la BD:", res.rows);
    process.exit(0);
  } catch (err) {
    console.error("Error seed empresas:", err);
    process.exit(1);
  }
}

run();
