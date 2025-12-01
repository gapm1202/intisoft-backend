import http from "http";

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sIjoiYWRtaW5pc3RyYWRvciIsImlhdCI6MTc2MzA2Njk1MywiZXhwIjoxNzYzMDcwNTUzfQ.nu3VMQZMNbJiGri2VdGoy81FCtb15JOaZrlnX8Dott8";

const data = JSON.stringify({ ruc: "abc", ciudad: "", email: "not-an-email" });

const options: http.RequestOptions = {
  hostname: 'localhost',
  port: 4000,
  path: '/api/empresas/',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
    'Authorization': `Bearer ${token}`,
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => { body += chunk; });
  res.on('end', () => {
    console.log('status:', res.statusCode);
    console.log('headers:', res.headers['content-type']);
    try {
      const json = JSON.parse(body);
      console.log('body:', JSON.stringify(json, null, 2));
    } catch (err: any) {
      console.log('body (raw):', body);
    }
  });
});

req.on('error', (e) => { console.error('request error', e); });
req.write(data);
req.end();
