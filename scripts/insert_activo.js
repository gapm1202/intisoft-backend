const { Pool } = require('pg');
const connectionString = 'postgresql://postgres:1234@localhost:5432/inticorp';
(async () => {
  const pool = new Pool({ connectionString, connectionTimeoutMillis: 2000 });
  try {
    const insert = `INSERT INTO activos (empresa_id, sede_id, area, categoria, asset_id, fabricante, modelo, serie, usuario_asignado, correo_usuario, cargo_usuario, estado_activo, proveedor, campos_dinamicos) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14::jsonb) RETURNING *`;
    const params = [29, null, 'AreaX', 'CategoriaX', 'TEST-INSERT-001', 'Marca', 'Modelo', 'SER123', 'Usuario', 'correo@x.com', 'Cargo', 'Activo', 'Proveedor', JSON.stringify([{k:'v'}])];
    const res = await pool.query(insert, params);
    console.log('insert result:', res.rows[0]);
  } catch (err) {
    console.error('insert error:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
