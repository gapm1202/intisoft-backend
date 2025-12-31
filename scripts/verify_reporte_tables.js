require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
    console.log('🔍 Verificando estructura de tabla reporte_usuario...\n');
    
    // Verificar columnas
    const columnsQuery = `
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'reporte_usuario'
      ORDER BY ordinal_position;
    `;
    
    const cols = await pool.query(columnsQuery);
    
    if (cols.rows.length === 0) {
      console.log('❌ La tabla reporte_usuario NO existe!');
      console.log('   Ejecuta: node scripts/run_migration_035.js');
      await pool.end();
      process.exit(1);
    }
    
    console.log('📋 Columnas de reporte_usuario:');
    cols.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) DEFAULT: ${col.column_default || 'NULL'}`);
    });
    
    // Verificar secuencia
    console.log('\n🔢 Verificando secuencia id...');
    const seqQuery = `
      SELECT pg_get_serial_sequence('reporte_usuario', 'id') as sequence_name;
    `;
    
    const seq = await pool.query(seqQuery);
    const sequenceName = seq.rows[0]?.sequence_name;
    
    if (!sequenceName) {
      console.log('❌ La columna id NO tiene secuencia asociada!');
      console.log('   Ejecuta el siguiente SQL para corregir:');
      console.log(`
      CREATE SEQUENCE IF NOT EXISTS reporte_usuario_id_seq;
      ALTER TABLE reporte_usuario ALTER COLUMN id SET DEFAULT nextval('reporte_usuario_id_seq');
      ALTER SEQUENCE reporte_usuario_id_seq OWNED BY reporte_usuario.id;
      SELECT setval('reporte_usuario_id_seq', COALESCE((SELECT MAX(id) FROM reporte_usuario), 1));
      `);
    } else {
      console.log(`✅ Secuencia encontrada: ${sequenceName}`);
      
      // Verificar valor actual de la secuencia
      const seqValQuery = `SELECT last_value FROM ${sequenceName}`;
      const seqVal = await pool.query(seqValQuery);
      console.log(`   Último valor: ${seqVal.rows[0]?.last_value || 0}`);
    }
    
    // Probar INSERT
    console.log('\n🧪 Probando INSERT...');
    try {
      const testInsert = `
        INSERT INTO reporte_usuario (
          asset_id, reporter_user_id, reporter_name, reporter_email, 
          description, operational, anydesk, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        RETURNING id
      `;
      
      const result = await pool.query(testInsert, [
        'TEST-001',
        null,
        'Test User',
        'test@example.com',
        'Test description',
        'Sí',
        '123456789'
      ]);
      
      console.log(`✅ INSERT exitoso! ID generado: ${result.rows[0].id}`);
      
      // Eliminar registro de prueba
      await pool.query('DELETE FROM reporte_usuario WHERE id = $1', [result.rows[0].id]);
      console.log('   (registro de prueba eliminado)');
      
    } catch (insertError) {
      console.log('❌ Error en INSERT:', insertError.message);
      console.log('   Detalle:', insertError.detail || 'N/A');
    }
    
    await pool.end();
    console.log('\n✅ Verificación completa');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
})();
