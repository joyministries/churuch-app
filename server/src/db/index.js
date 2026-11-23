import fs from 'node:fs/promises';
import path from 'node:path';
import mysql from 'mysql2/promise';
import { config } from '../config.js';

export const pool = mysql.createPool({
  ...config.db,
  waitForConnections: true,
  queueLimit: 0,
  /* Return DATETIME/TIMESTAMP as 'YYYY-MM-DD HH:mm:ss' — the app already parses
     that shape, and it keeps JSON identical to the old SQLite API. */
  dateStrings: true,
  timezone: 'Z',
  multipleStatements: false,
});

/** Run a statement and return the rows (SELECT) or the OkPacket (writes). */
export async function q(sql, params = []) {
  const [result] = await pool.query(sql, params);
  return result;
}

/** First row or null. */
export async function one(sql, params = []) {
  const rows = await q(sql, params);
  return rows[0] ?? null;
}

/** Value of the first column of the first row, or null. */
export async function scalar(sql, params = []) {
  const row = await one(sql, params);
  if (!row) return null;
  return Object.values(row)[0];
}

export async function transaction(fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const out = await fn(conn);
    await conn.commit();
    return out;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * Apply schema.sql. Safe to run repeatedly — every statement is CREATE IF NOT EXISTS.
 * The file is executed as one multi-statement script on a dedicated connection so
 * MySQL itself handles statement ordering (a naive split broke foreign keys that
 * reference a table defined later in the file).
 */
export async function initSchema() {
  const file = path.join(path.dirname(new URL(import.meta.url).pathname), 'schema.sql');
  const sql = await fs.readFile(file, 'utf8');
  const conn = await mysql.createConnection({ ...config.db, multipleStatements: true });
  try {
    await conn.query(sql);
    const [rows] = await conn.query(
      "SELECT COUNT(*) AS c FROM information_schema.tables WHERE table_schema = DATABASE()"
    );
    console.log(`[db] schema ready (${rows[0]?.c ?? 0} tables)`);
  } finally {
    await conn.end();
  }
}

export async function ping() {
  const row = await one('SELECT 1 AS ok');
  return row?.ok === 1;
}

export default { pool, q, one, scalar, transaction, initSchema, ping };
