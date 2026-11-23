import { Router } from 'express';
import { q, one } from '../db/index.js';
import { authenticate, optionalAuth, canTouchMinistry } from '../middleware/auth.js';
import { audit } from '../services/audit.js';

const router = Router();

async function roomFor(req, id) {
  if (!Number.isFinite(id) || id <= 0) return null;
  return one(
    `SELECT r.*, m.name AS ministry_name
       FROM chat_rooms r LEFT JOIN ministries m ON m.id = r.ministry_id
      WHERE r.id = ?`,
    [id]
  );
}

async function isMember(userId, roomId) {
  const row = await one('SELECT 1 AS ok FROM chat_members WHERE room_id = ? AND user_id = ?', [roomId, userId]);
  return Boolean(row);
}

async function assertCanRead(req, res, room) {
  if (!room) {
    res.status(404).json({ error: 'Room not found.' });
    return false;
  }
  if (!req.user) {
    /* The congregation room is the public front door; ministry rooms stay private. */
    if (room.kind === 'church' && room.is_open) return true;
    res.status(401).json({ error: 'Sign in to read this room.' });
    return false;
  }
  if (await isMember(req.user.id, room.id)) return true;
  if (req.scope?.isStaff && canTouchMinistry(req, room.ministry_id)) return true;
  res.status(403).json({ error: 'Join this room to read it.' });
  return false;
}

const listRooms = async (req, res, next) => {
  try {
    const rooms = await q(
      `SELECT r.*, m.name AS ministry_name,
              (SELECT COUNT(*) FROM chat_members cm WHERE cm.room_id = r.id) AS member_count
         FROM chat_rooms r LEFT JOIN ministries m ON m.id = r.ministry_id
        WHERE r.is_open = 1
        ORDER BY r.kind = 'church' DESC, r.id`
    );

    let joinedIds = new Set();
    let readMap = new Map();
    if (req.user) {
      const mine = await q('SELECT room_id FROM chat_members WHERE user_id = ?', [req.user.id]);
      joinedIds = new Set(mine.map((r) => r.room_id));
      const reads = await q('SELECT room_id, last_read_id FROM chat_reads WHERE user_id = ?', [req.user.id]);
      readMap = new Map(reads.map((r) => [r.room_id, r.last_read_id]));
    }

    const out = [];
    for (const room of rooms) {
      const last = await one(
        `SELECT m.id, m.body, m.created_at, u.name AS author
           FROM chat_messages m LEFT JOIN users u ON u.id = m.user_id
          WHERE m.room_id = ? AND m.deleted_at IS NULL
          ORDER BY m.id DESC LIMIT 1`,
        [room.id]
      );
      let unread = 0;
      if (joinedIds.has(room.id)) {
        const row = await one(
          `SELECT COUNT(*) AS c FROM chat_messages WHERE room_id = ? AND id > ? AND deleted_at IS NULL`,
          [room.id, readMap.get(room.id) ?? 0]
        );
        unread = row.c;
      }
      out.push({ ...room, joined: joinedIds.has(room.id), last_message: last, unread });
    }
    return res.json(out);
  } catch (err) {
    return next(err);
  }
};

router.get('/groups', optionalAuth, listRooms);
router.get('/rooms', optionalAuth, listRooms);

router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const room = await roomFor(req, Number(req.params.id));
    if (!room) return res.status(404).json({ error: 'Not found.' });
    const members = await q(
      `SELECT u.id, u.name, u.avatar_url, cm.joined_at
         FROM chat_members cm JOIN users u ON u.id = cm.user_id
        WHERE cm.room_id = ? ORDER BY cm.joined_at LIMIT 50`,
      [room.id]
    );
    return res.json({ ...room, members, joined: req.user ? await isMember(req.user.id, room.id) : false });
  } catch (err) {
    return next(err);
  }
});

