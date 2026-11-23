import { Router } from 'express';
import { q, one } from '../db/index.js';
import { authenticate, requireStaff, requireAdmin, canTouchMinistry, ministryFilter } from '../middleware/auth.js';
import { audit } from '../services/audit.js';
import { hashPassword } from '../services/auth.js';
import { writeAudit } from '../services/audit.js';

const router = Router();

/* ---------------- users ---------------- */

router.get('/users', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const rows = await q(
      `SELECT u.id, u.name, u.email, u.phone, u.role, u.campus_id, u.is_active, u.created_at,
              c.name AS campus_name
         FROM users u LEFT JOIN campuses c ON c.id = u.campus_id
        ORDER BY u.id DESC`
    );
    return res.json(rows);
  } catch (err) {
    return next(err);
  }
});

router.post('/users', authenticate, requireAdmin, audit('admin.user.create', (req) => `user:${req.body?.email}`), async (req, res, next) => {
  try {
    const { name, email, phone, password, role, campus_id } = req.body ?? {};
    if (!name || !password) return res.status(400).json({ error: 'name and password required.' });
    const result = await q(
      `INSERT INTO users (name, email, phone, password_hash, role, campus_id) VALUES (?, ?, ?, ?, ?, ?)`,
      [name, email ?? null, phone ?? null, hashPassword(password), role ?? 'member', campus_id ?? null]
    );
    return res.status(201).json(await one('SELECT id, name, email, phone, role, campus_id FROM users WHERE id = ?', [result.insertId]));
  } catch (err) {
    return next(err);
  }
});

router.patch('/users/:id', authenticate, requireAdmin, audit('admin.user.update', (req) => `user:${req.params.id}`), async (req, res, next) => {
  try {
    await q(
      `UPDATE users SET
         name = COALESCE(?, name),
         role = COALESCE(?, role),
         campus_id = COALESCE(?, campus_id),
         is_active = COALESCE(?, is_active)
       WHERE id = ?`,
      [req.body?.name ?? null, req.body?.role ?? null, req.body?.campus_id ?? null, req.body?.is_active ?? null, Number(req.params.id)]
    );
    return res.json(await one('SELECT id, name, email, role, campus_id, is_active FROM users WHERE id = ?', [Number(req.params.id)]));
  } catch (err) {
    return next(err);
  }
});

/* ---------- ministry scoping ---------- */

