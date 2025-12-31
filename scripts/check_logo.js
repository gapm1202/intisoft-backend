const http = require('http');

console.log('🔍 Verificando que el logo esté accesible...\n');

const PORT = process.env.PORT || 4000;
const LOGO_URL = `http://localhost:${PORT}/logo.png`;

console.log(`URL del logo: ${LOGO_URL}\n`);

const req = http.get(LOGO_URL, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Content-Type: ${res.headers['content-type']}`);
  console.log(`Content-Length: ${res.headers['content-length']} bytes\n`);

  if (res.statusCode === 200) {
    console.log('✅ El logo es accesible correctamente!');
    console.log('\nEl correo podrá cargar el logo desde:');
    console.log(`  ${LOGO_URL}`);
    console.log('\nAsegúrate de agregar al .env:');
    console.log(`  BACKEND_PUBLIC_URL=http://localhost:${PORT}`);
  } else {
    console.log('❌ Error: El logo no es accesible');
    console.log('\nVerifica que:');
    console.log('  1. El servidor está corriendo (npm run dev)');
    console.log('  2. El archivo public/logo.png existe');
    console.log('  3. La carpeta public está siendo servida como static');
  }
});

req.on('error', (err) => {
  console.error('❌ Error de conexión:', err.message);
  console.log('\nAsegúrate de que el servidor esté corriendo:');
  console.log('  npm run dev');
});

req.end();
