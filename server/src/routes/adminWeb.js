import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import multer from 'multer';
import { config } from '../config.js';
import { q, one } from '../db/index.js';
import { findUserByEmail, verifyPassword } from '../services/auth.js';
import { writeAudit, audit } from '../services/audit.js';
import { loadSessionUser, requireLogin, requireStaffWeb, requireChurchAdminWeb, setFlash } from '../middleware/web.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(here, '..');
const router = Router();

/**
 * Every state-changing request in the admin site is recorded — uploads included —
 * so the audit page shows what the office actually did, not just sign-ins.
 */
router.use((req, res, next) => {
  if (req.method !== 'POST') return next();
  if (req.path === '/login' || req.path === '/logout') return next();
  const action = `admin${req.path.replace(/\/\d+/g, '/:id')}`.slice(0, 80);
  return audit(action, () => req.originalUrl)(req, res, next);
});

const upload = multer({
  dest: path.join(config.uploadsDir, 'tmp'),
  limits: { fileSize: config.maxUploadMb * 1024 * 1024 },
});

/* ---------------- auth ---------------- */

router.get('/login', (req, res) => {
  res.render('login', { title: 'Sign in', next: req.query.next || '/admin' });
});

router.post('/login', async (req, res) => {
  const user = await findUserByEmail(String(req.body?.email ?? '').trim().toLowerCase());
  if (!user || !verifyPassword(req.body?.password, user.password_hash) || !user.is_active) {
    setFlash(req, 'error', 'Invalid credentials.');
    return res.redirect('/admin/login');
  }
  req.session.userId = user.id;
  await writeAudit({ actorId: user.id, action: 'admin.login', ip: req.ip });
  return res.redirect(req.body?.next || '/admin');
});

router.get('/logout', (req, res) => {
  const userId = req.session?.userId;
  req.session.destroy(() => {});
  if (userId) writeAudit({ actorId: userId, action: 'admin.logout', ip: req.ip });
  return res.redirect('/admin/login');
});

/* ---------------- dashboard ---------------- */

const dashboard = async (req, res, next) => {
  try {
    const stats = await one(`SELECT (SELECT COUNT(*) FROM users) u, (SELECT COALESCE(SUM(amount),0) FROM donations WHERE status='completed') g, (SELECT COUNT(*) FROM events WHERE starts_at > UTC_TIMESTAMP()) e, (SELECT COUNT(*) FROM prayer_requests WHERE status='open') p`);
    const recent = await q('SELECT action, target, created_at FROM audit_log ORDER BY id DESC LIMIT 12');
    res.render('dashboard', { title: 'Dashboard', stats, recent });
  } catch (err) {
    return next(err);
  }
};

router.get('/', requireLogin, requireStaffWeb, dashboard);
router.get('/dashboard', requireLogin, requireStaffWeb, dashboard);

/* ---------------- users ---------------- */

router.get('/users', requireLogin, requireChurchAdminWeb, async (req, res, next) => {
  try {
    const users = await q('SELECT u.*, c.name campus_name FROM users u LEFT JOIN campuses c ON c.id=u.campus_id ORDER BY u.id DESC');
    const ministries = await q('SELECT id, name FROM ministries ORDER BY name');
    const grants = await q('SELECT um.*, m.name ministry_name FROM user_ministries um JOIN ministries m ON m.id=um.ministry_id');
    const byUser = new Map();
    for (const g of grants) (byUser.get(g.user_id) ?? byUser.set(g.user_id, []).get(g.user_id)).push(g);
    for (const u of users) u.grants = byUser.get(u.id) ?? [];
    res.render('users', { title: 'Users', users, ministries });
  } catch (err) {
    return next(err);
  }
});

