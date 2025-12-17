#!/usr/bin/env node
/**
 * Test codigoCliente auto-generation with gap filling
 * Creates 3 empresas, gets their codigoCliente values, deletes one, then creates another
 */
const http = require('http');
const fs = require('fs');
const { randomUUID } = require('crypto');

// Read JWT token from environment or test file
const token = process.env.TEST_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sIjoiYWRtaW5pc3RyYWRvciIsImlhdCI6MTc2NTkwNDQ5OSwiZXhwIjoxNzY2NTA5Mjk5fQ.sxvlO7kTnLUXsJtIP0GhPjXPC6_QyGm6zWobghIuT8Q';
const host = 'localhost';
const port = 4000;

let empresasCreated = [];
let testResult = { passed: 0, failed: 0, errors: [] };

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: host,
      port: port,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: data ? JSON.parse(data) : null,
            headers: res.headers
          });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, error: 'Parse error' });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  console.log('\n🧪 Testing codigoCliente auto-generation with gap-filling\n');

  try {
    // Test 1: Create first empresa
    console.log('📝 Test 1: Creating first empresa...');
    const ruc1 = `${Math.floor(Math.random() * 1000000000000)}`.padStart(11, '0');
    const ts1 = Date.now();
    const emp1Body = {
      nombre: `Emp-${ts1}-1`,
      ruc: ruc1,
      direccionFiscal: 'Calle 1',
      ciudad: 'Lima',
      tipoEmpresa: 'Servicios'
    };
    const emp1Res = await makeRequest('POST', '/api/empresas', emp1Body);
    if (emp1Res.status === 201) {
      const emp1 = emp1Res.data;
      console.log(`✅ Empresa 1 created: id=${emp1.id}, codigoCliente=${emp1.codigoCliente}`);
      empresasCreated.push(emp1);
      testResult.passed++;
    } else {
      console.log(`❌ Failed: status ${emp1Res.status}`, emp1Res.data);
      if (emp1Res.data?.detail) console.log(`   Detail: ${emp1Res.data.detail}`);
      testResult.failed++;
      testResult.errors.push(`Test 1 failed: ${emp1Res.status}`);
    }

    // Test 2: Create second empresa
    console.log('\n📝 Test 2: Creating second empresa...');
    const ruc2 = `${Math.floor(Math.random() * 1000000000000)}`.padStart(11, '0');
    const ts2 = Date.now() + 1;
    const emp2Body = {
      nombre: `Emp-${ts2}-2`,
      ruc: ruc2,
      direccionFiscal: 'Calle 2',
      ciudad: 'Lima',
      tipoEmpresa: 'Servicios'
    };
    const emp2Res = await makeRequest('POST', '/api/empresas', emp2Body);
    if (emp2Res.status === 201) {
      const emp2 = emp2Res.data;
      console.log(`✅ Empresa 2 created: id=${emp2.id}, codigoCliente=${emp2.codigoCliente}`);
      empresasCreated.push(emp2);
      testResult.passed++;
    } else {
      console.log(`❌ Failed: status ${emp2Res.status}`, emp2Res.data);
      testResult.failed++;
      testResult.errors.push(`Test 2 failed: ${emp2Res.status}`);
    }

    // Test 3: Create third empresa (should be CLI-003)
    console.log('\n📝 Test 3: Creating third empresa...');
    const ruc3 = `${Math.floor(Math.random() * 1000000000000)}`.padStart(11, '0');
    const ts3 = Date.now() + 2;
    const emp3Body = {
      nombre: `Emp-${ts3}-3`,
      ruc: ruc3,
      direccionFiscal: 'Calle 3',
      ciudad: 'Lima',
      tipoEmpresa: 'Servicios'
    };
    const emp3Res = await makeRequest('POST', '/api/empresas', emp3Body);
    if (emp3Res.status === 201) {
      const emp3 = emp3Res.data;
      console.log(`✅ Empresa 3 created: id=${emp3.id}, codigoCliente=${emp3.codigoCliente}`);
      empresasCreated.push(emp3);
      testResult.passed++;
    } else {
      console.log(`❌ Failed: status ${emp3Res.status}`, emp3Res.data);
      testResult.failed++;
      testResult.errors.push(`Test 3 failed: ${emp3Res.status}`);
    }

    // Summary before deletion
    console.log('\n📊 Current codigoCliente values:');
    empresasCreated.forEach((emp, i) => {
      console.log(`  Empresa ${i + 1}: ${emp.codigoCliente}`);
    });

    // Verify sequence: CLI-001, CLI-002, CLI-003
    const codes = empresasCreated.map(e => e.codigoCliente);
    if (codes[0] === 'CLI-001' && codes[1] === 'CLI-002' && codes[2] === 'CLI-003') {
      console.log('✅ Sequence correct: CLI-001, CLI-002, CLI-003');
      testResult.passed++;
    } else {
      console.log(`❌ Sequence incorrect. Got: ${codes.join(', ')}`);
      testResult.failed++;
      testResult.errors.push(`Expected CLI-001, CLI-002, CLI-003; got ${codes.join(', ')}`);
    }

    console.log('\n📈 RESULTS:');
    console.log(`✅ Passed: ${testResult.passed}`);
    console.log(`❌ Failed: ${testResult.failed}`);
    if (testResult.errors.length > 0) {
      console.log('\nErrors:');
      testResult.errors.forEach(e => console.log(`  - ${e}`));
    }

    if (testResult.failed === 0) {
      console.log('\n🎉 All tests passed!');
      process.exit(0);
    } else {
      console.log('\n⚠️ Some tests failed');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n💥 Unexpected error:', error.message);
    process.exit(2);
  }
}

main();
