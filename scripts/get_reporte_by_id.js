const { Client } = require('pg');
const id = process.argv[2] || process.env.TICKET_ID;
if(!id){ console.error('Usage: node scripts/get_reporte_by_id.js <ticketId>'); process.exit(2); }
(async ()=>{
  const databaseUrl = process.env.DATABASE_URL;
  if(!databaseUrl){ console.error('DATABASE_URL not set'); process.exit(3); }
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try{
    const r = await client.query('SELECT id, asset_id, reporter_email, description, created_at FROM reporte_usuario WHERE id = $1', [id]);
    console.log(JSON.stringify(r.rows, null, 2));
  }catch(e){ console.error('query failed', e && e.message ? e.message : e); process.exit(1); }
  finally{ await client.end(); }
})();
