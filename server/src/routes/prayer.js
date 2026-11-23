import { Router } from 'express';
import { q, one } from '../db/index.js';
import { authenticate, optionalAuth, canTouchMinistry } from '../middleware/auth.js';
import { audit } from '../services/audit.js';

const router = Router();

const AUTHOR = `CASE WHEN p.is_anonymous = 1 THEN 'Anonymous'
                     ELSE COALESCE(u.name, p.display_name, 'A friend') END`;

router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const params = [];
    let sql = `SELECT p.*, ${AUTHOR} AS author_name, m.name AS ministry_name,
                      (SELECT COUNT(*) FROM prayer_prayers pp WHERE pp.prayer_id = p.id) AS prayer_count
                 FROM prayer_requests p
                 LEFT JOIN users u ON u.id = p.author_id
                 LEFT JOIN ministries m ON m.id = p.ministry_id
                WHERE p.status <> 'hidden'`;

    if (!req.user) sql += ' AND p.is_private = 0';
    if (req.query.ministry_id) {
      sql += ' AND p.ministry_id = ?';
      params.push(Number(req.query.ministry_id));
    }
    sql += ' ORDER BY p.id DESC LIMIT 100';

    const rows = await q(sql, params);

    if (req.user && rows.length) {
      const ids = rows.map((r) => r.id);
      const prayed = await q(
        `SELECT prayer_id FROM prayer_prayers WHERE user_id = ? AND prayer_id IN (${ids.map(() => '?').join(',')})`,
        [req.user.id, ...ids]
      );
      const set = new Set(prayed.map((r) => r.prayer_id));
      for (const row of rows) {
        row.prayed_by_me = set.has(row.id);
        row.mine = row.author_id === req.user.id;
        if (row.is_private && !row.mine && !req.scope?.isStaff) delete row.text;
      }
    }
    return res.json(rows);
  } catch (err) {
    return next(err);
  }
});

router.post('/', authenticate, audit('prayer.request', (req) => `prayer:${String(req.body?.text ?? '').slice(0, 40)}`), async (req, res, next) => {
  try {
    const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
    if (text.length < 5) return res.status(400).json({ error: 'Please write a little more.' });
    if (text.length > 1200) return res.status(400).json({ error: 'Please shorten the request.' });

    const ministryId = req.body?.ministry_id ? Number(req.body.ministry_id) : null;
    if (ministryId && !canTouchMinistry(req, ministryId)) {
      return res.status(403).json({ error: 'Outside your ministry scope.' });
    }

    const result = await q(
      `INSERT INTO prayer_requests (author_id, ministry_id, display_name, text, is_anonymous, is_private, status)
       VALUES (?, ?, ?, ?, ?, ?, 'open')`,
      [
        req.user.id,
        ministryId,
        req.body?.display_name ?? null,
        text,
        req.body?.is_anonymous ? 1 : 0,
        req.body?.is_private ? 1 : 0,
      ]
    );
    const row = await one('SELECT * FROM prayer_requests WHERE id = ?', [result.insertId]);
    return res.status(201).json(row);
  } catch (err) {
    return next(err);
  }
});

router.post('/:id/pray', authenticate, audit('prayer.pray', (req) => `prayer:${req.params.id}`), async (req, res, next) => {
  try {
    await q('INSERT IGNORE INTO prayer_prayers (prayer_id, user_id) VALUES (?, ?)', [
      Number(req.params.id),
      req.user.id,
    ]);
    const row = await one(
      'SELECT COUNT(*) AS prayer_count FROM prayer_prayers WHERE prayer_id = ?',
      [Number(req.params.id)]
    );
    return res.json({ ok: true, prayer_count: row.prayer_count });
  } catch (err) {
    return next(err);
  }
});

/** Author can mark their own request answered; staff can set any status. */
router.patch('/:id/status', authenticate, audit('prayer.status', (req) => `prayer:${req.params.id}`), async (req, res, next) => {
  try {
    const status = String(req.body?.status ?? '');
    if (!['open', 'prayed', 'answered', 'hidden'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }
    const row = await one('SELECT * FROM prayer_requests WHERE id = ?', [Number(req.params.id)]);
    if (!row) return res.status(404).json({ error: 'Not found.' });

    const isAuthor = row.author_id === req.user.id;
    const staff = req.scope?.isStaff && canTouchMinistry(req, row.ministry_id);
    if (!staff && !(isAuthor && ['answered', 'hidden'].includes(status))) {
      return res.status(403).json({ error: 'Not allowed.' });
    }
    await q('UPDATE prayer_requests SET status = ? WHERE id = ?', [status, row.id]);
    return res.json({ ok: true, status });
  } catch (err) {
    return next(err);
  }
});

router.delete('/:id', authenticate, audit('prayer.delete', (req) => `prayer:${req.params.id}`), async (req, res, next) => {
  try {
    const row = await one('SELECT * FROM prayer_requests WHERE id = ?', [Number(req.params.id)]);
    if (!row) return res.status(404).json({ error: 'Not found.' });
    const staff = req.scope?.isStaff && canTouchMinistry(req, row.ministry_id);
    if (!staff && row.author_id !== req.user.id) {
      return res.status(403).json({ error: 'Not allowed.' });
    }
    await q('DELETE FROM prayer_requests WHERE id = ?', [row.id]);
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
});

export default router;
