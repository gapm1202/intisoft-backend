#!/usr/bin/env node

/**
 * Script para reparar/sincronizar las secuencias de códigos de activos
 * Ajusta next_number para que siempre sea mayor al máximo código usado
 */

const { Pool } = require('pg');

require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:1234@localhost:5432/inticorp'
});

async function repararSecuencias() {
  console.log('🔧 Reparando secuencias de códigos de activos\n');
  console.log('=' .repeat(80));
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Obtener todas las secuencias
    const result = await client.query(`
      SELECT 
        s.id,
        s.empresa_id,
        s.categoria_id,
        s.next_number,
        e.nombre as empresa_nombre,
        e.codigo as empresa_codigo,
        c.nombre as categoria_nombre,
        c.codigo as categoria_codigo
      FROM activos_codigo_sequence s
      JOIN empresas e ON s.empresa_id = e.id
      JOIN categorias c ON s.categoria_id = c.id
      ORDER BY e.nombre, c.nombre
    `);

    if (result.rows.length === 0) {
      console.log('⚠️  No hay secuencias para reparar\n');
      await client.query('ROLLBACK');
      return;
    }

    let totalReparados = 0;

    for (const seq of result.rows) {
      console.log(`\n📊 ${seq.empresa_nombre} - ${seq.categoria_nombre}`);
      
      // Obtener el máximo código usado
      const pattern = `^${seq.empresa_codigo}-${seq.categoria_codigo}[0-9]{4}$`;
      
      const maxResult = await client.query(`
        SELECT 
          COALESCE(
            MAX(
              CAST(
                substring(asset_id from '[0-9]+$')
                AS INTEGER
              )
            ), 
            0
          ) as max_num
        FROM inventario
        WHERE empresa_id = $1 
          AND LOWER(categoria) = LOWER($2)
          AND asset_id ~ $3
      `, [seq.empresa_id, seq.categoria_nombre, pattern]);

      const maxNum = maxResult.rows[0]?.max_num || 0;
      const nuevoNextNumber = Math.max(seq.next_number, maxNum + 1);

      console.log(`   Actual next_number: ${seq.next_number}`);
      console.log(`   Máximo código usado: ${maxNum}`);
      console.log(`   Nuevo next_number: ${nuevoNextNumber}`);

      if (nuevoNextNumber !== seq.next_number) {
        await client.query(`
          UPDATE activos_codigo_sequence 
          SET next_number = $1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [nuevoNextNumber, seq.id]);

        console.log(`   ✅ REPARADO: ${seq.next_number} → ${nuevoNextNumber}`);
        totalReparados++;
      } else {
        console.log(`   ✓ OK: No requiere reparación`);
      }
    }

    await client.query('COMMIT');

    console.log('\n' + '='.repeat(80));
    console.log(`\n📈 Resumen:`);
    console.log(`   Total verificados: ${result.rows.length}`);
    console.log(`   Reparados: ${totalReparados}`);
    
    if (totalReparados > 0) {
      console.log(`\n✅ Secuencias reparadas correctamente`);
      console.log(`   Los códigos ya no se reutilizarán después de eliminaciones.`);
    } else {
      console.log(`\n✅ Todas las secuencias estaban correctas`);
    }

    process.exit(0);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Error durante la reparación:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Ejecutar
repararSecuencias();
