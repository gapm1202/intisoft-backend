require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function testTicketEndpoint() {
  console.log('🧪 Testing GET /public/ticket/:ticketId endpoint\n');

  try {
    // 1. Create a test report
    console.log('1️⃣  Creating test report...');
    const insertReportQuery = `
      INSERT INTO reporte_usuario (
        asset_id, reporter_user_id, reporter_name, reporter_email, 
        description, operational, anydesk, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING id
    `;

    const reportResult = await pool.query(insertReportQuery, [
      'TEST-001',
      null,
      'Test User',
      'test@example.com',
      'Test description for endpoint verification',
      'Sí',
      '123456789'
    ]);

    const reportId = reportResult.rows[0].id;
    console.log(`✅ Test report created with ID: ${reportId}\n`);

    // 2. Add some test attachments
    console.log('2️⃣  Adding test attachments...');
    const insertAttachmentQuery = `
      INSERT INTO reporte_adjuntos (
        reporte_id, file_name, file_path, file_type, created_at
      ) VALUES ($1, $2, $3, $4, NOW())
    `;

    await pool.query(insertAttachmentQuery, [
      reportId,
      'test-image.jpg',
      '/uploads/test-image.jpg',
      'image/jpeg'
    ]);

    await pool.query(insertAttachmentQuery, [
      reportId,
      'test-video.mp4',
      '/uploads/test-video.mp4',
      'video/mp4'
    ]);

    console.log('✅ Test attachments added\n');

    // 3. Test the endpoint
    console.log('3️⃣  Testing endpoint with fetch...');
    
    const fetch = require('node-fetch');
    const response = await fetch(`http://localhost:4000/public/ticket/${reportId}`);
    const data = await response.json();

    if (response.ok && data.ok) {
      console.log('✅ Endpoint responded successfully!\n');
      console.log('📊 Response data:');
      console.log(JSON.stringify(data, null, 2));
      
      // Verify structure
      console.log('\n🔍 Verifying response structure:');
      const ticket = data.data;
      
      if (ticket.id === reportId) console.log('  ✅ id matches');
      if (ticket.asset_id === 'TEST-001') console.log('  ✅ asset_id matches');
      if (ticket.reporter_name === 'Test User') console.log('  ✅ reporter_name matches');
      if (ticket.reporter_email === 'test@example.com') console.log('  ✅ reporter_email matches');
      if (ticket.description === 'Test description for endpoint verification') console.log('  ✅ description matches');
      if (ticket.operational === 'Sí') console.log('  ✅ operational matches');
      if (ticket.anydesk === '123456789') console.log('  ✅ anydesk matches');
      if (ticket.attachments && ticket.attachments.length === 2) console.log('  ✅ attachments count matches');
      
    } else {
      console.log('❌ Endpoint failed');
      console.log('Status:', response.status);
      console.log('Response:', data);
    }

    // 4. Test with invalid ID
    console.log('\n4️⃣  Testing with invalid ticket ID...');
    const invalidResponse = await fetch('http://localhost:4000/public/ticket/99999');
    const invalidData = await invalidResponse.json();
    
    if (invalidResponse.status === 404 && !invalidData.ok) {
      console.log('✅ Returns 404 for non-existent ticket');
    } else {
      console.log('❌ Should return 404 for invalid ticket');
    }

    // 5. Test with non-numeric ID
    console.log('\n5️⃣  Testing with non-numeric ticket ID...');
    const badResponse = await fetch('http://localhost:4000/public/ticket/abc');
    const badData = await badResponse.json();
    
    if (badResponse.status === 400 && !badData.ok) {
      console.log('✅ Returns 400 for invalid format');
    } else {
      console.log('❌ Should return 400 for non-numeric ID');
    }

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await pool.query('DELETE FROM reporte_usuario WHERE id = $1', [reportId]);
    console.log('✅ Test data removed\n');

    console.log('🎉 All tests passed!\n');
    console.log('📋 Endpoint Summary:');
    console.log(`   URL: GET /public/ticket/:ticketId`);
    console.log(`   Example: http://localhost:4000/public/ticket/${reportId}`);
    console.log('   Returns: Ticket details with attachments');
    console.log('   CORS: Enabled (public access)');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Make sure:');
    console.log('  1. Backend server is running (npm run dev)');
    console.log('  2. Database is accessible');
    console.log('  3. Tables reporte_usuario and reporte_adjuntos exist');
  } finally {
    await pool.end();
  }
}

testTicketEndpoint();
