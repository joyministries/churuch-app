import { verifyToken, findUserById, scopeForUser, canSeeMinistry } from '../services/auth.js';
import { writeAudit } from '../services/audit.js';

async function attachUser(req, token) {
  const payload = await verifyToken(token);
  const user = await findUserById(payload.sub);
  if (!user || !user.is_active) return null;
  req.user = user;
  req.scope = await scopeForUser(user);
  return user;
}

/** Bearer token required. */
export async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  try {
    const user = await attachUser(req, header.slice(7));
    if (!user) return res.status(401).json({ error: 'Invalid token.' });
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

/**
 * Bearer token if present, otherwise anonymous. Public reads use this so the
 * app can show notices, events and sermons before anyone signs in.
 */
export async function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    req.user = null;
    req.scope = { isAdmin: false, ministries: [], isStaff: false };
    return next();
  }
  try {
    const user = await attachUser(req, header.slice(7));
    if (!user) {
      req.user = null;
      req.scope = { isAdmin: false, ministries: [], isStaff: false };
    }
  } catch {
    req.user = null;
    req.scope = { isAdmin: false, ministries: [], isStaff: false };
  }
  return next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required.' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions.' });
    }
    return next();
  };
}

export function requireStaff(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Authentication required.' });
  if (!req.scope?.isStaff) return res.status(403).json({ error: 'Staff access required.' });
  return next();
}

export function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Authentication required.' });
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Church admin access required.' });
  return next();
}

/**
 * Resolve the ministry a record belongs to and decide whether the caller may
 * touch it. Church admins pass everywhere; ministry admins only inside the
 * ministries where they hold `admin` in user_ministries.
 */
export function canTouchMinistry(req, ministryId) {
  if (!req.scope) return false;
  if (req.scope.isAdmin) return true;
  return canSeeMinistry(req.scope, ministryId);
}

/** Reject a request that names a ministry outside the caller's scope. */
export function guardMinistryId(getMinistryId) {
  return (req, res, next) => {
    const id = getMinistryId(req);
    if (id === null || id === undefined || id === '') return next();
    if (!canTouchMinistry(req, Number(id))) {
      return res.status(403).json({ error: 'Outside your ministry scope.' });
    }
    req.ministryId = Number(id);
    return next();
  };
}

/** Scope SQL fragments. Returns `{ clause, params }` for a ministry column. */
export function ministryFilter(req, column = 'ministry_id') {
  if (req.scope?.isAdmin) return { clause: '', params: [] };
  const ids = req.scope?.ministries ?? [];
  if (ids.length === 0) return { clause: ` AND ${column} IS NULL`, params: [] };
  return {
    clause: ` AND (${column} IS NULL OR ${column} IN (${ids.map(() => '?').join(',')}))`,
    params: ids,
  };
}

export function auditDenied(req, action) {
  writeAudit({
    actorId: req.user?.id ?? null,
    action: `${action}.denied`,
    target: req.originalUrl,
    meta: { method: req.method },
    ip: req.ip,
  });
}
