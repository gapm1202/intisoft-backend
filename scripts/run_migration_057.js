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
      path.join(__dirname, '../migrations/057_create_tipos_ticket.sql'),
      'utf8'
    );

    console.log('Ejecutando migración 057: crear tabla tipos_ticket...');
    await client.query(sql);
    console.log('✅ Migración 057 completada exitosamente');

    // Verificar
    const result = await client.query(`
      SELECT id, nombre, descripcion, activo 
      FROM tipos_ticket 
      ORDER BY nombre
    `);
    console.log('\n📋 Tipos de ticket creados:');
    result.rows.forEach(row => {
      console.log(`  - ${row.nombre} (${row.activo ? 'activo' : 'inactivo'})`);
    });
  } catch (error) {
    console.error('❌ Error en migración:', error);
    throw error;
  } finally {
    await client.end();
  }
}

runMigration();