router.post('/users', requireLogin, requireChurchAdminWeb, async (req, res, next) => {
  try {
    const { name, email, phone, password, role, campus_id } = req.body;
    const { hashPassword } = await import('../services/auth.js');
    await q('INSERT INTO users (name,email,phone,password_hash,role,campus_id) VALUES (?,?,?,?,?,?)', [name, email || null, phone || null, hashPassword(password), role || 'member', campus_id || null]);
    setFlash(req, 'success', 'User created.');
    writeAudit({ actorId: req.user.id, action: 'admin.user.create', target: email, ministryId: null });
    res.redirect('/admin/users');
  } catch (err) {
    setFlash(req, 'error', err.message);
    res.redirect('/admin/users');
  }
});

router.post('/users/:id/grant', requireLogin, requireChurchAdminWeb, async (req, res, next) => {
  try {
    const role = req.body.role === 'admin' ? 'admin' : 'member';
    await q('INSERT INTO user_ministries (user_id,ministry_id,role) VALUES (?,?,?) ON DUPLICATE KEY UPDATE role=VALUES(role)', [req.params.id, req.body.ministry_id, role]);
    setFlash(req, 'success', 'Ministry access updated.');
    writeAudit({ actorId: req.user.id, action: 'admin.ministry.grant', target: `user:${req.params.id}`, ministryId: req.body.ministry_id });
    res.redirect('/admin/users');
  } catch (err) {
    setFlash(req, 'error', err.message);
    res.redirect('/admin/users');
  }
});

/* ---------------- ministries ---------------- */

router.get('/ministries', requireLogin, requireStaffWeb, async (req, res, next) => {
  try {
    const ministries = await q('SELECT m.*, c.name campus_name, u.name leader_name FROM ministries m LEFT JOIN campuses c ON c.id=m.campus_id LEFT JOIN users u ON u.id=m.leader_id ORDER BY m.sort_order,m.id');
    const campuses = await q('SELECT id,name FROM campuses ORDER BY name');
    const leaders = await q("SELECT id,name FROM users WHERE role IN ('admin','ministry_admin','leader') ORDER BY name");
    res.render('ministries', { title: 'Ministries', ministries, campuses, leaders });
  } catch (err) {
    return next(err);
  }
});

router.post('/ministries', requireLogin, requireStaffWeb, async (req, res, next) => {
  try {
    const { name, campus_id, description, gathering, leader_id, color, icon, sort_order } = req.body;
    const slug = String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    await q('INSERT INTO ministries (campus_id,name,slug,description,gathering,leader_id,color,icon,sort_order) VALUES (?,?,?,?,?,?,?,?,?)', [campus_id || null, name, slug, description || null, gathering || null, leader_id || null, color || null, icon || null, sort_order || 0]);
    setFlash(req, 'success', 'Ministry created.');
    res.redirect('/admin/ministries');
  } catch (err) {
    setFlash(req, 'error', err.message);
    res.redirect('/admin/ministries');
  }
});

/* ---------------- content ---------------- */

router.get('/content', requireLogin, requireStaffWeb, async (req, res, next) => {
  try {
    const items = await q('SELECT c.*, m.name ministry_name FROM content_items c LEFT JOIN ministries m ON m.id=c.ministry_id ORDER BY c.id DESC LIMIT 100');
    const ministries = await q('SELECT id,name FROM ministries ORDER BY name');
    res.render('content', { title: 'Notices & devotionals', items, ministries });
  } catch (err) {
    return next(err);
  }
});

router.post('/content', requireLogin, requireStaffWeb, async (req, res, next) => {
  try {
    const { type, title, excerpt, body, media_url, ministry_id, is_pinned, status } = req.body;
    await q('INSERT INTO content_items (type,title,excerpt,body,media_url,ministry_id,author_id,is_pinned,status,published_at) VALUES (?,?,?,?,?,?,?,?,?,UTC_TIMESTAMP())', [type, title, excerpt || null, body || null, media_url || null, ministry_id || null, req.user.id, is_pinned ? 1 : 0, status || 'published']);
    setFlash(req, 'success', 'Content saved.');
    res.redirect('/admin/content');
  } catch (err) {
    setFlash(req, 'error', err.message);
    res.redirect('/admin/content');
  }
});

