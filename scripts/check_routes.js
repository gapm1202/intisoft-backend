const http = require('http');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';
const token = jwt.sign({ id: 1, rol: 'administrador' }, JWT_SECRET, { expiresIn: '1h' });
function req(path){ return new Promise((res,rej)=>{ const options={hostname:'localhost',port:4000,path,method:'GET',headers:{Authorization:`Bearer ${token}`}}; const r=http.request(options,(s)=>{let b='';s.on('data',c=>b+=c);s.on('end',()=>res({status:s.statusCode,body:b}))}); r.on('error',rej); r.end();}); }
(async()=>{ try{ console.log('GET /api/catalogo/categorias'); console.log(await req('/api/catalogo/categorias')); console.log('GET /api/catalogo/tipos'); console.log(await req('/api/catalogo/tipos')); }catch(e){console.error(e);} process.exit(0); })();