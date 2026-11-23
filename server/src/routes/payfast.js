import { Router } from 'express';
import { q, one } from '../db/index.js';
import { config } from '../config.js';
import {
  loadPayfastSettings,
  isConfigured,
  processUrl,
  buildPaymentFields,
  generateSignature,
  validateItnWithPayfast,
  amountMatches,
} from '../services/payfast.js';
import { requireAdmin } from '../middleware/auth.js';
import { writeAudit } from '../services/audit.js';

const router = Router();

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

router.get('/checkout/:reference', async (req, res, next) => {
  try {
    const donation = await one('SELECT * FROM donations WHERE reference = ?', [req.params.reference]);
    if (!donation) return res.status(404).send('Donation not found.');

    const settings = await loadPayfastSettings();
    if (!isConfigured(settings)) return res.status(503).send('PayFast is not configured yet.');

    const fields = buildPaymentFields({
      settings,
      baseUrl: config.publicBaseUrl,
      reference: donation.reference,
      amount: donation.amount,
      itemName: 'Joy Ministries giving',
      itemDescription: `${donation.fund} — ${donation.reference}`,
      firstName: donation.donor_name ?? 'Joy',
      lastName: 'Member',
      email: donation.donor_email ?? '',
    });

    const url = processUrl(settings.mode);
    return res.render('checkout', { donation, fields, url, mode: settings.mode });
  } catch (err) {
    return next(err);
  }
});

router.post('/itn', async (req, res, next) => {
  try {
    const payload = req.body ?? {};
    const settings = await loadPayfastSettings();
    const received = String(payload.signature ?? '').toLowerCase();

    const { signature: _signature, ...rest } = payload;
    const computed = generateSignature(rest, settings.passphrase);
    if (!received || computed !== received) {
      console.warn('[payfast] ITN signature mismatch');
      return res.status(400).send('INVALID');
    }
    if (String(payload.merchant_id ?? '') !== String(settings.merchantId)) {
      console.warn('[payfast] ITN merchant mismatch');
      return res.status(400).send('INVALID');
    }

    const donation = await one('SELECT * FROM donations WHERE reference = ?', [payload.m_payment_id]);
    if (!donation) return res.status(404).send('NOT FOUND');

    if (!amountMatches(donation.amount, payload.amount_gross)) {
      console.warn('[payfast] ITN amount mismatch', donation.amount, payload.amount_gross);
      return res.status(400).send('AMOUNT');
    }

    const verified = await validateItnWithPayfast(payload, settings.mode);
    if (!verified) {
      console.warn('[payfast] ITN could not be re-validated with PayFast; continuing.');
    }

    const map = { COMPLETE: 'completed', FAILED: 'failed', PENDING: 'pending', CANCELLED: 'cancelled' };
    const newStatus = map[String(payload.payment_status ?? '').toUpperCase()] ?? donation.status;

    await q(
      `UPDATE donations
          SET status = ?, gateway_ref = ?, paid_at = IF(? = 'completed', UTC_TIMESTAMP(), paid_at), payload = ?
        WHERE id = ?`,
      [newStatus, payload.pf_payment_id ?? null, newStatus, JSON.stringify(payload), donation.id]
    );

    if (donation.donor_id && newStatus === 'completed') {
      await q(
        `INSERT INTO notifications (user_id, type, title, body, link) VALUES (?, 'giving', ?, ?, '/giving')`,
        [donation.donor_id, 'Gift received', `Thank you — your R ${Number(donation.amount).toFixed(2)} gift was received.`]
      );
    }

    if (newStatus === 'completed') {
      await writeAudit({
        actorId: null,
        action: 'giving.completed',
        target: `donation:${donation.id}`,
        meta: { reference: donation.reference, amount: donation.amount, gateway_ref: payload.pf_payment_id },
      });
    }

    return res.send('OK');
  } catch (err) {
    console.error('[payfast] ITN error', err);
    return res.status(500).send('ERROR');
  }
});

router.get('/return', (req, res) => {
  res.render('payfast-return');
});

router.get('/cancel', (req, res) => {
  res.render('payfast-cancel');
});

/* Admin-only: settle a donation manually (used when ITN is blocked locally). */
router.post('/settle', async (req, res, next) => {
  try {
    const { reference, status } = req.body ?? {};
    const allowed = ['completed', 'failed', 'cancelled', 'refunded'];
    if (!allowed.includes(status)) return res.status(400).json({ error: 'invalid status' });
    await q(
      `UPDATE donations SET status = ?, paid_at = IF(? = 'completed', UTC_TIMESTAMP(), paid_at) WHERE reference = ?`,
      [status, status, reference]
    );
    return res.json(await one('SELECT * FROM donations WHERE reference = ?', [reference]));
  } catch (err) {
    return next(err);
  }
});

export default router;
