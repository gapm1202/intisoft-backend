require('dotenv').config();
const nodemailer = require('nodemailer');
const path = require('path');

async function testLogoEmail() {
  console.log('\n🧪 Testing logo with CID (Content-ID) attachment...\n');

  const logoPath = path.join(process.cwd(), 'public', 'logo.png');
  console.log('📁 Logo path:', logoPath);

  // Create email HTML with CID reference
  const htmlEmail = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Test Logo Email</title>
</head>
<body style="margin: 0; padding: 40px; background-color: #f1f5f9; font-family: Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <!-- Header with Logo -->
    <div style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); padding: 40px 20px; text-align: center;">
      <div style="background: white; width: 100px; height: 100px; border-radius: 50px; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
        <img src="cid:logo-intisoft" alt="INTISOFT Logo" width="70" height="70" style="display: block;" />
      </div>
      <h1 style="color: white; font-size: 28px; margin: 0;">INTISOFT</h1>
      <p style="color: white; font-size: 18px; margin: 10px 0 0 0;">Prueba de Logo en Email</p>
    </div>
    
    <!-- Content -->
    <div style="padding: 40px 30px; text-align: center;">
      <h2 style="color: #1e293b; font-size: 24px; margin: 0 0 20px 0;">✅ Logo con CID (Content-ID)</h2>
      <p style="color: #64748b; font-size: 16px; line-height: 1.6;">
        El logo está adjunto usando <strong>CID (Content-ID)</strong> de nodemailer.
        Esto es el método correcto para emails que funciona perfectamente en 
        <strong>Gmail, Outlook, Apple Mail</strong> y todos los clientes de correo.
      </p>
      <p style="color: #0ea5e9; font-size: 14px; margin-top: 30px;">
        Si puedes ver el logo circular arriba, ¡funciona perfecto! 🎉
      </p>
    </div>
    
    <!-- Footer -->
    <div style="background: #f8fafc; padding: 25px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="color: #64748b; font-size: 13px; margin: 0;">
        © ${new Date().getFullYear()} INTISOFT - Sistema de Gestión de Activos
      </p>
    </div>
  </div>
</body>
</html>
`;

  // Configure SMTP
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  console.log('\n📧 Sending test email with CID attachment to:', process.env.SMTP_USER);

  try {
    await transporter.sendMail({
      from: `"INTISOFT Test" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER,
      subject: '🧪 Test: Logo con CID (Content-ID)',
      html: htmlEmail,
      attachments: [
        {
          filename: 'logo.png',
          path: logoPath,
          cid: 'logo-intisoft'
        }
      ]
    });

    console.log('\n✅ Email enviado correctamente con adjunto CID!');
    console.log('\n📬 Revisa tu bandeja de entrada en:', process.env.SMTP_USER);
    console.log('\n👁️  El logo debe aparecer en el círculo blanco del encabezado azul\n');
  } catch (error) {
    console.error('\n❌ Error sending email:', error.message);
  }
}

testLogoEmail();
