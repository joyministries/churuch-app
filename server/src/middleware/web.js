import { findUserById, scopeForUser } from '../services/auth.js';

/**
 * Session-backed auth for the admin website (EJS pages). The API uses bearer
 * tokens; the website uses a signed, httpOnly cookie.
 */
export async function loadSessionUser(req, res, next) {
  res.locals.me = null;
  res.locals.scope = { isAdmin: false, ministries: [], isStaff: false };
  /* The admin nav highlights the current section without every route passing it. */
  res.locals.currentPath = req.path.replace(/^\/admin/, '') || '/';
  const userId = req.session?.userId;
  if (!userId) return next();
  try {
    const user = await findUserById(userId);
    if (!user || !user.is_active) {
      req.session.destroy(() => {});
      return next();
    }
    req.user = user;
    req.scope = await scopeForUser(user);
    res.locals.me = user;
    res.locals.scope = req.scope;
  } catch {
    /* fall through as anonymous */
  }
  return next();
}

export function requireLogin(req, res, next) {
  if (req.user) return next();
  const target = encodeURIComponent(req.originalUrl || '/admin');
  return res.redirect(`/admin/login?next=${target}`);
}

export function requireStaffWeb(req, res, next) {
  if (!req.user) return res.redirect('/admin/login');
  if (!req.scope?.isStaff) {
    return res.status(403).render('error', {
      title: 'No access',
      status: 403,
      message: 'This account does not have staff access. Ask a church admin to grant it.',
    });
  }
  return next();
}

export function requireChurchAdminWeb(req, res, next) {
  if (!req.user) return res.redirect('/admin/login');
  if (req.user.role !== 'admin') {
    return res.status(403).render('error', {
      title: 'Church admins only',
      status: 403,
      message: 'That section is limited to church-wide administrators.',
    });
  }
  return next();
}

/** Attach flash messages to every render without repeating it in each route. */
export function flashLocals(req, res, next) {
  res.locals.flash = req.session?.flash ?? null;
  if (req.session?.flash) delete req.session.flash;
  res.locals.notice = req.query.notice ?? null;
  next();
}

export function setFlash(req, type, message) {
  req.session.flash = { type, message };
}
