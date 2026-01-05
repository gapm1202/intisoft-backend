// Script para probar envío de email a un usuario existente
import { enviarEmailBienvenida, verificarConexionSMTP } from './src/services/email.service';

async function test() {
  console.log('🔍 Verificando conexión SMTP...');
  const smtpOk = await verificarConexionSMTP();
  
  if (!smtpOk) {
    console.log('❌ Error en conexión SMTP. Verifica .env');
    process.exit(1);
  }
  
  console.log('✅ SMTP OK\n');
  
  // Probar con usuario 28 (Tiare Rodriguez)
  const usuarioId = 28;
  console.log(`📧 Enviando email de prueba a usuario ${usuarioId}...`);
  
  const resultado = await enviarEmailBienvenida(usuarioId);
  
  if (resultado) {
    console.log('✅ Email enviado exitosamente!');
    console.log('📬 Revisa la bandeja del usuario');
  } else {
    console.log('❌ Error enviando email');
  }
  
  process.exit(0);
}

test();
