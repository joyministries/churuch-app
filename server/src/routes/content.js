import { Router } from 'express';
import { q, one } from '../db/index.js';
import { optionalAuth, requireStaff, canTouchMinistry, ministryFilter } from '../middleware/auth.js';
import { audit } from '../services/audit.js';

const router = Router();

const TYPES = new Set(['notice', 'devotional', 'sermon', 'media']);

router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const params = [];
    let sql = `SELECT c.*, m.name AS ministry_name, u.name AS author_name
                 FROM content_items c
                 LEFT JOIN ministries m ON m.id = c.ministry_id
                 LEFT JOIN users u ON u.id = c.author_id
                WHERE c.status = 'published'`;

    if (req.query.type && TYPES.has(String(req.query.type))) {
      sql += ' AND c.type = ?';
      params.push(String(req.query.type));
    }
    if (req.query.ministry_id) {
      sql += ' AND c.ministry_id = ?';
      params.push(Number(req.query.ministry_id));
    } else if (!req.user) {
      /* Anonymous readers see published notices and devotionals — nothing
         that was written for one ministry's private board. */
      sql += ' AND c.ministry_id IS NULL';
    }

    sql += ' ORDER BY c.is_pinned DESC, c.published_at DESC, c.id DESC LIMIT 100';
    return res.json(await q(sql, params));
  } catch (err) {
    return next(err);
  }
});

router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const row = await one(
      `SELECT c.*, m.name AS ministry_name, u.name AS author_name
         FROM content_items c
         LEFT JOIN ministries m ON m.id = c.ministry_id
         LEFT JOIN users u ON u.id = c.author_id
        WHERE c.id = ?`,
      [Number(req.params.id)]
    );
    if (!row) return res.status(404).json({ error: 'Not found.' });
    return res.json(row);
  } catch (err) {
    return next(err);
  }
});

router.post('/', optionalAuth, requireStaff, audit('content.create', (req) => `type:${req.body?.type}`), async (req, res, next) => {
  try {
    const { type, title } = req.body ?? {};
    if (!TYPES.has(String(type))) return res.status(400).json({ error: 'Invalid type.' });
    if (!title) return res.status(400).json({ error: 'title required.' });

    const ministryId = req.body?.ministry_id ? Number(req.body.ministry_id) : null;
    if (ministryId && !canTouchMinistry(req, ministryId)) {
      return res.status(403).json({ error: 'Outside your ministry scope.' });
    }

    const result = await q(
      `INSERT INTO content_items
        (type, title, excerpt, body, media_url, thumbnail_url, ministry_id, campus_id, author_id, is_pinned, status, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, UTC_TIMESTAMP())`,
      [
        type,
        title,
        req.body?.excerpt ?? null,
        req.body?.body ?? null,
        req.body?.media_url ?? null,
        req.body?.thumbnail_url ?? null,
        ministryId,
        req.body?.campus_id ?? req.user.campus_id ?? null,
        req.user.id,
        req.body?.is_pinned ? 1 : 0,
        req.body?.status === 'draft' ? 'draft' : 'published',
      ]
    );
    return res.status(201).json(await one('SELECT * FROM content_items WHERE id = ?', [result.insertId]));
  } catch (err) {
    return next(err);
  }
});

router.patch('/:id', optionalAuth, requireStaff, audit('content.update', (req) => `content:${req.params.id}`), async (req, res, next) => {
  try {
    const existing = await one('SELECT * FROM content_items WHERE id = ?', [Number(req.params.id)]);
    if (!existing) return res.status(404).json({ error: 'Not found.' });
    if (!canTouchMinistry(req, existing.ministry_id)) {
      return res.status(403).json({ error: 'Outside your ministry scope.' });
    }
    if (req.body?.ministry_id !== undefined) {
      const nextMinistry = req.body.ministry_id ? Number(req.body.ministry_id) : null;
      if (nextMinistry && !canTouchMinistry(req, nextMinistry)) {
        return res.status(403).json({ error: 'Outside your ministry scope.' });
      }
    }

    await q(
      `UPDATE content_items SET
         title = COALESCE(?, title),
         excerpt = COALESCE(?, excerpt),
         body = COALESCE(?, body),
         media_url = COALESCE(?, media_url),
         thumbnail_url = COALESCE(?, thumbnail_url),
         ministry_id = ?,
         is_pinned = COALESCE(?, is_pinned),
         status = COALESCE(?, status)
       WHERE id = ?`,
      [
        req.body?.title ?? null,
        req.body?.excerpt ?? null,
        req.body?.body ?? null,
        req.body?.media_url ?? null,
        req.body?.thumbnail_url ?? null,
        req.body?.ministry_id !== undefined
          ? req.body.ministry_id
            ? Number(req.body.ministry_id)
            : null
          : existing.ministry_id,
        req.body?.is_pinned === undefined ? null : req.body.is_pinned ? 1 : 0,
        req.body?.status ?? null,
        existing.id,
      ]
    );
    return res.json(await one('SELECT * FROM content_items WHERE id = ?', [existing.id]));
  } catch (err) {
    return next(err);
  }
});

router.delete('/:id', optionalAuth, requireStaff, audit('content.delete', (req) => `content:${req.params.id}`), async (req, res, next) => {
  try {
    const existing = await one('SELECT * FROM content_items WHERE id = ?', [Number(req.params.id)]);
    if (!existing) return res.status(404).json({ error: 'Not found.' });
    if (!canTouchMinistry(req, existing.ministry_id)) {
      return res.status(403).json({ error: 'Outside your ministry scope.' });
    }
    await q('DELETE FROM content_items WHERE id = ?', [existing.id]);
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
});

export default router;
