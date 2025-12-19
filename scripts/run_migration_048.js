require('dotenv').config();

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('🔄 Ejecutando migración 048 - Creación de tablas SLA...');

    // Verificar que empresas existe
    try {
      await client.query('SELECT 1 FROM empresas LIMIT 1');
    } catch (err) {
      console.error('❌ Error: Tabla "empresas" no existe. Por favor, ejecute las migraciones previas primero.');
      process.exit(1);
    }

    const sqlPath = path.join(__dirname, '../src/migrations/048_create_sla_tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Ejecutar el SQL línea por línea (dividir por ;)
    const statements = sql.split(';').filter(stmt => stmt.trim());
    for (const statement of statements) {
      if (statement.trim()) {
        await client.query(statement);
      }
    }

    console.log('✅ Migración 048 completada exitosamente');
  } catch (error) {
    console.error('❌ Error en migración 048:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
