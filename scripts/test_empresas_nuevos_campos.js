const http = require('http');
const jwt = require('jsonwebtoken');

const secret = '1234';
const token = jwt.sign({ id: 1, rol: 'administrador' }, secret, { expiresIn: '1h' });

const payload = JSON.stringify({
  nombre: 'Tech Solutions Peru',
  ruc: '20987654321',
  direccionFiscal: 'Av. Paseo de la República 123, San Isidro',
  ciudad: 'Lima',
  razonSocial: 'Tech Solutions Peru S.A.C',
  provincia: 'Lima',
  telefono: '+51-1-555-0123',
  email: 'contacto@techsolutions.pe',
  tipoEmpresa: 'Tecnología',
  paginaWeb: 'https://techsolutions.pe',
  estadoContrato: 'Activo',
  contactosAdmin: [
    {
      nombre: 'María García',
      cargo: 'Gerente Administrativo',
      telefono: '+51-1-555-0100',
      email: 'maria@techsolutions.pe'
    },
    {
      nombre: 'Roberto López',
      cargo: 'Asistente',
      telefono: '+51-1-555-0101',
      email: 'roberto@techsolutions.pe'
    }
  ],
  contactosTecnicos: [
    {
      nombre: 'Juan Martínez',
      cargo: 'Director Técnico',
      telefono1: '+51-1-555-0200',
      telefono2: '+51-1-555-0201',
      email: 'juan@techsolutions.pe',
      contactoPrincipal: true,
      horarioDisponible: '8AM-8PM',
      autorizaCambiosCriticos: true,
      nivelAutorizacion: 'Nivel 4'
    },
    {
      nombre: 'Ana Rodríguez',
      cargo: 'Ingeniero Sistemas',
      telefono1: '+51-1-555-0202',
      email: 'ana@techsolutions.pe',
      contactoPrincipal: false,
      horarioDisponible: '9AM-6PM',
      autorizaCambiosCriticos: false,
      nivelAutorizacion: 'Nivel 2'
    }
  ],
  observacionesGenerales: 'Cliente preferente - Proyectos estratégicos',
  autorizacionFacturacion: true
});

const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/api/empresas',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
    'Authorization': `Bearer ${token}`
  }
};

console.log('=== PRUEBA POST /api/empresas ===\n');
console.log('JWT Token:');
console.log(token);
console.log('\nPayload enviado:');
console.log(JSON.parse(payload));
console.log('\n=== RESPUESTA DEL SERVIDOR ===\n');

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      console.log(JSON.stringify(response, null, 2));
      console.log('\n✅ codigo_cliente asignado:', response.codigoCliente);
      console.log('✅ codigo generado:', response.codigo);
      console.log('✅ contactosAdmin guardados:', response.contactosAdmin ? response.contactosAdmin.length : 0, 'contactos');
      console.log('✅ contactosTecnicos guardados:', response.contactosTecnicos ? response.contactosTecnicos.length : 0, 'contactos');
      console.log('✅ observacionesGenerales:', response.observacionesGenerales);
      console.log('✅ autorizacionFacturacion:', response.autorizacionFacturacion);
    } catch (e) {
      console.log('Raw response:', data);
      console.error('Error parsing response:', e.message);
    }
    process.exit(0);
  });
});

req.on('error', (e) => {
  console.error('❌ Request error:', e);
  process.exit(1);
});

req.write(payload);
req.end();