/* ---------------- events ---------------- */

router.get('/events', requireLogin, requireStaffWeb, async (req, res, next) => {
  try {
    const items = await q('SELECT e.*, m.name ministry_name FROM events e LEFT JOIN ministries m ON m.id=e.ministry_id ORDER BY e.starts_at DESC');
    const ministries = await q('SELECT id,name FROM ministries ORDER BY name');
    res.render('events', { title: 'Events', items, ministries });
  } catch (err) {
    return next(err);
  }
});

router.post('/events', requireLogin, requireStaffWeb, async (req, res, next) => {
  try {
    const { title, description, location, ministry_id, starts_at, ends_at, capacity } = req.body;
    await q('INSERT INTO events (title,description,location,ministry_id,starts_at,ends_at,capacity,created_by) VALUES (?,?,?,?,?,?,?,?)', [title, description || null, location || null, ministry_id || null, starts_at, ends_at || null, capacity || null, req.user.id]);
    setFlash(req, 'success', 'Event created.');
    res.redirect('/admin/events');
  } catch (err) {
    setFlash(req, 'error', err.message);
    res.redirect('/admin/events');
  }
});

/* ---------------- sermons ---------------- */

router.get('/sermons', requireLogin, requireStaffWeb, async (req, res, next) => {
  try {
    const items = await q('SELECT * FROM sermons ORDER BY published_at DESC, id DESC');
    res.render('sermons', { title: 'Sermons', items });
  } catch (err) {
    return next(err);
  }
});

router.post('/sermons', requireLogin, requireStaffWeb, async (req, res, next) => {
  try {
    const { youtube_id, title, speaker, series, scripture, description, published_at, is_featured, visible } = req.body;
    await q('INSERT INTO sermons (youtube_id,title,speaker,series,scripture,description,published_at,is_featured,visible) VALUES (?,?,?,?,?,?,?,?,?)', [youtube_id, title, speaker || null, series || null, scripture || null, description || null, published_at || null, is_featured ? 1 : 0, visible === '0' ? 0 : 1]);
    setFlash(req, 'success', 'Sermon saved.');
    res.redirect('/admin/sermons');
  } catch (err) {
    setFlash(req, 'error', err.message);
    res.redirect('/admin/sermons');
  }
});

/* ---------------- resources ---------------- */

router.get('/resources', requireLogin, requireStaffWeb, async (req, res, next) => {
  try {
    const items = await q('SELECT r.*, m.name ministry_name FROM resources r LEFT JOIN ministries m ON m.id=r.ministry_id ORDER BY r.sort_order,r.id');
    const ministries = await q('SELECT id,name FROM ministries ORDER BY name');
    res.render('resources', { title: 'Library', items, ministries });
  } catch (err) {
    return next(err);
  }
});

router.post('/resources', requireLogin, requireStaffWeb, async (req, res, next) => {
  try {
    const { title, kind, format, ministry_id, description, file_url, is_published, sort_order } = req.body;
    await q('INSERT INTO resources (title,kind,format,ministry_id,description,file_url,is_published,sort_order) VALUES (?,?,?,?,?,?,?,?)', [title, kind || 'book', format || null, ministry_id || null, description || null, file_url || null, is_published === '0' ? 0 : 1, sort_order || 0]);
    setFlash(req, 'success', 'Resource added.');
    res.redirect('/admin/resources');
  } catch (err) {
    setFlash(req, 'error', err.message);
    res.redirect('/admin/resources');
  }
});

/* ---------------- media upload ---------------- */

router.get('/media', requireLogin, requireStaffWeb, async (req, res, next) => {
  try {
    const items = await q('SELECT * FROM media_assets ORDER BY id DESC LIMIT 200');
    res.render('media', { title: 'Media uploads', items });
  } catch (err) {
    return next(err);
  }
});

