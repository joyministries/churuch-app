import { Router } from 'express';
import { createHash, randomInt } from 'node:crypto';
import { q, one } from '../db/index.js';
import {
  hashPassword,
  verifyPassword,
  createToken,
  findUserByEmail,
  findUserByPhone,
  findUserById,
  publicUser,
  ministriesForUser,
} from '../services/auth.js';
import { authenticate } from '../middleware/auth.js';
import { audit } from '../services/audit.js';
import { isProd } from '../config.js';

const router = Router();

const clean = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

router.post('/register', audit('user.register'), async (req, res, next) => {
  try {
    const name = clean(req.body?.name);
    const email = clean(req.body?.email)?.toLowerCase() ?? null;
    const phone = clean(req.body?.phone);
    const password = req.body?.password;

    if (!name || !password) return res.status(400).json({ error: 'Name and password required.' });
    if (String(password).length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    const existing = email
      ? await findUserByEmail(email)
      : phone
        ? await findUserByPhone(phone)
        : null;
    if (existing) return res.status(409).json({ error: 'Account already exists.' });

    const result = await q(
      `INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, 'member')`,
      [name, email, phone, hashPassword(String(password))]
    );
    const user = await findUserById(result.insertId);
    const token = await createToken(user);
    return res.status(201).json({ token, user: publicUser(user) });
  } catch (err) {
    return next(err);
  }
});

router.post('/login', audit('user.login'), async (req, res, next) => {
  try {
    const email = clean(req.body?.email)?.toLowerCase();
    const phone = clean(req.body?.phone);
    const password = req.body?.password;

    const user = email ? await findUserByEmail(email) : phone ? await findUserByPhone(phone) : null;
    if (!user || !verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    if (!user.is_active) return res.status(403).json({ error: 'Account is disabled.' });

    await q('UPDATE users SET last_login_at = UTC_TIMESTAMP() WHERE id = ?', [user.id]);
    const token = await createToken(user);
    return res.json({
      token,
      user: { ...publicUser(user), ministries: await ministriesForUser(user.id) },
    });
  } catch (err) {
    return next(err);
  }
});

/** Issues a 6-digit code. Locally it is returned so the flow is testable. */
router.post('/password-reset/request', audit('user.password_reset_request'), async (req, res, next) => {
  try {
    const email = clean(req.body?.email)?.toLowerCase();
    const phone = clean(req.body?.phone);
    const user = email ? await findUserByEmail(email) : phone ? await findUserByPhone(phone) : null;

    if (!user) return res.json({ ok: true });

    const code = String(randomInt(100000, 1000000));
    const codeHash = createHash('sha256').update(code).digest('hex');
    await q(
      `INSERT INTO password_resets (user_id, code_hash, expires_at)
       VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 30 MINUTE))`,
      [user.id, codeHash]
    );
    console.log(`[reset] code for ${user.email ?? user.phone}: ${code}`);

    return res.json({ ok: true, ...(isProd() ? {} : { dev_code: code }) });
  } catch (err) {
    return next(err);
  }
});

router.post('/password-reset/confirm', audit('user.password_reset_confirm'), async (req, res, next) => {
  try {
    const email = clean(req.body?.email)?.toLowerCase();
    const phone = clean(req.body?.phone);
    const code = clean(req.body?.token);
    const newPassword = req.body?.new_password;

    if (!newPassword || String(newPassword).length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    const user = email ? await findUserByEmail(email) : phone ? await findUserByPhone(phone) : null;
    if (!user || !code) return res.status(401).json({ error: 'Invalid request.' });

    const codeHash = createHash('sha256').update(String(code)).digest('hex');
    const row = await one(
      `SELECT id FROM password_resets
        WHERE user_id = ? AND code_hash = ? AND used_at IS NULL AND expires_at > UTC_TIMESTAMP()
        ORDER BY id DESC LIMIT 1`,
      [user.id, codeHash]
    );
    if (!row) return res.status(401).json({ error: 'Invalid or expired code.' });

    await q('UPDATE users SET password_hash = ? WHERE id = ?', [hashPassword(String(newPassword)), user.id]);
    await q('UPDATE password_resets SET used_at = UTC_TIMESTAMP() WHERE id = ?', [row.id]);
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
});

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const ministries = await ministriesForUser(req.user.id);
    return res.json({ ...publicUser(req.user), ministries, scope: req.scope });
  } catch (err) {
    return next(err);
  }
});

router.put('/me', authenticate, audit('user.update_profile', (req) => `user:${req.user.id}`), async (req, res, next) => {
  try {
    const name = clean(req.body?.name);
    const phone = clean(req.body?.phone);
    const campusId = req.body?.campus_id === undefined ? undefined : Number(req.body.campus_id);

    await q(
      `UPDATE users
          SET name = COALESCE(?, name),
              phone = COALESCE(?, phone),
              campus_id = COALESCE(?, campus_id)
        WHERE id = ?`,
      [name, phone, Number.isFinite(campusId) ? campusId : null, req.user.id]
    );
    const user = await findUserById(req.user.id);
    return res.json(publicUser(user));
  } catch (err) {
    return next(err);
  }
});

export default router;
