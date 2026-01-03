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
    console.log('✅ Connected to database');

    const sqlPath = path.join(__dirname, '..', 'migrations', '056_remove_tipo_ticket_from_catalogo.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('\n📝 Executing migration 056: Remove tipo_ticket from catalogo tables...\n');
    
    const result = await client.query(sql);
    
    console.log('\n✅ Migration executed successfully!');
    console.log('\n📊 Results:');
    if (result && result.rows && result.rows.length > 0) {
      console.log(result.rows[0]);
    }

    // Verify columns were dropped
    console.log('\n🔍 Verifying changes...');
    
    const checkCategorias = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'catalogo_categorias' AND column_name = 'tipo_ticket'
    `);
    
    const checkSubcategorias = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'catalogo_subcategorias' AND column_name IN ('tipo_ticket', 'hereda_tipo')
    `);

    if (checkCategorias.rows.length === 0) {
      console.log('✅ tipo_ticket removed from catalogo_categorias');
    } else {
      console.log('❌ tipo_ticket still exists in catalogo_categorias');
    }

    if (checkSubcategorias.rows.length === 0) {
      console.log('✅ tipo_ticket and hereda_tipo removed from catalogo_subcategorias');
    } else {
      console.log('❌ Some columns still exist:', checkSubcategorias.rows);
    }

    console.log('\n✅ Migration 056 completed successfully!\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

runMigration();
