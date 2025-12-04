const { Client } = require('pg');

async function main(){
  const databaseUrl = process.env.DATABASE_URL;
  if(!databaseUrl){
    console.error('DATABASE_URL not set');
    process.exit(2);
  }
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try{
    const res = await client.query("SELECT to_regclass('public.reporte_usuario') AS reporte_usuario, to_regclass('public.reporte_adjuntos') AS reporte_adjuntos");
    console.log('table check:', res.rows[0]);
  }catch(e){
    console.error('check failed', e && e.message ? e.message : e);
    process.exit(1);
  }finally{
    await client.end();
  }
}

main();
