import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { config } from '../config.js';
import { one, q } from '../db/index.js';

const secret = new TextEncoder().encode(config.jwtSecret);
const ALG = 'HS256';

export function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password, stored) {
  if (!password || !stored) return false;
  try {
    return bcrypt.compareSync(password, stored);
  } catch {
    return false;
  }
}

export async function createToken(user) {
  return new SignJWT({
    sub: String(user.id),
    role: user.role,
    campus_id: user.campus_id ?? null,
  })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret);
}

export async function verifyToken(token) {
  const { payload } = await jwtVerify(token, secret);
  return payload;
}

export const findUserById = (id) => one('SELECT * FROM users WHERE id = ?', [id]);
export const findUserByEmail = (email) => one('SELECT * FROM users WHERE email = ?', [email]);
export const findUserByPhone = (phone) => one('SELECT * FROM users WHERE phone = ?', [phone]);

/** Shape sent to the app — never leak the password hash. */
export function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    campus_id: user.campus_id,
    avatar_url: user.avatar_url,
  };
}

export async function ministriesForUser(userId) {
  return q(
    `SELECT m.id, m.name, m.slug, m.color, m.icon, um.role AS member_role
       FROM user_ministries um
       JOIN ministries m ON m.id = um.ministry_id
      WHERE um.user_id = ?
      ORDER BY m.sort_order, m.name`,
    [userId]
  );
}

/**
 * What this account may touch.
 *   admin          -> every ministry + every church-wide record
 *   ministry_admin -> only the ministries where they hold `admin` in user_ministries
 *   leader         -> same as ministry_admin (legacy role kept for compatibility)
 *   member         -> no admin surface at all
 */
export async function scopeForUser(user) {
  if (!user) return { isAdmin: false, ministries: [], isStaff: false };
  if (user.role === 'admin') {
    const rows = await q('SELECT id FROM ministries');
    return { isAdmin: true, ministries: rows.map((r) => r.id), isStaff: true };
  }
  if (user.role === 'ministry_admin' || user.role === 'leader') {
    const rows = await q(
      `SELECT ministry_id FROM user_ministries WHERE user_id = ? AND role = 'admin'`,
      [user.id]
    );
    return { isAdmin: false, ministries: rows.map((r) => r.ministry_id), isStaff: true };
  }
  return { isAdmin: false, ministries: [], isStaff: false };
}

export function canSeeMinistry(scope, ministryId) {
  if (!scope) return false;
  if (scope.isAdmin) return true;
  if (ministryId === null || ministryId === undefined) return false;
  return scope.ministries.includes(Number(ministryId));
}
