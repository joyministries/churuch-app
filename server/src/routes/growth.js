import { Router } from 'express';
import { q, one } from '../db/index.js';
import { authenticate, optionalAuth,  } from '../middleware/auth.js';
import { audit } from '../services/audit.js';

const router = Router();

const parseSteps = (value) => {
  if (Array.isArray(value)) return value;
  try {
    return JSON.parse(value ?? '[]');
  } catch {
    return [];
  }
};

router.get('/tracks', optionalAuth, async (req, res, next) => {
  try {
    const rows = await q('SELECT * FROM growth_tracks WHERE is_active = 1 ORDER BY sort_order, id');
    return res.json(rows.map((row) => ({ ...row, steps: parseSteps(row.steps) })));
  } catch (err) {
    return next(err);
  }
});

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const rows = await q(
      `SELECT ug.*, gt.name AS track_name, gt.steps AS steps_json, gt.description
         FROM user_growth ug
         JOIN growth_tracks gt ON gt.id = ug.track_id
        WHERE ug.user_id = ?
        ORDER BY ug.updated_at DESC`,
      [req.user.id]
    );
    return res.json(
      rows.map((row) => ({
        ...row,
        steps: parseSteps(row.steps_json),
        completed: Boolean(row.completed),
      }))
    );
  } catch (err) {
    return next(err);
  }
});

router.post('/me', authenticate, audit('growth.enroll', (req) => `track:${req.body?.track_id}`), async (req, res, next) => {
  try {
    const trackId = Number(req.body?.track_id);
    if (!trackId) return res.status(400).json({ error: 'track_id required.' });
    const track = await one('SELECT id FROM growth_tracks WHERE id = ? AND is_active = 1', [trackId]);
    if (!track) return res.status(404).json({ error: 'Track not found.' });

    await q('INSERT IGNORE INTO user_growth (user_id, track_id) VALUES (?, ?)', [req.user.id, trackId]);
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
});

router.post('/me/step', authenticate, audit('growth.advance', (req) => `track:${req.body?.track_id}`), async (req, res, next) => {
  try {
    const trackId = Number(req.body?.track_id);
    const row = await one('SELECT * FROM user_growth WHERE user_id = ? AND track_id = ?', [
      req.user.id,
      trackId,
    ]);
    if (!row) return res.status(404).json({ error: 'Not enrolled.' });

    const track = await one('SELECT steps FROM growth_tracks WHERE id = ?', [trackId]);
    const steps = parseSteps(track?.steps);
    if (steps.length === 0) return res.status(409).json({ error: 'Track has no steps yet.' });

    const next = Math.min(row.step_index + 1, steps.length - 1);
    const completed = next >= steps.length - 1 && req.body?.finish !== false ? 1 : 0;
    await q('UPDATE user_growth SET step_index = ?, completed = ? WHERE user_id = ? AND track_id = ?', [
      next,
      completed,
      req.user.id,
      trackId,
    ]);
    return res.json({ step_index: next, completed: Boolean(completed), total: steps.length });
  } catch (err) {
    return next(err);
  }
});

export default router;
