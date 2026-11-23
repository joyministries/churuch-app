/**
 * Copy the whole application database from the local MySQL container to the
 * cPanel MariaDB host.
 *
 * Usage:
 *   REMOTE_DB_HOST=... REMOTE_DB_USER=... REMOTE_DB_PASSWORD=... REMOTE_DB_NAME=... \
 *   node scripts/migrate-to-remote.mjs
 *
 * The remote schema is created from src/db/schema.sql first, then every table is
 * emptied and refilled so the two databases end up identical. Foreign key checks
 * are disabled for the copy, so table order does not matter.
 */
import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { config } from '../src/config.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const schemaFile = path.join(here, '..', 'src', 'db', 'schema.sql');

const remote = {
  host: process.env.REMOTE_DB_HOST || 'joyministries.co.za',
  port: Number(process.env.REMOTE_DB_PORT || 3306),
  user: process.env.REMOTE_DB_USER || '',
  password: process.env.REMOTE_DB_PASSWORD || '',
  database: process.env.REMOTE_DB_NAME || '',
  connectTimeout: 25000,
  multipleStatements: false,
  charset: 'utf8mb4',
};

if (!remote.user || !remote.database) {
  console.error('Set REMOTE_DB_USER and REMOTE_DB_NAME (and REMOTE_DB_PASSWORD).');
  process.exit(1);
}

const local = await mysql.createConnection({ ...config.db, multipleStatements: false });
let target;

try {
  console.log(`→ local  ${config.db.user}@${config.db.host}/${config.db.database}`);
  console.log(`→ remote ${remote.user}@${remote.host}/${remote.database}`);

  target = await mysql.createConnection(remote);
  const [[info]] = await target.query('SELECT VERSION() AS v, DATABASE() AS db, @@sql_mode AS mode');
  console.log(`  connected: MariaDB/MySQL ${info.v} · db ${info.db}`);

  /* 1. schema */
  const sql = await fs.readFile(schemaFile, 'utf8');
  const scripted = await mysql.createConnection({ ...remote, multipleStatements: true });
  try {
    await scripted.query(sql);
  } finally {
    await scripted.end();
  }
  const [tables] = await target.query(
    'SELECT table_name AS t FROM information_schema.tables WHERE table_schema = ? AND table_type = "BASE TABLE" ORDER BY table_name',
    [remote.database]
  );
  console.log(`  schema ready: ${tables.length} tables`);

  /* 2. data */
  await target.query('SET FOREIGN_KEY_CHECKS = 0');
  await target.query('SET UNIQUE_CHECKS = 0');

  let copied = 0;
  for (const { t } of tables) {
    const [rows] = await local.query(`SELECT * FROM \`${t}\``);
    await target.query(`DELETE FROM \`${t}\``);
    if (!rows.length) {
      console.log(`  ${t.padEnd(22)} 0`);
      continue;
    }
    const cols = Object.keys(rows[0]);
    const colSql = cols.map((c) => `\`${c}\``).join(',');
    const placeholders = `(${cols.map(() => '?').join(',')})`;
    const chunk = Math.max(1, Math.floor(500 / cols.length));

    /* mysql2 hands JSON columns back as parsed objects/arrays. Passing those
       straight to a placeholder makes the driver emit a value list, which
       breaks the column count — so objects get re-serialised first. */
    const norm = (v) => {
      if (v === null || v === undefined) return null;
      if (Buffer.isBuffer(v) || v instanceof Date) return v;
      if (typeof v === 'object') return JSON.stringify(v);
      return v;
    };

    for (let i = 0; i < rows.length; i += chunk) {
      const slice = rows.slice(i, i + chunk);
      const params = slice.flatMap((r) => cols.map((c) => norm(r[c])));
      await target.query(
        `INSERT INTO \`${t}\` (${colSql}) VALUES ${slice.map(() => placeholders).join(',')}`,
        params
      );
    }
    copied += rows.length;
    console.log(`  ${t.padEnd(22)} ${rows.length}`);
  }

  await target.query('SET UNIQUE_CHECKS = 1');
  await target.query('SET FOREIGN_KEY_CHECKS = 1');

  /* 3. verify */
  console.log('\nverification');
  let mismatches = 0;
  for (const { t } of tables) {
    const [[l]] = await local.query(`SELECT COUNT(*) AS c FROM \`${t}\``);
    const [[r]] = await target.query(`SELECT COUNT(*) AS c FROM \`${t}\``);
    if (l.c !== r.c) {
      mismatches += 1;
      console.log(`  ${t}: local ${l.c} vs remote ${r.c}  <-- MISMATCH`);
    }
  }
  console.log(mismatches === 0 ? `  all ${tables.length} tables match (${copied} rows copied)` : `  ${mismatches} mismatches`);
} catch (err) {
  console.error('\nFAILED:', err.code || '', err.message);
  process.exitCode = 1;
} finally {
  await local.end().catch(() => {});
  if (target) await target.end().catch(() => {});
}
