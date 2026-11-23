import { createHash } from 'node:crypto';
import { config } from '../config.js';
import { q } from '../db/index.js';

/**
 * PayFast custom integration (redirect / off-site).
 * Docs: https://developers.payfast.co.za/docs
 *
 * Signature: parameters sorted by key, empty values dropped, joined as
 * `k=v&k=v` with URL encoding, then `&passphrase=…` appended raw when a
 * passphrase is configured, MD5 lower-case hex.
 */

const PROCESS = {
  sandbox: 'https://sandbox.payfast.co.za/eng/process',
  live: 'https://www.payfast.co.za/eng/process',
};
const VALIDATE = {
  sandbox: 'https://sandbox.payfast.co.za/eng/query/validate',
  live: 'https://www.payfast.co.za/eng/query/validate',
};

export const PAYFAST_STATUS = {
  COMPLETE: 'COMPLETE',
  PENDING: 'PENDING',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
};

/**
 * Settings live in the DB so the office can change the merchant without a
 * redeploy; the .env values are the fallback.
 */
export async function loadPayfastSettings() {
  const rows = await q(
    `SELECT key_name, value FROM settings WHERE key_name LIKE 'payfast\\_%'`
  ).catch(() => []);
  const stored = Object.fromEntries(rows.map((r) => [r.key_name, r.value]));

  const pick = (storedKey, fallback) => {
    const value = stored[storedKey];
    return value === undefined || value === '' ? fallback : value;
  };

  return {
    merchantId: pick('payfast_merchant_id', config.payfast.merchantId),
    merchantKey: pick('payfast_merchant_key', config.payfast.merchantKey),
    passphrase: pick('payfast_passphrase', config.payfast.passphrase),
    mode: pick('payfast_mode', config.payfast.mode) === 'live' ? 'live' : 'sandbox',
    enabled: pick('payfast_enabled', '1') === '1',
  };
}

export function isConfigured(settings) {
  return Boolean(settings?.merchantId && settings?.merchantKey);
}

export function processUrl(mode) {
  return PROCESS[mode === 'live' ? 'live' : 'sandbox'];
}

export function validateUrl(mode) {
  return VALIDATE[mode === 'live' ? 'live' : 'sandbox'];
}

export function generateSignature(params, passphrase = '') {
  const clean = Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined);
  clean.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  let query = new URLSearchParams(clean).toString();
  if (passphrase) query += `&passphrase=${passphrase}`;
  return createHash('md5').update(query).digest('hex');
}

/**
 * Build the hidden fields for the PayFast form. `baseUrl` is the public origin
 * of this server, so return/cancel/notify all come back here.
 */
export function buildPaymentFields({
  settings,
  baseUrl,
  reference,
  amount,
  itemName,
  itemDescription,
  firstName,
  lastName,
  email,
}) {
  const params = {
    merchant_id: settings.merchantId,
    merchant_key: settings.merchantKey,
    return_url: `${baseUrl}/payfast/return`,
    cancel_url: `${baseUrl}/payfast/cancel`,
    notify_url: `${baseUrl}/payfast/itn`,
    m_payment_id: reference,
    amount: Number(amount).toFixed(2),
    item_name: itemName,
    item_description: itemDescription,
    name_first: firstName || 'Joy',
    name_last: lastName || 'Member',
    email_address: email || '',
  };
  params.signature = generateSignature(params, settings.passphrase);
  return params;
}

/** Ask PayFast whether the ITN payload is genuine. Authoritative check. */
export async function validateItnWithPayfast(payload, mode) {
  try {
    const body = new URLSearchParams(payload).toString();
    const res = await fetch(validateUrl(mode), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: AbortSignal.timeout(20000),
    });
    const text = (await res.text()).trim().toUpperCase();
    return res.ok && text.startsWith('VALID');
  } catch (err) {
    console.warn('[payfast] ITN validation failed:', err.message);
    return false;
  }
}

/** Compare the ITN's gross amount with what we asked for. */
export function amountMatches(expected, received) {
  const a = Number(expected);
  const b = Number(received);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  return Math.abs(a - b) < 0.01;
}
