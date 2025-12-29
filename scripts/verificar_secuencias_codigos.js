#!/usr/bin/env node

/**
 * Script para verificar que las secuencias de códigos de activos estén sincronizadas
 * y no haya riesgo de reutilización de códigos eliminados
 */

const { Pool } = require('pg');

// Configuración de base de datos desde .env
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:1234@localhost:5432/inticorp'
});

async function verificarSecuencias() {
  console.log('🔍 Verificando sincronización de secuencias de códigos de activos\n');
  console.log('=' .repeat(80));
  
  try {
    // Obtener todas las secuencias
    const result = await pool.query(`
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
      console.log('⚠️  No hay secuencias configuradas aún\n');
      return;
    }

    let totalProblemas = 0;
    let totalVerificados = 0;

    for (const seq of result.rows) {
      totalVerificados++;
      
      console.log(`\n📊 ${seq.empresa_nombre} - ${seq.categoria_nombre}`);
      console.log(`   Código esperado: ${seq.empresa_codigo}-${seq.categoria_codigo}XXXX`);
      console.log(`   Próximo número: ${seq.next_number}`);

      // Obtener el máximo código usado en inventario  
      const pattern = `^${seq.empresa_codigo}-${seq.categoria_codigo}[0-9]{4}$`;
      
      const maxResult = await pool.query(`
        SELECT 
          COALESCE(
            MAX(
              CAST(
                substring(asset_id from '[0-9]+$')
                AS INTEGER
              )
            ), 
            0
          ) as max_num,
          COUNT(*) as total_activos
        FROM inventario
        WHERE empresa_id = $1 
          AND LOWER(categoria) = LOWER($2)
          AND asset_id ~ $3
      `, [seq.empresa_id, seq.categoria_nombre, pattern]);

      const maxNum = maxResult.rows[0]?.max_num || 0;
      const totalActivos = maxResult.rows[0]?.total_activos || 0;

      console.log(`   Activos existentes: ${totalActivos}`);
      console.log(`   Máximo número usado: ${maxNum}`);

      // Verificar que next_number sea mayor al máximo usado
      if (seq.next_number <= maxNum) {
        console.log(`   ❌ PROBLEMA: next_number (${seq.next_number}) <= max usado (${maxNum})`);
        console.log(`   ⚠️  RIESGO: El próximo código (${seq.empresa_codigo}-${seq.categoria_codigo}${String(seq.next_number).padStart(4, '0')}) podría estar duplicado!`);
        totalProblemas++;

        // Sugerir corrección
        console.log(`   💡 Corrección sugerida: UPDATE activos_codigo_sequence SET next_number = ${maxNum + 1} WHERE id = ${seq.id};`);
      } else {
        console.log(`   ✅ OK: Secuencia correcta (${seq.next_number} > ${maxNum})`);
        
        // Verificar si hay gaps (códigos eliminados)
        const gap = seq.next_number - maxNum - 1;
        if (gap > 0) {
          console.log(`   📝 Info: ${gap} código(s) eliminado(s) o reservado(s) no confirmado(s)`);
        }
      }

      // Listar códigos existentes para esta empresa/categoría
      const pattern2 = `^${seq.empresa_codigo}-${seq.categoria_codigo}[0-9]{4}$`;
      
      const activosResult = await pool.query(`
        SELECT asset_id
        FROM inventario
        WHERE empresa_id = $1 
          AND LOWER(categoria) = LOWER($2)
          AND asset_id ~ $3
        ORDER BY asset_id
      `, [seq.empresa_id, seq.categoria_nombre, pattern2]);

      if (activosResult.rows.length > 0 && activosResult.rows.length <= 10) {
        console.log(`   📄 Códigos existentes: ${activosResult.rows.map(r => r.asset_id).join(', ')}`);
      } else if (activosResult.rows.length > 10) {
        const primeros = activosResult.rows.slice(0, 3).map(r => r.asset_id).join(', ');
        const ultimos = activosResult.rows.slice(-3).map(r => r.asset_id).join(', ');
        console.log(`   📄 Códigos existentes: ${primeros} ... ${ultimos} (${activosResult.rows.length} total)`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log(`\n📈 Resumen:`);
    console.log(`   Total verificados: ${totalVerificados}`);
    console.log(`   Problemas encontrados: ${totalProblemas}`);
    
    if (totalProblemas > 0) {
      console.log(`\n⚠️  ACCIÓN REQUERIDA: ${totalProblemas} secuencia(s) necesita(n) corrección`);
      console.log(`   Ejecuta las correcciones sugeridas arriba o usa el script de reparación automática.`);
      process.exit(1);
    } else {
      console.log(`\n✅ Todas las secuencias están correctamente sincronizadas`);
      console.log(`   No hay riesgo de reutilización de códigos eliminados.`);
      process.exit(0);
    }

  } catch (error) {
    console.error('\n❌ Error durante la verificación:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Ejecutar
verificarSecuencias();
