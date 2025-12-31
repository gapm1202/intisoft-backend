require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
  console.log('📧 Testing SMTP Configuration...\n');

  // Verificar variables de entorno
  const requiredVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
  const missing = requiredVars.filter(v => !process.env[v]);
  
  if (missing.length > 0) {
    console.error('❌ Missing environment variables:', missing.join(', '));
    console.log('\nAdd these to your .env file:');
    console.log('SMTP_HOST=smtp.gmail.com');
    console.log('SMTP_PORT=587');
    console.log('SMTP_USER=your-email@gmail.com');
    console.log('SMTP_PASS=your-app-password');
    process.exit(1);
  }

  console.log('Configuration:');
  console.log(`  Host: ${process.env.SMTP_HOST}`);
  console.log(`  Port: ${process.env.SMTP_PORT}`);
  console.log(`  User: ${process.env.SMTP_USER}`);
  console.log(`  Pass: ${'*'.repeat(process.env.SMTP_PASS.length)}\n`);

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    console.log('🔄 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified!\n');

    console.log('📨 Sending test email...');
    
    const testReportId = 999;
    const testEmail = process.env.SMTP_USER; // Send to yourself
    
    const htmlEmail = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #0ea5e9; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .ticket-id { font-size: 24px; font-weight: bold; color: #0ea5e9; }
    .status-bar { display: flex; justify-content: space-between; margin: 20px 0; }
    .status { flex: 1; text-align: center; padding: 10px; }
    .status.active { background: #0ea5e9; color: white; }
    .status.inactive { background: #e5e7eb; color: #6b7280; }
    .button { display: inline-block; background: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Ticket Registrado</h1>
    </div>
    <div class="content">
      <p>Tu ticket de soporte fue enviado correctamente.</p>
      <p>Número de ticket: <span class="ticket-id">#${testReportId}</span></p>
      
      <div class="status-bar">
        <div class="status active">Enviado</div>
        <div class="status inactive">En proceso</div>
        <div class="status inactive">Finalizado</div>
      </div>
      
      <p><strong>Descripción:</strong> Este es un correo de prueba del sistema de reportes</p>
      <p><strong>Activo:</strong> TEST-001</p>
      <p><strong>Reportado por:</strong> Usuario de Prueba</p>
      
      <a href="${process.env.FRONTEND_PUBLIC_URL || 'http://localhost:5173'}/public/ticket/${testReportId}" class="button">Ver mi ticket</a>
      
      <p style="color: #6b7280; font-size: 12px;">Recibirás actualizaciones por correo cuando tu ticket cambie de estado.</p>
    </div>
  </div>
</body>
</html>
`;

    const info = await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: testEmail,
      subject: `[TEST] Tu ticket de soporte #${testReportId} fue enviado`,
      html: htmlEmail
    });

    console.log('✅ Test email sent successfully!');
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Sent to: ${testEmail}\n`);
    console.log('🎉 Email configuration is working correctly!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.code === 'EAUTH') {
      console.log('\n💡 Authentication failed. Check:');
      console.log('   1. SMTP_USER is correct');
      console.log('   2. SMTP_PASS is a valid app password (not your Gmail password)');
      console.log('   3. 2-Step Verification is enabled on your Google account');
    } else if (error.code === 'ECONNECTION') {
      console.log('\n💡 Connection failed. Check:');
      console.log('   1. SMTP_HOST and SMTP_PORT are correct');
      console.log('   2. Your internet connection');
      console.log('   3. Firewall settings');
    }
    
    process.exit(1);
  }
}

testEmail();
