import { Router } from 'express';
import { q, one } from '../db/index.js';
import { authenticate, optionalAuth, requireStaff, canTouchMinistry } from '../middleware/auth.js';
import { audit } from '../services/audit.js';

const router = Router();

router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const params = [];
    let sql = `SELECT e.*, m.name AS ministry_name,
                      (SELECT COUNT(*) FROM rsvps r WHERE r.event_id = e.id AND r.status = 'yes') AS rsvp_count
                 FROM events e
                 LEFT JOIN ministries m ON m.id = e.ministry_id
                WHERE 1 = 1`;
    if (req.query.upcoming === '1') sql += ' AND e.starts_at > UTC_TIMESTAMP()';
    if (req.query.ministry_id) {
      sql += ' AND e.ministry_id = ?';
      params.push(Number(req.query.ministry_id));
    }
    sql += ' ORDER BY e.starts_at ASC LIMIT 100';

    const events = await q(sql, params);

    if (req.user && events.length) {
      const ids = events.map((e) => e.id);
      const mine = await q(
        `SELECT event_id, status FROM rsvps WHERE user_id = ? AND event_id IN (${ids.map(() => '?').join(',')})`,
        [req.user.id, ...ids]
      );
      const byEvent = new Map(mine.map((r) => [r.event_id, r.status]));
      for (const event of events) event.my_rsvp = byEvent.get(event.id) ?? null;
    }
    return res.json(events);
  } catch (err) {
    return next(err);
  }
});

router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const event = await one(
      `SELECT e.*, m.name AS ministry_name,
              (SELECT COUNT(*) FROM rsvps r WHERE r.event_id = e.id AND r.status = 'yes') AS rsvp_count
         FROM events e LEFT JOIN ministries m ON m.id = e.ministry_id
        WHERE e.id = ?`,
      [Number(req.params.id)]
    );
    if (!event) return res.status(404).json({ error: 'Not found.' });
    if (req.user) {
      const mine = await one('SELECT status FROM rsvps WHERE event_id = ? AND user_id = ?', [
        event.id,
        req.user.id,
      ]);
      event.my_rsvp = mine?.status ?? null;
    }
    return res.json(event);
  } catch (err) {
    return next(err);
  }
});

router.post('/', optionalAuth, requireStaff, audit('event.create', (req) => `event:${req.body?.title}`), async (req, res, next) => {
  try {
    const { title, starts_at } = req.body ?? {};
    if (!title || !starts_at) return res.status(400).json({ error: 'title and starts_at required.' });

    const ministryId = req.body?.ministry_id ? Number(req.body.ministry_id) : null;
    if (ministryId && !canTouchMinistry(req, ministryId)) {
      return res.status(403).json({ error: 'Outside your ministry scope.' });
    }

    const result = await q(
      `INSERT INTO events
        (title, description, campus_id, ministry_id, location, image_url, starts_at, ends_at, rsvp_open, capacity, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        req.body?.description ?? null,
        req.body?.campus_id ?? req.user.campus_id ?? null,
        ministryId,
        req.body?.location ?? null,
        req.body?.image_url ?? null,
        req.body.starts_at,
        req.body?.ends_at ?? null,
        req.body?.rsvp_open === 0 || req.body?.rsvp_open === false ? 0 : 1,
        req.body?.capacity ? Number(req.body.capacity) : null,
        req.user.id,
      ]
    );
    return res.status(201).json(await one('SELECT * FROM events WHERE id = ?', [result.insertId]));
  } catch (err) {
    return next(err);
  }
});

router.patch('/:id', optionalAuth, requireStaff, audit('event.update', (req) => `event:${req.params.id}`), async (req, res, next) => {
  try {
    const existing = await one('SELECT * FROM events WHERE id = ?', [Number(req.params.id)]);
    if (!existing) return res.status(404).json({ error: 'Not found.' });
    if (!canTouchMinistry(req, existing.ministry_id)) {
      return res.status(403).json({ error: 'Outside your ministry scope.' });
    }
    await q(
      `UPDATE events SET
         title = COALESCE(?, title),
         description = COALESCE(?, description),
         location = COALESCE(?, location),
         image_url = COALESCE(?, image_url),
         starts_at = COALESCE(?, starts_at),
         ends_at = ?,
         rsvp_open = COALESCE(?, rsvp_open),
         capacity = ?,
         ministry_id = ?
       WHERE id = ?`,
      [
        req.body?.title ?? null,
        req.body?.description ?? null,
        req.body?.location ?? null,
        req.body?.image_url ?? null,
        req.body?.starts_at ?? null,
        req.body?.ends_at ?? null,
        req.body?.rsvp_open === undefined ? null : req.body.rsvp_open ? 1 : 0,
        req.body?.capacity ? Number(req.body.capacity) : null,
        req.body?.ministry_id !== undefined
          ? req.body.ministry_id
            ? Number(req.body.ministry_id)
            : null
          : existing.ministry_id,
        existing.id,
      ]
    );
    return res.json(await one('SELECT * FROM events WHERE id = ?', [existing.id]));
  } catch (err) {
    return next(err);
  }
});

router.delete('/:id', optionalAuth, requireStaff, audit('event.delete', (req) => `event:${req.params.id}`), async (req, res, next) => {
  try {
    const existing = await one('SELECT * FROM events WHERE id = ?', [Number(req.params.id)]);
    if (!existing) return res.status(404).json({ error: 'Not found.' });
    if (!canTouchMinistry(req, existing.ministry_id)) {
      return res.status(403).json({ error: 'Outside your ministry scope.' });
    }
    await q('DELETE FROM events WHERE id = ?', [existing.id]);
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
});

router.post('/:id/rsvp', authenticate, audit('rsvp.set', (req) => `event:${req.params.id}`), async (req, res, next) => {
  try {
    const event = await one('SELECT id, rsvp_open FROM events WHERE id = ?', [Number(req.params.id)]);
    if (!event) return res.status(404).json({ error: 'Not found.' });
    if (!event.rsvp_open) return res.status(409).json({ error: 'RSVPs are closed.' });

    const status = ['yes', 'no', 'maybe'].includes(req.body?.status) ? req.body.status : 'yes';
    await q(
      `INSERT INTO rsvps (event_id, user_id, status) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE status = VALUES(status)`,
      [event.id, req.user.id, status]
    );
    return res.json({ ok: true, status });
  } catch (err) {
    return next(err);
  }
});

router.post('/:id/checkin', authenticate, audit('attendance.checkin', (req) => `event:${req.params.id}`), async (req, res, next) => {
  try {
    await q(
      `INSERT IGNORE INTO attendance (event_id, user_id, method) VALUES (?, ?, ?)`,
      [Number(req.params.id), req.user.id, req.body?.method === 'qr' ? 'qr' : 'app']
    );
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
});

router.get('/:id/attendance', optionalAuth, requireStaff, async (req, res, next) => {
  try {
    const event = await one('SELECT * FROM events WHERE id = ?', [Number(req.params.id)]);
    if (!event) return res.status(404).json({ error: 'Not found.' });
    if (!canTouchMinistry(req, event.ministry_id)) {
      return res.status(403).json({ error: 'Outside your ministry scope.' });
    }
    const rows = await q(
      `SELECT u.id, u.name, u.email, a.checked_in_at, a.method
         FROM attendance a JOIN users u ON u.id = a.user_id
        WHERE a.event_id = ? ORDER BY a.checked_in_at DESC`,
      [event.id]
    );
    return res.json(rows);
  } catch (err) {
    return next(err);
  }
});

export default router;
