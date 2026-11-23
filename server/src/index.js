import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import session from 'express-session';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initSchema, ping } from './db/index.js';
import seed from './db/seed.js';
import { config } from './config.js';
import { loadSessionUser, flashLocals } from './middleware/web.js';

import authRoutes from './routes/auth.js';
import contentRoutes from './routes/content.js';
import eventsRoutes from './routes/events.js';
import chatRoutes from './routes/chat.js';
import givingRoutes from './routes/giving.js';
import prayerRoutes from './routes/prayer.js';
import growthRoutes from './routes/growth.js';
import notificationRoutes from './routes/notifications.js';
import adminRoutes from './routes/admin.js';
import payfastRoutes from './routes/payfast.js';
import adminWebRoutes from './routes/adminWeb.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(here, '..');

await initSchema();
console.log('[db] ping:', await ping());

if (process.env.SEED === '1') {
  await seed();
}

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(serverRoot, 'views'));
app.locals.appName = 'Joy Ministries Admin';

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(morgan('dev'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use('/uploads', express.static(config.uploadsDir));
app.use(express.static(path.join(serverRoot, 'public')));

app.use(
  session({
    name: 'joy_admin',
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'lax', secure: false, maxAge: 1000 * 60 * 60 * 8 },
  })
);
app.use(loadSessionUser);
app.use(flashLocals);

/* ---------------- API ---------------- */
app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/giving', givingRoutes);
app.use('/api/prayer', prayerRoutes);
app.use('/api/growth', growthRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

/* ---------------- PayFast + admin web ---------------- */
/* Admin and checkout pages are rendered per request; never let a browser keep
   an old copy after a deploy. */
app.use(['/admin', '/payfast'], (req, res, next) => {
  res.set('Cache-Control', 'no-store, must-revalidate');
  res.set('Pragma', 'no-cache');
  next();
});
app.use('/payfast', payfastRoutes);
app.use('/admin', adminWebRoutes);

app.get('/health', async (req, res) => {
  try {
    const { scalar } = await import('./db/index.js');
    const c = await scalar('SELECT COUNT(*) AS c FROM users');
    res.json({ ok: true, users: c });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.use((err, req, res, next) => {
  console.error(err);
  if (req.path.startsWith('/api/')) return res.status(500).json({ error: 'Internal server error.' });
  return res.status(500).render('error', { title: 'Error', status: 500, message: err.message });
});

const port = config.port;
app.listen(port, () => {
  console.log(`Church server running on http://localhost:${port}`);
});