router.post('/:id/join', authenticate, audit('chat.join', (req) => `room:${req.params.id}`), async (req, res, next) => {
  try {
    const room = await roomFor(req, Number(req.params.id));
    if (!room) return res.status(404).json({ error: 'Not found.' });
    await q('INSERT IGNORE INTO chat_members (room_id, user_id) VALUES (?, ?)', [room.id, req.user.id]);
    if (room.ministry_id) {
      await q('INSERT IGNORE INTO user_ministries (user_id, ministry_id) VALUES (?, ?)', [
        req.user.id,
        room.ministry_id,
      ]);
    }
    return res.json({ ok: true, joined: true });
  } catch (err) {
    return next(err);
  }
});

router.post('/:id/leave', authenticate, audit('chat.leave', (req) => `room:${req.params.id}`), async (req, res, next) => {
  try {
    const room = await roomFor(req, Number(req.params.id));
    if (!room) return res.status(404).json({ error: 'Not found.' });
    if (room.kind === 'church') return res.status(409).json({ error: 'The church-wide room cannot be left.' });
    await q('DELETE FROM chat_members WHERE room_id = ? AND user_id = ?', [room.id, req.user.id]);
    return res.json({ ok: true, joined: false });
  } catch (err) {
    return next(err);
  }
});

router.get('/:id/messages', optionalAuth, async (req, res, next) => {
  try {
    const room = await roomFor(req, Number(req.params.id));
    if (!(await assertCanRead(req, res, room))) return undefined;

    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const before = Number(req.query.before) || null;
    const params = [room.id];
    let sql = `SELECT m.id, m.room_id, m.body, m.created_at, m.deleted_at, m.user_id, u.name AS author
                 FROM chat_messages m LEFT JOIN users u ON u.id = m.user_id
                WHERE m.room_id = ? AND m.deleted_at IS NULL`;
    if (before) {
      sql += ' AND m.id < ?';
      params.push(before);
    }
    sql += ' ORDER BY m.id DESC LIMIT ?';
    params.push(limit);

    const rows = await q(sql, params);
    const newest = rows[0]?.id ?? 0;
    if (newest) {
      await q(
        `INSERT INTO chat_reads (room_id, user_id, last_read_id) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE last_read_id = GREATEST(last_read_id, VALUES(last_read_id))`,
        [room.id, req.user.id, newest]
      );
    }
    return res.json(rows.reverse());
  } catch (err) {
    return next(err);
  }
});

router.post('/:id/messages', authenticate, audit('chat.message', (req) => `room:${req.params.id}`), async (req, res, next) => {
  try {
    const room = await roomFor(req, Number(req.params.id));
    if (!room) return res.status(404).json({ error: 'Not found.' });
    if (!(await isMember(req.user.id, room.id))) {
      return res.status(403).json({ error: 'Join this room to post.' });
    }
    const body = typeof req.body?.body === 'string' ? req.body.body.trim() : '';
    if (!body) return res.status(400).json({ error: 'Message is empty.' });
    if (body.length > 2000) return res.status(400).json({ error: 'Message is too long.' });

    const result = await q('INSERT INTO chat_messages (room_id, user_id, body) VALUES (?, ?, ?)', [
      room.id,
      req.user.id,
      body,
    ]);
    const row = await one(
      `SELECT m.*, u.name AS author FROM chat_messages m LEFT JOIN users u ON u.id = m.user_id WHERE m.id = ?`,
      [result.insertId]
    );
    return res.status(201).json(row);
  } catch (err) {
    return next(err);
  }
});

router.delete('/:id/messages/:messageId', authenticate, audit('chat.message.delete', (req) => `message:${req.params.messageId}`), async (req, res, next) => {
  try {
    const message = await one('SELECT * FROM chat_messages WHERE id = ? AND room_id = ?', [
      Number(req.params.messageId),
      Number(req.params.id),
    ]);
    if (!message) return res.status(404).json({ error: 'Not found.' });

    const room = await roomFor(req, message.room_id);
    const staff = req.scope?.isStaff && canTouchMinistry(req, room?.ministry_id);
    if (!staff && message.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not allowed.' });
    }
    await q('UPDATE chat_messages SET deleted_at = UTC_TIMESTAMP() WHERE id = ?', [message.id]);
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
});

export default router;
