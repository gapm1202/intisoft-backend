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
            reject(new Error(parsed.error || `HTTP ${res.statusCode}`));
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

async function testListTipos() {
  try {
    console.log('📋 GET /api/catalogo/tipos-ticket');
    const response = await request('GET', '/api/catalogo/tipos-ticket');
    console.log('✅ Tipos obtenidos:', response.data.length);
    response.data.forEach(tipo => {
      console.log(`  - ${tipo.nombre} (${tipo.activo ? 'activo' : 'inactivo'})`);
    });
    console.log('');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function testCreateTipo() {
  try {
    console.log('➕ POST /api/catalogo/tipos-ticket');
    const response = await request('POST', '/api/catalogo/tipos-ticket', {
      nombre: 'Problema',
      descripcion: 'Problemas técnicos reportados por usuarios',
      activo: true
    });
    console.log('✅ Tipo creado:', response.data);
    console.log('');
    return response.data.id;
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function testUpdateTipo(id) {
  try {
    console.log(`✏️  PUT /api/catalogo/tipos-ticket/${id}`);
    const response = await request('PUT', `/api/catalogo/tipos-ticket/${id}`, {
      descripcion: 'Descripción actualizada del tipo de ticket'
    });
    console.log('✅ Tipo actualizado:', response.data);
    console.log('');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function testToggleTipo(id) {
  try {
    console.log(`🔄 PATCH /api/catalogo/tipos-ticket/${id}/toggle`);
    const response = await request('PATCH', `/api/catalogo/tipos-ticket/${id}/toggle`, {});
    console.log('✅ Estado cambiado:', response.data);
    console.log('');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function runTests() {
  try {
    await login();
    await testListTipos();
    const id = await testCreateTipo();
    if (id) {
      await testUpdateTipo(id);
      await testToggleTipo(id);
      await testToggleTipo(id); // Volver a activar
    }
    await testListTipos();
    console.log('✅ Todas las pruebas completadas');
  } catch (error) {
    console.error('❌ Error en pruebas:', error.message);
  }
}

runTests();
