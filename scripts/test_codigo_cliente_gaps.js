const http = require('http');
const jwt = require('jsonwebtoken');

const secret = '1234';
const token = jwt.sign({ id: 1, rol: 'administrador' }, secret, { expiresIn: '1h' });

async function testCodigoClienteGeneration() {
  console.log('\n=== Testing codigoCliente generation with gap handling ===\n');

  // Test 1: Create first empresa (should get CLI-001)
  console.log('Test 1: Create first empresa (should get CLI-001)');
  const empresa1 = await makeRequest({
    nombre: 'Empresa Uno',
    ruc: '20111111111',
    direccionFiscal: 'Av Test 1',
    ciudad: 'Lima'
  });
  console.log(`  Result: ${empresa1.codigoCliente}\n`);

  // Test 2: Create second empresa (should get CLI-002)
  console.log('Test 2: Create second empresa (should get CLI-002)');
  const empresa2 = await makeRequest({
    nombre: 'Empresa Dos',
    ruc: '20222222222',
    direccionFiscal: 'Av Test 2',
    ciudad: 'Lima'
  });
  console.log(`  Result: ${empresa2.codigoCliente}\n`);

  // Test 3: Create third empresa (should get CLI-003)
  console.log('Test 3: Create third empresa (should get CLI-003)');
  const empresa3 = await makeRequest({
    nombre: 'Empresa Tres',
    ruc: '20333333333',
    direccionFiscal: 'Av Test 3',
    ciudad: 'Lima'
  });
  console.log(`  Result: ${empresa3.codigoCliente}\n`);

  // Test 4: Simulate deletion by manually deleting from DB, then create new empresa
  console.log('Test 4: After simulating deletion of CLI-002 in DB, create new empresa');
  console.log('  Expected: CLI-002 (filling the gap)\n');
  
  // Delete CLI-002 from database
  const { Pool } = require('pg');
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'intisoft',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  try {
    await pool.query(`DELETE FROM empresas WHERE codigo_cliente = 'CLI-002'`);
    console.log('  Deleted CLI-002 from database\n');

    // Now create a new empresa - should get CLI-002
    const empresa4 = await makeRequest({
      nombre: 'Empresa Cuatro',
      ruc: '20444444444',
      direccionFiscal: 'Av Test 4',
      ciudad: 'Lima'
    });
    console.log(`  Result: ${empresa4.codigoCliente}`);
    console.log(`  ✅ ${empresa4.codigoCliente === 'CLI-002' ? 'PASS' : 'FAIL'}: Got expected code\n`);

  } finally {
    await pool.end();
  }
}

function makeRequest(payload) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
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

    req.on('error', reject);
    req.write(JSON.stringify(payload));
    req.end();
  });
}

testCodigoClienteGeneration().catch(console.error);
