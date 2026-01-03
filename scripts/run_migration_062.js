require('dotenv').config();
const { Client } = require('pg');

async function runMigration() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  
  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos');
    
    console.log('\n📋 Ejecutando migración 062: Crear catálogo de servicios...');
    
    const fs = require('fs');
    const migrationSQL = fs.readFileSync('./migrations/062_create_catalogo_servicios.sql', 'utf8');
    
    await client.query(migrationSQL);
    console.log('✅ Migración 062 completada exitosamente');
    
    // Verificar tablas creadas
    const tiposResult = await client.query(`
      SELECT COUNT(*) as count FROM tipos_servicio
    `);
    console.log(`\n📊 Tipos de servicio creados: ${tiposResult.rows[0].count}`);
    
    const tiposList = await client.query(`
      SELECT tipo, activo FROM tipos_servicio ORDER BY tipo
    `);
    console.log('\n📋 Tipos de servicio:');
    tiposList.rows.forEach(row => {
      console.log(`   - ${row.tipo} ${row.activo ? '✅' : '❌'}`);
    });
    
    const serviciosResult = await client.query(`
      SELECT COUNT(*) as count FROM servicios
    `);
    console.log(`\n📊 Servicios de ejemplo creados: ${serviciosResult.rows[0].count}`);
    
    const serviciosList = await client.query(`
      SELECT codigo, nombre, tipo_servicio, activo, visible_en_tickets 
      FROM servicios 
      ORDER BY codigo
    `);
    console.log('\n📋 Servicios creados:');
    serviciosList.rows.forEach(row => {
      console.log(`   - ${row.codigo}: ${row.nombre} (${row.tipo_servicio}) ${row.activo ? '✅' : '❌'} ${row.visible_en_tickets ? '👁️' : '🚫'}`);
    });
    
  } catch (error) {
    console.error('❌ Error en migración:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

runMigration();
