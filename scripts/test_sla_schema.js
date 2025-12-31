// Test del endpoint de schema de SLA
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/api/sla/schema/incidentes',
  method: 'GET',
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('\n=== SCHEMA ENDPOINT TEST ===\n');
    console.log('Status Code:', res.statusCode);
    console.log('\nResponse Body:');
    console.log(JSON.stringify(JSON.parse(data), null, 2));
  });
});

req.on('error', (error) => {
  console.error('Error:', error.message);
});

req.end();
