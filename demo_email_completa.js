console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║  DEMOSTRACIÓN: Sistema de Email de Bienvenida            ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sIjoiYWRtaW5pc3RyYWRvciIsImlhdCI6MTc2NzU2NzM1MSwiZXhwIjoxNzY4MTcyMTUxfQ.LrikhNdgdAsLCfnSsKj5ufwp3DJvk-sr0nFcyXyefwQ';

console.log('📋 PASO 1: Obtener activos disponibles\n');

fetch('http://localhost:4000/api/empresas/86/sedes/35/inventario?soloSedeActual=true', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(async inventarioResp => {
  console.log(`✅ Activos disponibles en Sede 35: ${inventarioResp.data.length}`);
  
  const activos = inventarioResp.data.slice(0, 2); // Tomar máximo 2 activos
  const activosIds = activos.map(a => a.id.toString());
  
  activos.forEach(a => {
    console.log(`   - [${a.id}] ${a.assetId} (${a.categoria})`);
  });
  
  console.log('\n📋 PASO 2: Crear usuario con email de bienvenida\n');
  
  const nuevoUsuario = {
    empresaId: "86",
    sedeId: "35",
    nombreCompleto: "DEMO Email Sistema",
    correo: "greciaaperez1212@gmail.com", // Cambiar por tu email para pruebas
    cargo: "Demostración",
    telefono: "+51999888777",
    observaciones: "Usuario de demostración del sistema de email",
    activosIds: activosIds
  };
  
  console.log(`👤 Nombre: ${nuevoUsuario.nombreCompleto}`);
  console.log(`📧 Email: ${nuevoUsuario.correo}`);
  console.log(`📦 Activos: ${activosIds.join(', ')}`);
  console.log('\n🚀 Creando usuario...\n');
  
  const createResp = await fetch('http://localhost:4000/api/empresas/86/usuarios', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(nuevoUsuario)
  });
  
  const createData = await createResp.json();
  
  if (createData.success) {
    console.log('✅ USUARIO CREADO EXITOSAMENTE!\n');
    console.log(`🆔 ID: ${createData.data.id}`);
    console.log(`👤 Nombre: ${createData.data.nombreCompleto}`);
    console.log(`📧 Email: ${createData.data.correo}`);
    console.log(`📊 Activos asignados: ${createData.data.cantidadActivosAsignados}`);
    
    console.log('\n📧 EMAIL DE BIENVENIDA:\n');
    console.log('   ✅ Enviándose en segundo plano...');
    console.log('   📬 Destinatario:', nuevoUsuario.correo);
    console.log('   📝 Asunto: "Bienvenido a Intiscorp - Tus equipos y acceso a soporte técnico"');
    console.log('\n   📋 Contenido del email:');
    console.log('      • Datos del usuario (nombre, empresa, sede, cargo)');
    console.log('      • Lista de equipos asignados con detalles');
    console.log('      • Código QR para cada equipo');
    console.log('      • Instrucciones de uso del sistema');
    console.log('      • Información de soporte técnico');
    
    console.log('\n   ⏰ El email puede tardar unos segundos en llegar.');
    console.log('   📱 Incluye QR codes para reportar problemas.');
    
    console.log('\n📋 PASO 3: Verificar usuario creado (GET)\n');
    
    const getResp = await fetch(`http://localhost:4000/api/empresas/86/usuarios/${createData.data.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const getData = await getResp.json();
    
    console.log('✅ Datos verificados:');
    console.log(`   • activosAsignados: ${getData.data.activosAsignados.length} equipos`);
    
    if (getData.data.activosAsignados.length > 0) {
      getData.data.activosAsignados.forEach((a, i) => {
        console.log(`   • Equipo ${i + 1}: ${a.codigo} (${a.categoria})`);
      });
    }
    
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  ✅ DEMOSTRACIÓN COMPLETADA                               ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    console.log('📬 Revisa tu bandeja de entrada para ver el email de bienvenida.');
    console.log('🎨 El email tiene diseño profesional y códigos QR embebidos.\n');
    
  } else {
    console.log('❌ Error creando usuario:', createData.error);
  }
})
.catch(err => console.error('❌ Error:', err.message));
