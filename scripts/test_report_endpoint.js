const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// Test endpoint: POST /public/activos/report
async function testReportEndpoint() {
  console.log('🧪 Testing POST /public/activos/report\n');

  const form = new FormData();
  
  // Required fields
  form.append('assetId', 'TEST-001');  // Replace with a valid asset ID from your DB
  form.append('reporterEmail', 'test@example.com');
  form.append('description', 'Test report description - the equipment is not working properly');
  form.append('anydesk', '123456789');
  
  // Optional fields
  form.append('reporterName', 'Juan Pérez');
  form.append('operational', 'No');
  
  // Optional: Add test file attachment (create a dummy file)
  // Uncomment if you want to test with file upload
  // const testFilePath = path.join(__dirname, 'test-image.txt');
  // fs.writeFileSync(testFilePath, 'This is a test file');
  // form.append('attachments', fs.createReadStream(testFilePath), 'test-image.jpg');

  try {
    const response = await fetch('http://localhost:3000/public/activos/report', {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });

    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (data.success && data.reportId) {
      console.log('\n✅ Report created successfully with ID:', data.reportId);
      
      // Verify in database
      const { Pool } = require('pg');
      require('dotenv').config();
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });
      
      const reportQuery = 'SELECT * FROM reporte_usuario WHERE id = $1';
      const reportResult = await pool.query(reportQuery, [data.reportId]);
      
      console.log('\n📊 Report in database:');
      console.log(reportResult.rows[0]);
      
      const attachmentsQuery = 'SELECT * FROM reporte_adjuntos WHERE reporte_id = $1';
      const attachmentsResult = await pool.query(attachmentsQuery, [data.reportId]);
      
      console.log('\n📎 Attachments:');
      console.log(attachmentsResult.rows);
      
      await pool.end();
    } else {
      console.log('\n❌ Test failed');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testReportEndpoint();
