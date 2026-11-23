import { Router } from 'express';
import { q, one } from '../db/index.js';
import { authenticate, requireStaff, requireAdmin, canTouchMinistry } from '../middleware/auth.js';
import { audit } from '../services/audit.js';

const router = Router();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 60, 200);
    const rows = await q(
      `SELECT n.*, m.name AS ministry_name
         FROM notifications n
         LEFT JOIN ministries m ON m.id = n.ministry_id
        WHERE n.user_id = ?
        ORDER BY n.id DESC LIMIT ?`,
      [req.user.id, limit]
    );
    const unread = await one(
      'SELECT COUNT(*) AS c FROM notifications WHERE user_id = ? AND read_at IS NULL',
      [req.user.id]
    );
    return res.json({ items: rows, unread: unread.c });
  } catch (err) {
    return next(err);
  }
});

router.patch('/:id/read', authenticate, async (req, res, next) => {
  try {
    await q('UPDATE notifications SET read_at = UTC_TIMESTAMP() WHERE id = ? AND user_id = ?', [
      Number(req.params.id),
      req.user.id,
    ]);
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
});

router.post('/read-all', authenticate, async (req, res, next) => {
  try {
    await q('UPDATE notifications SET read_at = UTC_TIMESTAMP() WHERE user_id = ? AND read_at IS NULL', [
      req.user.id,
    ]);
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
});

/**
 * Fan a message out to inboxes. Ministry admins may broadcast inside their own
 * ministry; only a church admin may write to everyone.
 */
router.post('/broadcast', authenticate, requireStaff, audit('notification.broadcast', (req) => `title:${req.body?.title}`), async (req, res, next) => {
  try {
    const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
    if (!title) return res.status(400).json({ error: 'title required.' });

    const body = req.body?.body ?? null;
    const link = req.body?.link ?? null;
    const ministryId = req.body?.ministry_id ? Number(req.body.ministry_id) : null;

    if (ministryId) {
      if (!canTouchMinistry(req, ministryId)) {
        return res.status(403).json({ error: 'Outside your ministry scope.' });
      }
      const result = await q(
        `INSERT INTO notifications (user_id, type, title, body, link, ministry_id)
         SELECT um.user_id, 'ministry', ?, ?, ?, ?
           FROM user_ministries um
          WHERE um.ministry_id = ?`,
        [title, body, link, ministryId, ministryId]
      );
      return res.json({ ok: true, sent: result.affectedRows });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Church-wide broadcasts need a church admin.' });
    }
    const result = await q(
      `INSERT INTO notifications (user_id, type, title, body, link)
       SELECT id, 'broadcast', ?, ?, ? FROM users WHERE is_active = 1`,
      [title, body, link]
    );
    return res.json({ ok: true, sent: result.affectedRows });
  } catch (err) {
    return next(err);
  }
});

router.delete('/:id', authenticate, requireAdmin, audit('notification.delete', (req) => `notification:${req.params.id}`), async (req, res, next) => {
  try {
    await q('DELETE FROM notifications WHERE id = ?', [Number(req.params.id)]);
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
});

export default router;
