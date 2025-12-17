const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

(async () => {
  try {
    // Migración 047: Agregar columna tipo_accion
    await pool.query(`
      ALTER TABLE contract_history ADD COLUMN IF NOT EXISTS tipo_accion VARCHAR(30)
    `);
    console.log('✅ Columna tipo_accion agregada');
    
    await pool.query(`
      ALTER TABLE contract_history DROP CONSTRAINT IF EXISTS history_tipo_accion_check
    `);
    console.log('✅ Constraint anterior eliminado (si existía)');
    
    await pool.query(`
      ALTER TABLE contract_history ADD CONSTRAINT history_tipo_accion_check 
        CHECK (tipo_accion IS NULL OR tipo_accion IN ('ELIMINACION','CREACION','EDICION'))
    `);
    console.log('✅ Nuevo constraint aplicado');
    console.log('✅ Migración 047 completada exitosamente');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
