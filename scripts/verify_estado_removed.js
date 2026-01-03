require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function test() {
  try {
    // Consultar una empresa
    const empresaRes = await pool.query('SELECT * FROM empresas LIMIT 1');
    
    console.log('\n📋 Verificación: Columna estado_contrato eliminada\n');
    
    if (empresaRes.rows.length > 0) {
      const empresa = empresaRes.rows[0];
      console.log('Empresa encontrada:');
      console.log('  id:', empresa.id);
      console.log('  nombre:', empresa.nombre);
      console.log('  estado_contrato:', empresa.estado_contrato);
      
      if (empresa.estado_contrato === undefined) {
        console.log('\n✅ CORRECTO: Columna estado_contrato NO existe en tabla empresas');
      } else {
        console.log('\n❌ ERROR: Columna estado_contrato todavía existe:', empresa.estado_contrato);
      }
      
      // Verificar columnas de la tabla
      const columnsRes = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'empresas' 
        ORDER BY ordinal_position
      `);
      
      console.log('\n📋 Columnas en tabla empresas:');
      columnsRes.rows.forEach(row => {
        console.log(`   - ${row.column_name}`);
      });
      
      const hasEstadoContrato = columnsRes.rows.some(r => r.column_name === 'estado_contrato');
      if (!hasEstadoContrato) {
        console.log('\n✅ VERIFICACIÓN FINAL: estado_contrato eliminado correctamente\n');
      } else {
        console.log('\n❌ ERROR: estado_contrato todavía está en la tabla\n');
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

test();
