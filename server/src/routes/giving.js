import { Router } from 'express';
import { randomBytes } from 'node:crypto';
import { q, one } from '../db/index.js';
import { authenticate, optionalAuth, requireStaff, requireAdmin,  } from '../middleware/auth.js';
import { audit } from '../services/audit.js';
import { config } from '../config.js';
import { loadPayfastSettings, isConfigured } from '../services/payfast.js';

const router = Router();

const FUNDS = new Set(['tithe', 'offering', 'missions', 'building', 'welfare']);

function reference() {
  const stamp = Date.now().toString(36).toUpperCase();
  const salt = randomBytes(3).toString('hex').toUpperCase();
  return `JM-${stamp}-${salt}`;
}

/** Donor's own giving history. */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const rows = await q(
      `SELECT id, fund, amount, currency, method, gateway, reference, status, created_at, paid_at
         FROM donations WHERE donor_id = ? ORDER BY id DESC LIMIT 50`,
      [req.user.id]
    );
    return res.json(rows);
  } catch (err) {
    return next(err);
  }
});

/** Office capture of cash / EFT gifts — never exposed to members. */
router.post('/', authenticate, requireStaff, audit('giving.manual', (req) => `giving:${req.body?.amount}`), async (req, res, next) => {
  try {
    const amount = Number(req.body?.amount);
    if (!(amount > 0)) return res.status(400).json({ error: 'Valid amount required.' });
    const method = ['card', 'eft', 'cash'].includes(req.body?.method) ? req.body.method : 'cash';
    const fund = FUNDS.has(String(req.body?.fund)) ? String(req.body.fund) : 'tithe';
    const ref = req.body?.reference ? String(req.body.reference) : reference();

    const result = await q(
      `INSERT INTO donations
        (donor_id, fund, amount, currency, method, gateway, reference, status, donor_name, donor_email, message, paid_at)
       VALUES (?, ?, ?, 'ZAR', ?, 'manual', ?, 'completed', ?, ?, ?, UTC_TIMESTAMP())`,
      [
        req.body?.donor_id ? Number(req.body.donor_id) : null,
        fund,
        amount,
        method,
        ref,
        req.body?.donor_name ?? null,
        req.body?.donor_email ?? null,
        req.body?.message ?? null,
      ]
    );
    return res.status(201).json(await one('SELECT * FROM donations WHERE id = ?', [result.insertId]));
  } catch (err) {
    return next(err);
  }
});

/** Totals for the admin dashboard. */
router.get('/summary', authenticate, requireStaff, async (req, res, next) => {
  try {
    const totals = await q(
      `SELECT fund, status, COUNT(*) AS count, COALESCE(SUM(amount), 0) AS total
         FROM donations GROUP BY fund, status ORDER BY fund, status`
    );
    const month = await one(
      `SELECT COALESCE(SUM(amount), 0) AS total, COUNT(*) AS count
         FROM donations
        WHERE status = 'completed' AND paid_at >= DATE_FORMAT(UTC_TIMESTAMP(), '%Y-%m-01')`
    );
    const recent = await q(
      `SELECT id, fund, amount, currency, method, status, reference, donor_name, created_at
         FROM donations ORDER BY id DESC LIMIT 25`
    );
    return res.json({ totals, month, recent });
  } catch (err) {
    return next(err);
  }
});

/**
 * Start a PayFast checkout. No sign-in required: guests can give, and the
 * donation row records whatever name/email they choose to leave.
 */
router.post('/payfast', optionalAuth, audit('giving.payfast.initiate', (req) => `giving:${req.body?.amount}`), async (req, res, next) => {
  try {
    const amount = Number(req.body?.amount);
    if (!(amount > 0)) return res.status(400).json({ error: 'Enter an amount.' });
    if (amount < 5) return res.status(400).json({ error: 'The minimum online gift is R5.' });
    if (amount > 500000) return res.status(400).json({ error: 'That amount is too large for an online gift.' });

    const settings = await loadPayfastSettings();
    if (!settings.enabled) return res.status(503).json({ error: 'Online giving is paused.' });
    if (!isConfigured(settings)) {
      return res.status(503).json({ error: 'PayFast is not configured yet. Please give at the office.' });
    }

    const fund = FUNDS.has(String(req.body?.fund)) ? String(req.body.fund) : 'tithe';
    const ref = reference();
    const donorName = typeof req.body?.donor_name === 'string' ? req.body.donor_name.trim() : null;
    const donorEmail = typeof req.body?.donor_email === 'string' ? req.body.donor_email.trim() : null;

    await q(
      `INSERT INTO donations
        (donor_id, fund, amount, currency, method, gateway, reference, status, donor_name, donor_email, message)
       VALUES (?, ?, ?, 'ZAR', 'online', 'payfast', ?, 'pending', ?, ?, ?)`,
      [
        req.user?.id ?? null,
        fund,
        amount,
        ref,
        donorName,
        donorEmail,
        req.body?.message ?? null,
      ]
    );

    return res.status(201).json({
      reference: ref,
      amount,
      fund,
      gateway: 'payfast',
      /* Hosted page on this server: it holds the merchant credentials and
         auto-submits the signed form, so the app only needs to open a URL. */
      checkout_url: `${config.publicBaseUrl}/payfast/checkout/${ref}`,
      status_url: `${config.publicBaseUrl}/api/giving/payfast/${ref}`,
    });
  } catch (err) {
    return next(err);
  }
});

/** Poll one donation (the app uses this after returning from PayFast). */
router.get('/payfast/:reference', optionalAuth, async (req, res, next) => {
  try {
    const row = await one(
      `SELECT reference, amount, currency, fund, status, gateway, paid_at, created_at
         FROM donations WHERE reference = ?`,
      [req.params.reference]
    );
    if (!row) return res.status(404).json({ error: 'Not found.' });
    return res.json(row);
  } catch (err) {
    return next(err);
  }
});

/** Admin override for a stuck or offline payment. */
router.post('/:reference/settle', authenticate, requireAdmin, audit('giving.settle', (req) => `giving:${req.params.reference}`), async (req, res, next) => {
  try {
    const status = ['completed', 'failed', 'cancelled', 'refunded'].includes(req.body?.status)
      ? req.body.status
      : 'completed';
    await q(
      `UPDATE donations SET status = ?, paid_at = IF(? = 'completed', UTC_TIMESTAMP(), paid_at) WHERE reference = ?`,
      [status, status, req.params.reference]
    );
    return res.json(await one('SELECT * FROM donations WHERE reference = ?', [req.params.reference]));
  } catch (err) {
    return next(err);
  }
});

export default router;
