require('dotenv').config();

console.log('🔍 Verificando variables de entorno SMTP...\n');

const vars = {
  'SMTP_HOST': process.env.SMTP_HOST,
  'SMTP_PORT': process.env.SMTP_PORT,
  'SMTP_USER': process.env.SMTP_USER,
  'SMTP_PASS': process.env.SMTP_PASS
};

let allOk = true;

Object.keys(vars).forEach(key => {
  const value = vars[key];
  if (value) {
    if (key === 'SMTP_PASS') {
      console.log(`✅ ${key}: ${'*'.repeat(value.length)} (${value.length} caracteres)`);
    } else {
      console.log(`✅ ${key}: ${value}`);
    }
  } else {
    console.log(`❌ ${key}: UNDEFINED o VACÍO`);
    allOk = false;
  }
});

console.log('\n' + '='.repeat(50));

if (allOk) {
  console.log('✅ Todas las variables SMTP están configuradas correctamente\n');
  console.log('Puedes probar el envío de correo con:');
  console.log('  node scripts/test_email.js');
} else {
  console.log('❌ Faltan variables de entorno SMTP\n');
  console.log('Agrega las siguientes líneas a tu archivo .env:\n');
  console.log('SMTP_HOST=smtp.gmail.com');
  console.log('SMTP_PORT=587');
  console.log('SMTP_USER=greciaaperez1212@gmail.com');
  console.log('SMTP_PASS=pyug arrk wcce ybcd');
  console.log('\nAsegúrate de que:');
  console.log('  1. El archivo .env existe en la raíz del proyecto');
  console.log('  2. Las variables no tienen espacios extras');
  console.log('  3. No hay comillas alrededor de los valores');
  process.exit(1);
}