router.post('/users/:id/ministries', authenticate, requireAdmin, audit('admin.user.ministry_grant', (req) => `user:${req.params.id}`), async (req, res, next) => {
  try {
    const role = req.body?.role === 'admin' ? 'admin' : 'member';
    await q(
      `INSERT INTO user_ministries (user_id, ministry_id, role) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE role = VALUES(role)`,
      [Number(req.params.id), Number(req.body?.ministry_id), role]
    );
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
});

router.delete('/users/:id/ministries/:ministryId', authenticate, requireAdmin, audit('admin.user.ministry_revoke', (req) => `user:${req.params.id}`), async (req, res, next) => {
  try {
    await q('DELETE FROM user_ministries WHERE user_id = ? AND ministry_id = ?', [Number(req.params.id), Number(req.params.ministryId)]);
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
});

/* ---------------- campuses ---------------- */

router.get('/campuses', authenticate, requireStaff, async (req, res, next) => {
  try {
    return res.json(await q('SELECT * FROM campuses ORDER BY id'));
  } catch (err) {
    return next(err);
  }
});

router.post('/campuses', authenticate, requireAdmin, audit('admin.campus.create', (req) => `campus:${req.body?.name}`), async (req, res, next) => {
  try {
    const { name, address, service_times, phone, is_primary } = req.body ?? {};
    const slug = String(name ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `campus-${Date.now()}`;
    const result = await q(
      `INSERT INTO campuses (name, slug, address, service_times, phone, is_primary) VALUES (?, ?, ?, ?, ?, ?)`,
      [name, slug, address ?? null, service_times ?? null, phone ?? null, is_primary ? 1 : 0]
    );
    return res.status(201).json(await one('SELECT * FROM campuses WHERE id = ?', [result.insertId]));
  } catch (err) {
    return next(err);
  }
});

/* ---------------- ministries ---------------- */

router.get('/ministries', authenticate, requireStaff, async (req, res, next) => {
  try {
    let sql = `SELECT m.*, c.name AS campus_name, u.name AS leader_name
                 FROM ministries m
                 LEFT JOIN campuses c ON c.id = m.campus_id
                 LEFT JOIN users u ON u.id = m.leader_id`;
    const params = [];
    if (!req.scope.isAdmin) {
      const ids = req.scope.ministries;
      if (ids.length) {
        sql += ` WHERE m.id IN (${ids.map(() => '?').join(',')})`;
        params.push(...ids);
      } else {
        sql += ' WHERE 1 = 0';
      }
    }
    sql += ' ORDER BY m.sort_order, m.id';
    return res.json(await q(sql, params));
  } catch (err) {
    return next(err);
  }
});

router.post('/ministries', authenticate, requireStaff, audit('admin.ministry.create', (req) => `ministry:${req.body?.name}`), async (req, res, next) => {
  try {
    const { name, campus_id, description, gathering, leader_id, color, icon, sort_order } = req.body ?? {};
    if (!name) return res.status(400).json({ error: 'name required.' });
    const slug = String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const result = await q(
      `INSERT INTO ministries (campus_id, name, slug, description, gathering, leader_id, color, icon, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [campus_id ?? null, name, slug, description ?? null, gathering ?? null, leader_id ?? null, color ?? null, icon ?? null, sort_order ?? 0]
    );
    const ministry = await one('SELECT * FROM ministries WHERE id = ?', [result.insertId]);
    if (leader_id) {
      await q('INSERT IGNORE INTO user_ministries (user_id, ministry_id, role) VALUES (?, ?, "admin")', [leader_id, ministry.id]);
    }
    return res.status(201).json(ministry);
  } catch (err) {
    return next(err);
  }
});

router.patch('/ministries/:id', authenticate, requireStaff, audit('admin.ministry.update', (req) => `ministry:${req.params.id}`), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await one('SELECT * FROM ministries WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ error: 'Not found.' });
    if (!canTouchMinistry(req, id)) return res.status(403).json({ error: 'Outside your ministry scope.' });

    await q(
      `UPDATE ministries SET
         name = COALESCE(?, name),
         description = COALESCE(?, description),
         gathering = COALESCE(?, gathering),
         color = COALESCE(?, color),
         icon = COALESCE(?, icon),
         sort_order = COALESCE(?, sort_order),
         is_active = COALESCE(?, is_active)
       WHERE id = ?`,
      [req.body?.name ?? null, req.body?.description ?? null, req.body?.gathering ?? null, req.body?.color ?? null, req.body?.icon ?? null, req.body?.sort_order ?? null, req.body?.is_active ?? null, id]
    );
    return res.json(await one('SELECT * FROM ministries WHERE id = ?', [id]));
  } catch (err) {
    return next(err);
  }
});

/* ---------------- sermons ---------------- */

router.get('/sermons', authenticate, requireStaff, async (req, res, next) => {
  try {
    return res.json(await q('SELECT * FROM sermons ORDER BY published_at DESC, id DESC'));
  } catch (err) {
    return next(err);
  }
});

router.post('/sermons', authenticate, requireStaff, audit('admin.sermon.create', (req) => `sermon:${req.body?.title}`), async (req, res, next) => {
  try {
    const { youtube_id, title, speaker, series, scripture, description, published_at, is_featured, visible } = req.body ?? {};
    if (!youtube_id || !title) return res.status(400).json({ error: 'youtube_id and title required.' });
    const result = await q(
      `INSERT INTO sermons (youtube_id, title, speaker, series, scripture, description, published_at, is_featured, visible) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [youtube_id, title, speaker ?? null, series ?? null, scripture ?? null, description ?? null, published_at ?? null, is_featured ? 1 : 0, visible === false ? 0 : 1]
    );
    return res.status(201).json(await one('SELECT * FROM sermons WHERE id = ?', [result.insertId]));
  } catch (err) {
    return next(err);
  }
});

router.patch('/sermons/:id', authenticate, requireStaff, audit('admin.sermon.update', (req) => `sermon:${req.params.id}`), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await q(
      `UPDATE sermons SET
         title = COALESCE(?, title),
         speaker = COALESCE(?, speaker),
         series = COALESCE(?, series),
         scripture = COALESCE(?, scripture),
         description = COALESCE(?, description),
         published_at = COALESCE(?, published_at),
         is_featured = COALESCE(?, is_featured),
         visible = COALESCE(?, visible)
       WHERE id = ?`,
      [req.body?.title ?? null, req.body?.speaker ?? null, req.body?.series ?? null, req.body?.scripture ?? null, req.body?.description ?? null, req.body?.published_at ?? null, req.body?.is_featured ?? null, req.body?.visible ?? null, id]
    );
    return res.json(await one('SELECT * FROM sermons WHERE id = ?', [id]));
  } catch (err) {
    return next(err);
  }
});

/* ---------------- resources / library ---------------- */

router.get('/resources', authenticate, requireStaff, async (req, res, next) => {
  try {
    return res.json(await q('SELECT * FROM resources ORDER BY sort_order, id'));
  } catch (err) {
    return next(err);
  }
});

router.post('/resources', authenticate, requireStaff, audit('admin.resource.create', (req) => `resource:${req.body?.title}`), async (req, res, next) => {
  try {
    const { title, kind, format, ministry_id, description, file_url, media_id, is_published, sort_order } = req.body ?? {};
    if (!title) return res.status(400).json({ error: 'title required.' });
    if (ministry_id && !canTouchMinistry(req, ministry_id)) {
      return res.status(403).json({ error: 'Outside your ministry scope.' });
    }
    const result = await q(
      `INSERT INTO resources (title, kind, format, ministry_id, description, file_url, media_id, is_published, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, kind ?? 'book', format ?? null, ministry_id ?? null, description ?? null, file_url ?? null, media_id ?? null, is_published === false ? 0 : 1, sort_order ?? 0]
    );
    return res.status(201).json(await one('SELECT * FROM resources WHERE id = ?', [result.insertId]));
  } catch (err) {
    return next(err);
  }
});

/* ---------------- media ---------------- */

router.get('/media', authenticate, requireStaff, async (req, res, next) => {
  try {
    return res.json(await q('SELECT * FROM media_assets ORDER BY id DESC LIMIT 200'));
  } catch (err) {
    return next(err);
  }
});

/* ---------------- settings ---------------- */

router.get('/settings', authenticate, requireAdmin, async (req, res, next) => {
  try {
    return res.json(await q('SELECT key_name, value, updated_at FROM settings ORDER BY key_name'));
  } catch (err) {
    return next(err);
  }
});

router.put('/settings', authenticate, requireAdmin, audit('admin.settings.update', () => 'settings'), async (req, res, next) => {
  try {
    const entries = Object.entries(req.body ?? {});
    for (const [key, value] of entries) {
      await q(
        `INSERT INTO settings (key_name, value) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE value = VALUES(value)`,
        [key, String(value ?? '')]
      );
    }
    return res.json({ ok: true, count: entries.length });
  } catch (err) {
    return next(err);
  }
});

/* ---------------- audit ---------------- */

router.get('/audit', authenticate, requireStaff, async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    let sql = `SELECT a.*, u.name AS actor_name, m.name AS ministry_name
                 FROM audit_log a
                 LEFT JOIN users u ON u.id = a.actor_id
                 LEFT JOIN ministries m ON m.id = a.ministry_id`;
    const params = [];
    if (!req.scope.isAdmin) {
      const ids = req.scope.ministries;
      if (ids.length) {
        sql += ` WHERE (a.ministry_id IS NULL OR a.ministry_id IN (${ids.map(() => '?').join(',')}))`;
        params.push(...ids);
      } else {
        sql += ' WHERE a.ministry_id IS NULL';
      }
    }
    sql += ' ORDER BY a.id DESC LIMIT ?';
    params.push(limit);
    return res.json(await q(sql, params));
  } catch (err) {
    return next(err);
  }
});

/* ---------------- stats ---------------- */

router.get('/stats', authenticate, requireStaff, async (req, res, next) => {
  try {
    const users = await one('SELECT COUNT(*) c FROM users');
    const donations = await one("SELECT COALESCE(SUM(amount),0) t FROM donations WHERE status='completed'");
    const pending = await one("SELECT COUNT(*) c FROM donations WHERE status='pending'");
    const events = await one('SELECT COUNT(*) c FROM events WHERE starts_at > UTC_TIMESTAMP()');
    const prayers = await one("SELECT COUNT(*) c FROM prayer_requests WHERE status='open'");
    return res.json({ users: users.c, giving_total: donations.t, giving_pending: pending.c, upcoming_events: events.c, open_prayers: prayers.c });
  } catch (err) {
    return next(err);
  }
});

export default router;