router.post('/media', requireLogin, requireStaffWeb, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.redirect('/admin/media');
    const tmp = req.file.path;
    const ext = path.extname(req.file.originalname || '');
    const finalName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    const finalPath = path.join(config.uploadsDir, finalName);
    fs.renameSync(tmp, finalPath);
    const url = `${config.publicBaseUrl}/uploads/${finalName}`;
    const kind = (req.file.mimetype || '').startsWith('image/') ? 'image' : (req.file.mimetype || '').startsWith('video/') ? 'video' : (req.file.mimetype || '').startsWith('audio/') ? 'audio' : 'document';
    await q('INSERT INTO media_assets (filename,original_name,path,url,mime,size_bytes,kind,title,uploaded_by) VALUES (?,?,?,?,?,?,?,?,?)', [finalName, req.file.originalname, finalPath, url, req.file.mimetype, req.file.size, kind, req.body?.title || req.file.originalname, req.user.id]);
    setFlash(req, 'success', 'File uploaded.');
    res.redirect('/admin/media');
  } catch (err) {
    setFlash(req, 'error', err.message);
    res.redirect('/admin/media');
  }
});

/* ---------------- prayer ---------------- */

router.get('/prayer', requireLogin, requireStaffWeb, async (req, res, next) => {
  try {
    const items = await q('SELECT p.*, u.name author_name, m.name ministry_name FROM prayer_requests p LEFT JOIN users u ON u.id=p.author_id LEFT JOIN ministries m ON m.id=p.ministry_id ORDER BY p.id DESC LIMIT 100');
    res.render('prayer', { title: 'Prayer wall', items });
  } catch (err) {
    return next(err);
  }
});

router.post('/prayer/:id/status', requireLogin, requireStaffWeb, async (req, res, next) => {
  try {
    await q('UPDATE prayer_requests SET status=? WHERE id=?', [req.body.status, req.params.id]);
    setFlash(req, 'success', 'Updated.');
    res.redirect('/admin/prayer');
  } catch (err) {
    setFlash(req, 'error', err.message);
    res.redirect('/admin/prayer');
  }
});

/* ---------------- chat ---------------- */

router.get('/chat', requireLogin, requireStaffWeb, async (req, res, next) => {
  try {
    const rooms = await q('SELECT r.*, m.name ministry_name, (SELECT COUNT(*) FROM chat_members cm WHERE cm.room_id=r.id) members FROM chat_rooms r LEFT JOIN ministries m ON m.id=r.ministry_id ORDER BY r.id');
    const ministries = await q('SELECT id,name FROM ministries ORDER BY name');
    res.render('chat', { title: 'Chat rooms', rooms, ministries });
  } catch (err) {
    return next(err);
  }
});

router.post('/chat', requireLogin, requireStaffWeb, async (req, res, next) => {
  try {
    const { kind, name, ministry_id, description, color, icon } = req.body;
    const slug = String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36);
    await q('INSERT INTO chat_rooms (kind,name,slug,description,ministry_id,color,icon) VALUES (?,?,?,?,?,?,?)', [kind || 'ministry', name, slug, description || null, ministry_id || null, color || null, icon || null]);
    setFlash(req, 'success', 'Room created.');
    res.redirect('/admin/chat');
  } catch (err) {
    setFlash(req, 'error', err.message);
    res.redirect('/admin/chat');
  }
});

/* ---------------- notifications ---------------- */

router.get('/notifications', requireLogin, requireStaffWeb, async (req, res, next) => {
  try {
    const items = await q('SELECT n.*, m.name ministry_name FROM notifications n LEFT JOIN ministries m ON m.id=n.ministry_id ORDER BY n.id DESC LIMIT 100');
    const ministries = await q('SELECT id,name FROM ministries ORDER BY name');
    res.render('notifications', { title: 'Notifications', items, ministries });
  } catch (err) {
    return next(err);
  }
});

