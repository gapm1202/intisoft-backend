require('dotenv').config();
const {Pool} = require('pg');
const pool = new Pool({connectionString: process.env.DATABASE_URL});

pool.query(`SELECT column_name, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'empresas' ORDER BY ordinal_position`)
  .then(r => { 
    console.log(r.rows); 
    pool.end(); 
  })
  .catch(e => {
    console.error(e);
    pool.end();
  });
