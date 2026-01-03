require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos');

    const sql = fs.readFileSync(
      path.join(__dirname, '../migrations/058_remove_gestion_incidentes.sql'),
      'utf8'
    );

    console.log('Ejecutando migración 058: eliminar columna gestion_incidentes...');
    await client.query(sql);
    console.log('✅ Migración 058 completada exitosamente');

    // Verificar estructura
    const result = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'sla_configuracion' 
      ORDER BY ordinal_position
    `);
    console.log('\n📋 Columnas actuales en sla_configuracion:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}`);
    });
  } catch (error) {
    console.error('❌ Error en migración:', error);
    throw error;
  } finally {
    await client.end();
  }
}

runMigration();