router.post('/notifications', requireLogin, requireStaffWeb, async (req, res, next) => {
  try {
    const { title, body, link, ministry_id } = req.body;
    if (ministry_id) {
      await q('INSERT INTO notifications (user_id,type,title,body,link,ministry_id) SELECT um.user_id,"ministry",?,?,?,?,? FROM user_ministries um WHERE um.ministry_id=?', [title, body || null, link || null, ministry_id, ministry_id]);
    } else {
      if (req.user.role !== 'admin') { setFlash(req, 'error', 'Church-wide broadcasts need a church admin.'); return res.redirect('/admin/notifications'); }
      await q('INSERT INTO notifications (user_id,type,title,body,link) SELECT id,"broadcast",?,?,? FROM users WHERE is_active=1', [title, body || null, link || null]);
    }
    setFlash(req, 'success', 'Notification sent.');
    res.redirect('/admin/notifications');
  } catch (err) {
    setFlash(req, 'error', err.message);
    res.redirect('/admin/notifications');
  }
});

/* ---------------- giving ---------------- */

router.get('/giving', requireLogin, requireStaffWeb, async (req, res, next) => {
  try {
    const donations = await q('SELECT * FROM donations ORDER BY id DESC LIMIT 100');
    const totals = await q("SELECT fund,status,COUNT(*) c,COALESCE(SUM(amount),0) t FROM donations GROUP BY fund,status ORDER BY fund,status");
    const funds = await q('SELECT * FROM giving_funds ORDER BY sort_order, id');
    const raised = await q(
      "SELECT fund, COALESCE(SUM(amount),0) AS total, COUNT(*) AS gifts FROM donations WHERE status='completed' GROUP BY fund"
    );
    const raisedByFund = Object.fromEntries(raised.map((r) => [r.fund, r]));
    res.render('giving', { title: 'Giving', donations, totals, funds, raisedByFund });
  } catch (err) {
    return next(err);
  }
});

/* ---- giving purposes -------------------------------------------------
   The pills in the app come from this table, so adding a drive is a form
   submission rather than a release. Slugs are generated once and never
   change, because donations store the slug, not the id. */

function fundSlug(input) {
  return (
    String(input || '')
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'fund'
  );
}

