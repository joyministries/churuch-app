import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const serverRoot = path.resolve(here, '..');

const port = Number(process.env.PORT || 38799);

export const config = {
  env: process.env.NODE_ENV || 'development',
  port,
  /** Public origin used for PayFast return/cancel/notify URLs and upload URLs. */
  publicBaseUrl: (process.env.PUBLIC_BASE_URL || `http://localhost:${port}`).replace(/\/$/, ''),
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  sessionSecret: process.env.SESSION_SECRET || 'dev-session-secret-change-me',
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'joy',
    password: process.env.DB_PASSWORD || 'joylocal',
    database: process.env.DB_NAME || 'joy_church',
    connectionLimit: Number(process.env.DB_POOL || 10),
    charset: 'utf8mb4',
    /* Shared cPanel hosting is normally plain TCP; a managed host (Vercel-side
       add-ons, PlanetScale-style) needs TLS, so it is opt-in. */
    ssl: process.env.DB_SSL === '1' ? { rejectUnauthorized: false } : undefined,
  },
  uploadsDir: process.env.UPLOADS_DIR || path.join(serverRoot, 'uploads'),
  maxUploadMb: Number(process.env.MAX_UPLOAD_MB || 25),
  payfast: {
    merchantId: process.env.PAYFAST_MERCHANT_ID || '',
    merchantKey: process.env.PAYFAST_MERCHANT_KEY || '',
    passphrase: process.env.PAYFAST_PASSPHRASE || '',
    mode: process.env.PAYFAST_MODE === 'live' ? 'live' : 'sandbox',
  },
  seedOnBoot: process.env.SEED === '1',
};

export function isProd() {
  return config.env === 'production';
}
