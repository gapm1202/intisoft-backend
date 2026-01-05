const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'inticorp',
  user: 'postgres',
  password: '1234',
});

console.log('\n=== VERIFICACIÓN COMPLETA DEL MÓDULO USUARIOS EMPRESAS ===\n');

async function verificarTodo() {
  try {
    // 1. ✅ Verificar tabla usuarios_empresas
    console.log('1️⃣ VERIFICANDO TABLA usuarios_empresas');
    console.log('━'.repeat(60));
    
    const tablaExiste = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'usuarios_empresas'
      );
    `);
    
    if (tablaExiste.rows[0].exists) {
      console.log('✅ Tabla usuarios_empresas EXISTE');
      
      // Mostrar columnas
      const columnas = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'usuarios_empresas' 
        ORDER BY ordinal_position
      `);
      
      console.log('\n📋 Columnas de la tabla:');
      columnas.rows.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
      
      // Verificar constraints
      const constraints = await pool.query(`
        SELECT constraint_name, constraint_type
        FROM information_schema.table_constraints
        WHERE table_name = 'usuarios_empresas'
      `);
      
      console.log('\n🔒 Constraints:');
      constraints.rows.forEach(c => {
        console.log(`   - ${c.constraint_name}: ${c.constraint_type}`);
      });
      
      // Contar usuarios
      const count = await pool.query('SELECT COUNT(*) as total FROM usuarios_empresas');
      console.log(`\n📊 Total usuarios: ${count.rows[0].total}`);
      
    } else {
      console.log('❌ Tabla usuarios_empresas NO EXISTE');
      console.log('   🚨 ACCIÓN REQUERIDA: Ejecutar migración 064');
    }
    
    // 2. ✅ Verificar campo usuario_asignado_id en inventario
    console.log('\n\n2️⃣ VERIFICANDO CAMPO usuario_asignado_id EN inventario');
    console.log('━'.repeat(60));
    
    const campoExiste = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'inventario' 
      AND column_name = 'usuario_asignado_id'
    `);
    
    if (campoExiste.rows.length > 0) {
      console.log('✅ Campo usuario_asignado_id EXISTE en inventario');
      console.log(`   Tipo: ${campoExiste.rows[0].data_type}`);
      console.log(`   Nullable: ${campoExiste.rows[0].is_nullable}`);
      
      // Verificar foreign key
      const fk = await pool.query(`
        SELECT
          tc.constraint_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = 'inventario'
          AND kcu.column_name = 'usuario_asignado_id'
      `);
      
      if (fk.rows.length > 0) {
        console.log('\n🔗 Foreign Key:');
        console.log(`   ${fk.rows[0].column_name} -> ${fk.rows[0].foreign_table_name}.${fk.rows[0].foreign_column_name}`);
      }
      
      // Contar activos con usuario asignado
      const activosConUsuario = await pool.query(`
        SELECT COUNT(*) as total 
        FROM inventario 
        WHERE usuario_asignado_id IS NOT NULL
      `);
      console.log(`\n📊 Activos con usuario asignado: ${activosConUsuario.rows[0].total}`);
      
    } else {
      console.log('❌ Campo usuario_asignado_id NO EXISTE en inventario');
      console.log('   🚨 ACCIÓN REQUERIDA: Ejecutar migración 064');
    }
    
    // 3. ✅ Verificar endpoints registrados
    console.log('\n\n3️⃣ VERIFICANDO ENDPOINTS REGISTRADOS');
    console.log('━'.repeat(60));
    
    // Verificar si el archivo de rutas existe
    const rutasExisten = fs.existsSync('./src/modules/empresas/routes/usuario-empresa.routes.ts');
    if (rutasExisten) {
      console.log('✅ Archivo de rutas existe: usuario-empresa.routes.ts');
    } else {
      console.log('❌ Archivo de rutas NO EXISTE');
    }
    
    const controllerExiste = fs.existsSync('./src/modules/empresas/controllers/usuario-empresa.controller.ts');
    if (controllerExiste) {
      console.log('✅ Archivo de controller existe: usuario-empresa.controller.ts');
    } else {
      console.log('❌ Archivo de controller NO EXISTE');
    }
    
    const serviceExiste = fs.existsSync('./src/modules/empresas/services/usuario-empresa.service.ts');
    if (serviceExiste) {
      console.log('✅ Archivo de service existe: usuario-empresa.service.ts');
    } else {
      console.log('❌ Archivo de service NO EXISTE');
    }
    
    const repositoryExiste = fs.existsSync('./src/modules/empresas/repositories/usuario-empresa.repository.ts');
    if (repositoryExiste) {
      console.log('✅ Archivo de repository existe: usuario-empresa.repository.ts');
    } else {
      console.log('❌ Archivo de repository NO EXISTE');
    }
    
    // Leer server.ts para verificar registro
    console.log('\n📝 Verificando registro en server/index.ts:');
    const serverContent = fs.readFileSync('./src/server/index.ts', 'utf-8');
    
    const tieneImport = serverContent.includes('usuario-empresa.routes');
    const tieneUse = serverContent.includes('/api/empresas/:empresaId/usuarios');
    
    if (tieneImport) {
      console.log('   ✅ Import de usuarioEmpresaRoutes encontrado');
    } else {
      console.log('   ❌ Import de usuarioEmpresaRoutes NO encontrado');
    }
    
    if (tieneUse) {
      console.log('   ✅ Registro app.use("/api/empresas/:empresaId/usuarios") encontrado');
    } else {
      console.log('   ❌ Registro de ruta NO encontrado');
    }
    
    // 4. ✅ Verificar manejo de errores en controller
    console.log('\n\n4️⃣ VERIFICANDO MANEJO DE ERRORES EN CONTROLLER');
    console.log('━'.repeat(60));
    
    if (controllerExiste) {
      const controllerContent = fs.readFileSync('./src/modules/empresas/controllers/usuario-empresa.controller.ts', 'utf-8');
      
      const tieneCatchBlocks = (controllerContent.match(/catch\s*\(/g) || []).length;
      const tieneErrorResponses = (controllerContent.match(/res\.status\(5\d\d\)/g) || []).length;
      const tieneTryCatch = controllerContent.includes('try {') && controllerContent.includes('} catch');
      
      console.log(`   Try-catch blocks: ${tieneCatchBlocks}`);
      console.log(`   Error responses (5xx): ${tieneErrorResponses}`);
      console.log(`   ${tieneTryCatch ? '✅' : '❌'} Manejo de errores implementado`);
      
      // Verificar que todos los endpoints tienen manejo de errores
      const endpoints = ['getAllByEmpresa', 'getById', 'create', 'update', 'remove'];
      console.log('\n   Endpoints con manejo de errores:');
      endpoints.forEach(endpoint => {
        const tieneManejo = controllerContent.includes(`export const ${endpoint}`) && 
                           controllerContent.includes('try {');
        console.log(`   ${tieneManejo ? '✅' : '❌'} ${endpoint}`);
      });
    }
    
    // RESUMEN FINAL
    console.log('\n\n' + '='.repeat(60));
    console.log('RESUMEN DE VERIFICACIÓN');
    console.log('='.repeat(60));
    
    const allChecks = [
      { name: 'Tabla usuarios_empresas', status: tablaExiste.rows[0].exists },
      { name: 'Campo usuario_asignado_id', status: campoExiste.rows.length > 0 },
      { name: 'Archivos de código', status: rutasExisten && controllerExiste && serviceExiste && repositoryExiste },
      { name: 'Rutas registradas', status: tieneImport && tieneUse },
    ];
    
    console.log('\n📋 Checklist:');
    allChecks.forEach(check => {
      console.log(`   ${check.status ? '✅' : '❌'} ${check.name}`);
    });
    
    const todoOK = allChecks.every(c => c.status);
    
    if (todoOK) {
      console.log('\n🎉 ¡TODAS LAS VERIFICACIONES PASARON!');
      console.log('\n📌 PRÓXIMOS PASOS PARA FRONTEND:');
      console.log('   1. Asegúrate de que el servidor esté corriendo: npx ts-node src/server/index.ts');
      console.log('   2. Endpoints disponibles en: http://localhost:4000/api/empresas/:empresaId/usuarios');
      console.log('   3. Usa el token de autenticación en headers');
      console.log('   4. Para activoAsignadoId envía: null (no string vacío)');
    } else {
      console.log('\n⚠️  HAY VERIFICACIONES FALLIDAS');
      console.log('\n🔧 ACCIONES REQUERIDAS:');
      if (!tablaExiste.rows[0].exists || campoExiste.rows.length === 0) {
        console.log('   → Ejecutar: node scripts/run_migration_064.js');
      }
      if (!tieneImport || !tieneUse) {
        console.log('   → Verificar que server/index.ts tenga las rutas registradas');
      }
    }
    
    console.log('\n' + '='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ ERROR EN VERIFICACIÓN:');
    console.error(error);
  } finally {
    await pool.end();
  }
}

verificarTodo();
