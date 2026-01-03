const https = require('https');
const http = require('http');
require('dotenv').config();

const BASE_URL = 'http://localhost:4000';
let TOKEN = '';

async function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (TOKEN) {
      options.headers['Authorization'] = `Bearer ${TOKEN}`;
    }

    const client = url.protocol === 'https:' ? https : http;
    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 400) {
            reject(new Error(parsed.error || parsed.message || `HTTP ${res.statusCode}`));
          } else {
            resolve(parsed);
          }
        } catch (e) {
          reject(new Error('Invalid JSON response'));
        }
      });
    });

    req.on('error', reject);
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function login() {
  try {
    const response = await request('POST', '/api/auth/login', {
      email: 'admin@intisoft.com',
      password: 'admin123'
    });
    TOKEN = response.token;
    console.log('✅ Login exitoso\n');
    return TOKEN;
  } catch (error) {
    console.error('❌ Error en login:', error.message);
    throw error;
  }
}

async function testGetSLA() {
  try {
    console.log('📋 GET /api/sla/configuracion/72');
    const response = await request('GET', '/api/sla/configuracion/72');
    
    if (!response || !response.data) {
      console.log('ℹ️  No hay configuración SLA para esta empresa (esto es normal)');
      return;
    }
    
    // Verificar que NO tenga gestionIncidentes
    if (response.data.gestionIncidentes) {
      console.log('❌ ERROR: gestionIncidentes aún está presente en la respuesta');
      console.log('   Valor:', JSON.stringify(response.data.gestionIncidentes));
    } else {
      console.log('✅ Correcto: gestionIncidentes NO está en la respuesta');
    }
    
    // Mostrar estructura actual
    console.log('\n📊 Campos presentes en SLA configuración:');
    Object.keys(response.data).forEach(key => {
      console.log(`   - ${key}`);
    });
    console.log('');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function runTests() {
  try {
    await login();
    await testGetSLA();
    console.log('✅ Prueba completada');
  } catch (error) {
    console.error('❌ Error en pruebas:', error.message);
  }
}

runTests();
