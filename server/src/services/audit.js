import { q } from '../db/index.js';

/**
 * Append to the audit trail. Never throws: an audit failure must not break the
 * request that produced it.
 */
export async function writeAudit({
  actorId = null,
  action,
  target = null,
  ministryId = null,
  meta = null,
  ip = null,
}) {
  try {
    await q(
      `INSERT INTO audit_log (actor_id, action, target, ministry_id, meta, ip)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [actorId, action, target, ministryId, meta ? JSON.stringify(meta) : null, ip]
    );
  } catch (err) {
    console.warn('[audit] failed:', err.message);
  }
}

/**
 * Express middleware: logs a successful (2xx/3xx) response once it is sent.
 * `target(req)` and `ministryId(req)` let each route describe what it touched.
 */
export function audit(action, target, ministryId) {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);
    const originalRedirect = res.redirect.bind(res);
    const originalSend = res.send.bind(res);

    const record = () => {
      if (res.statusCode >= 400) return;
      let described = null;
      let ministry = req.ministryId ?? null;
      try {
        if (typeof target === 'function') described = target(req);
        else if (typeof target === 'string') described = target;
        if (typeof ministryId === 'function') ministry = ministryId(req);
      } catch {}
      writeAudit({
        actorId: req.user?.id ?? req.session?.userId ?? null,
        action,
        target: described,
        ministryId: ministry,
        meta: { method: req.method, path: req.originalUrl, body: req.body ?? null },
        ip: req.ip,
      });
    };

    res.json = (body) => {
      record();
      return originalJson(body);
    };
    res.redirect = (url) => {
      record();
      return originalRedirect(url);
    };
    res.send = (body) => {
      record();
      return originalSend(body);
    };
    next();
  };
}
