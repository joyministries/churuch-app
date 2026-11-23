import mysql from 'mysql2/promise';

const cfg = {
  host: 'joyministries.co.za',
  port: 3306,
  user: 'joyministries_church_app',
  password: 'h_M]W9i3y;MGUv7',
  database: 'joyministries_church_app',
  connectTimeout: 20000,
};

try {
  const conn = await mysql.createConnection({ ...cfg, multipleStatements: false });
  const [v] = await conn.query('SELECT VERSION() AS v, DATABASE() AS db, CURRENT_USER() AS u');
  console.log('CONNECTED', JSON.stringify(v[0]));
  const [t] = await conn.query('SHOW TABLES');
  console.log('TABLES', t.length);
  await conn.end();
} catch (err) {
  console.log('FAILED', err.code || '', err.errno || '', err.message);
}
