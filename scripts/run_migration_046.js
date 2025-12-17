const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

(async () => {
  try {
    // Aplicar migración 046
    await pool.query(`
      ALTER TABLE contract_documents DROP CONSTRAINT IF EXISTS doc_tipo_check
    `);
    console.log('✅ Constraint eliminado');
    
    await pool.query(`
      ALTER TABLE contract_documents ADD CONSTRAINT doc_tipo_check 
        CHECK (tipo IN ('contrato_firmado','anexo','addenda','otro'))
    `);
    console.log('✅ Nuevo constraint aplicado');
    console.log('✅ Migración 046 completada exitosamente');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
