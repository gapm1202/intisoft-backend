const http = require('http');
const jwt = require('jsonwebtoken');

const secret = '1234';
const token = jwt.sign({ id: 1, rol: 'administrador' }, secret, { expiresIn: '1h' });

function makeRequest(payload) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: '/api/empresas',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(JSON.stringify(payload)),
        'Authorization': `Bearer ${token}`
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) {
          reject(new Error(`Failed to parse response: ${data}`));
        }
      });
    });

    req.on('error', (err) => {
      console.error('Request error:', err);
      reject(err);
    });
    req.write(JSON.stringify(payload));
    req.end();
  });
}

async function test() {
  console.log('Creating empresa with auto-generated codigoCliente...\n');
  
  try {
    const result = await makeRequest({
      nombre: 'Test Empresa Gap',
      ruc: '20555555555',
      direccionFiscal: 'Av Test',
      ciudad: 'Lima'
    });
    
    console.log('Status: 201');
    console.log('\nResponse:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.codigoCliente) {
      console.log(`\n✅ codigoCliente generado: ${result.codigoCliente}`);
    } else {
      console.log('\n❌ No codigoCliente en response');
    }
  } catch (err) {
    console.error('\nError:', err.message || err);
    process.exit(1);
  }
}

test().then(() => process.exit(0));
