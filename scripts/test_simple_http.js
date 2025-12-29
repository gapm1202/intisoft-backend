const http = require('http');

// Login
const loginData = JSON.stringify({
  email: 'admin@intisoft.com',
  password: 'admin123'
});

const loginOptions = {
  hostname: 'localhost',
  port: 4000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': loginData.length
  }
};

const loginReq = http.request(loginOptions, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    const loginResponse = JSON.parse(body);
    const token = loginResponse.token;
    
    // Create activo
    const activoData = JSON.stringify({
      categoria: 'PC',
      descripcion: 'Test PC',
      modelo: 'Test',
      marca: 'Test',
      condicionActual: 'nuevo',
      garantia: false
    });
    
    const activoOptions = {
      hostname: 'localhost',
      port: 4000,
      path: '/api/empresas/72/sedes/30/inventario',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': activoData.length,
        'Authorization': `Bearer ${token}`
      }
    };
    
    const activoReq = http.request(activoOptions, (res2) => {
      let body2 = '';
      res2.on('data', (chunk) => body2 += chunk);
      res2.on('end', () => {
        console.log('Status:', res2.statusCode);
        console.log('Response:', body2);
      });
    });
    
    activoReq.on('error', (e) => {
      console.error('Error request:', e);
    });
    
    activoReq.write(activoData);
    activoReq.end();
  });
});

loginReq.on('error', (e) => {
  console.error('Error login:', e);
});

loginReq.write(loginData);
loginReq.end();
