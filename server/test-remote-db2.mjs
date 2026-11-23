import mysql from 'mysql2/promise';

const host = 'joyministries.co.za';
const user = 'joyministries_church_app';
const db = 'joyministries_church_app';
const passwords = [
  'h_M]W9i3y;MGUv7',
  'h_M%5DW9i3y%3BMGUv7',
  'h_M]W9i3y;MGUv7@',
];
for (const password of passwords) {
  try {
    const conn = await mysql.createConnection({ host, port: 3306, user, password, database: db, connectTimeout: 15000 });
    const [v] = await conn.query('SELECT VERSION() v, CURRENT_USER() u');
    console.log('OK pwlen=' + password.length, JSON.stringify(v[0]));
    await conn.end();
  } catch (e) {
    console.log('fail pwlen=' + password.length, e.code, e.message.slice(0, 90));
  }
}
// Also probe: is the account allowed from this host at all?
try {
  const conn = await mysql.createConnection({ host, port: 3306, user, password: 'x', connectTimeout: 15000 });
  console.log('x-password connected?!');
  await conn.end();
} catch (e) {
  console.log('probe', e.code, e.message.slice(0, 110));
}