router.post('/giving/funds', requireLogin, requireStaffWeb, async (req, res, next) => {
  try {
    const name = String(req.body?.name || '').trim();
    if (!name) throw new Error('Give the purpose a name first.');

    let slug = fundSlug(req.body?.slug || name);
    if (await one('SELECT id FROM giving_funds WHERE slug = ?', [slug])) {
      slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
    }

    const kind = ['tithe', 'offering', 'project', 'charity'].includes(req.body?.kind)
      ? req.body.kind
      : 'project';
    const goal = Number(req.body?.goal_amount);
    const sort = Number(req.body?.sort_order);

    await q(
      `INSERT INTO giving_funds (name, slug, kind, blurb, goal_amount, sort_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [
        name.slice(0, 80),
        slug,
        kind,
        String(req.body?.blurb || '').trim().slice(0, 190) || null,
        Number.isFinite(goal) && goal > 0 ? goal : null,
        Number.isFinite(sort) ? sort : 0,
      ]
    );
    setFlash(req, 'success', `“${name}” is now a giving purpose, and it is live in the app.`);
    res.redirect('/admin/giving');
  } catch (err) {
    setFlash(req, 'error', err.message);
    res.redirect('/admin/giving');
  }
});

router.post('/giving/funds/:id', requireLogin, requireStaffWeb, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) throw new Error('Unknown purpose.');

    const name = String(req.body?.name || '').trim();
    if (!name) throw new Error('A purpose needs a name.');

    const kind = ['tithe', 'offering', 'project', 'charity'].includes(req.body?.kind)
      ? req.body.kind
      : 'project';
    const goal = Number(req.body?.goal_amount);
    const sort = Number(req.body?.sort_order);

    await q(
      `UPDATE giving_funds
          SET name = ?, kind = ?, blurb = ?, goal_amount = ?, sort_order = ?, is_active = ?
        WHERE id = ?`,
      [
        name.slice(0, 80),
        kind,
        String(req.body?.blurb || '').trim().slice(0, 190) || null,
        Number.isFinite(goal) && goal > 0 ? goal : null,
        Number.isFinite(sort) ? sort : 0,
        req.body?.is_active ? 1 : 0,
        id,
      ]
    );
    setFlash(req, 'success', 'Purpose updated.');
    res.redirect('/admin/giving');
  } catch (err) {
    setFlash(req, 'error', err.message);
    res.redirect('/admin/giving');
  }
});

router.post('/giving/funds/:id/delete', requireLogin, requireStaffWeb, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) throw new Error('Unknown purpose.');

    const fund = await one('SELECT * FROM giving_funds WHERE id = ?', [id]);
    if (!fund) throw new Error('That purpose is already gone.');

    const used = await one('SELECT COUNT(*) AS c FROM donations WHERE fund = ?', [fund.slug]);
    if (used?.c) {
      /* History must keep its label, so a used purpose is retired, not erased. */
      await q('UPDATE giving_funds SET is_active = 0 WHERE id = ?', [id]);
      setFlash(req, 'success', `“${fund.name}” has ${used.c} gift(s) on record, so it was hidden instead of deleted.`);
    } else {
      await q('DELETE FROM giving_funds WHERE id = ?', [id]);
      setFlash(req, 'success', `“${fund.name}” removed.`);
    }
    res.redirect('/admin/giving');
  } catch (err) {
    setFlash(req, 'error', err.message);
    res.redirect('/admin/giving');
  }
});

router.post('/giving/settle', requireLogin, requireStaffWeb, async (req, res, next) => {
  try {
    const { reference, status } = req.body;
    await q('UPDATE donations SET status=?, paid_at=IF(?="completed",UTC_TIMESTAMP(),paid_at) WHERE reference=?', [status, status, reference]);
    setFlash(req, 'success', 'Updated.');
    res.redirect('/admin/giving');
  } catch (err) {
    setFlash(req, 'error', err.message);
    res.redirect('/admin/giving');
  }
});

/* ---------------- audit ---------------- */

router.get('/audit', requireLogin, requireStaffWeb, async (req, res, next) => {
  try {
    const items = await q('SELECT a.*, u.name actor_name, m.name ministry_name FROM audit_log a LEFT JOIN users u ON u.id=a.actor_id LEFT JOIN ministries m ON m.id=a.ministry_id ORDER BY a.id DESC LIMIT 200');
    res.render('audit', { title: 'Audit log', items });
  } catch (err) {
    return next(err);
  }
});

/* ---------------- settings ---------------- */

router.get('/settings', requireLogin, requireChurchAdminWeb, async (req, res, next) => {
  try {
    const items = await q('SELECT key_name,value,updated_at FROM settings ORDER BY key_name');
    res.render('settings', { title: 'Settings', items });
  } catch (err) {
    return next(err);
  }
});

router.post('/settings', requireLogin, requireChurchAdminWeb, async (req, res, next) => {
  try {
    for (const [k, v] of Object.entries(req.body)) {
      if (k === '_csrf') continue;
      await q('INSERT INTO settings (key_name,value) VALUES (?,?) ON DUPLICATE KEY UPDATE value=VALUES(value)', [k, String(v ?? '')]);
    }
    setFlash(req, 'success', 'Settings saved.');
    res.redirect('/admin/settings');
  } catch (err) {
    setFlash(req, 'error', err.message);
    res.redirect('/admin/settings');
  }
});

export default router;
