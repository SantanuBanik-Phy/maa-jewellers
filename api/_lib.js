/* Shared server helpers for the Vercel functions in /api (no npm packages needed).
 *
 * Environment variables (Vercel → Project → Settings → Environment Variables):
 *   FIREBASE_SERVICE_ACCOUNT   whole JSON key of a Firebase service account (Project settings → Service accounts)
 *   SSLCZ_STORE_ID             SSLCommerz store id
 *   SSLCZ_STORE_PASSWORD       SSLCommerz store password (API password, not the panel login)
 *   SSLCZ_LIVE                 "true" for real payments, anything else = sandbox (test cards)
 *   SHEET_URL                  optional — Google Apps Script /exec URL (for emails); defaults to the site's
 *   SHEET_SECRET               optional — same value as SETTINGS.SECRET in Code.gs (for emails)
 * Underscore files in /api are helpers, not endpoints.
 */
'use strict';
const crypto = require('crypto');

const ADMIN_EMAIL = 'santanubanik2k@gmail.com';
const ORDER_RE = /^MJ-[0-9]{6}-[0-9]{6}-[A-Z0-9]{4}$/;
const CARATS = ['k22', 'k21', 'k18', 'trad'];
const DEFAULT_SHEET = 'https://script.google.com/macros/s/AKfycbx57QPz_0xrFiQNwMC4FF7WiljoTLHs-5Yz63TXuqIsN-C5WB1jj1YMlReDC2vroNjeRg/exec';

let _fetch = (...a) => fetch(...a);           // swapped out in tests
const setFetch = (f) => { _fetch = f; };

function serviceAccount() {
  try {
    const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '');
    return sa && sa.client_email && sa.private_key && sa.project_id ? sa : null;
  } catch (e) { return null; }
}
const sslConfigured = () => !!(process.env.SSLCZ_STORE_ID && process.env.SSLCZ_STORE_PASSWORD && serviceAccount());
const sslLive = () => String(process.env.SSLCZ_LIVE || '').toLowerCase() === 'true';
const sslHost = () => (sslLive() ? 'https://securepay.sslcommerz.com' : 'https://sandbox.sslcommerz.com');

/* ---------- Google OAuth token from the service account (RS256 JWT) ---------- */
let tok = null;
const b64u = (x) => Buffer.from(typeof x === 'string' ? x : JSON.stringify(x)).toString('base64url');
async function accessToken() {
  if (tok && tok.exp > Date.now() + 60000) return tok.v;
  const sa = serviceAccount(); if (!sa) throw new Error('no_service_account');
  const now = Math.floor(Date.now() / 1000);
  const unsigned = b64u({ alg: 'RS256', typ: 'JWT' }) + '.' + b64u({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/datastore', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 });
  const sig = crypto.createSign('RSA-SHA256').update(unsigned).sign(sa.private_key).toString('base64url');
  const r = await _fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: unsigned + '.' + sig }).toString() });
  const j = await r.json();
  if (!j.access_token) throw new Error('token_failed');
  tok = { v: j.access_token, exp: Date.now() + (j.expires_in || 3600) * 1000 };
  return tok.v;
}

/* ---------- Firestore REST (service account bypasses the security rules) ---------- */
const docsBase = () => `https://firestore.googleapis.com/v1/projects/${serviceAccount().project_id}/databases/(default)/documents`;
function dec(v) {
  if (!v || typeof v !== 'object') return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return Number(v.doubleValue);
  if ('booleanValue' in v) return v.booleanValue;
  if ('nullValue' in v) return null;
  if ('timestampValue' in v) return Date.parse(v.timestampValue);
  if ('mapValue' in v) return decFields(v.mapValue.fields || {});
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(dec);
  return null;
}
const decFields = (f) => Object.fromEntries(Object.entries(f || {}).map(([k, v]) => [k, dec(v)]));
function enc(x) {
  if (x === null || x === undefined) return { nullValue: null };
  if (typeof x === 'boolean') return { booleanValue: x };
  if (typeof x === 'number') return Number.isInteger(x) ? { integerValue: String(x) } : { doubleValue: x };
  if (typeof x === 'string') return { stringValue: x };
  if (Array.isArray(x)) return { arrayValue: { values: x.map(enc) } };
  return { mapValue: { fields: encFields(x) } };
}
const encFields = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined).map(([k, v]) => [k, enc(v)]));

async function getDoc(path) {
  const r = await _fetch(`${docsBase()}/${path}`, { headers: { authorization: 'Bearer ' + await accessToken() } });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error('firestore_get_' + r.status);
  const j = await r.json();
  return decFields(j.fields);
}
async function listDocs(collection, pageSize) {
  const r = await _fetch(`${docsBase()}/${collection}?pageSize=${pageSize || 50}`, { headers: { authorization: 'Bearer ' + await accessToken() } });
  if (!r.ok) return [];
  const j = await r.json();
  return (j.documents || []).map(d => decFields(d.fields));
}
/* merge top-level fields into a document (creates it if missing) */
async function patchDoc(path, data) {
  const mask = Object.keys(data).map(k => 'updateMask.fieldPaths=' + encodeURIComponent(k)).join('&');
  const r = await _fetch(`${docsBase()}/${path}?${mask}`, { method: 'PATCH', headers: { authorization: 'Bearer ' + await accessToken(), 'content-type': 'application/json' },
    body: JSON.stringify({ fields: encFields(data) }) });
  if (!r.ok) throw new Error('firestore_patch_' + r.status);
  return true;
}

/* ---------- price check: the order must match the shop's published rates ---------- */
const sameRates = (a, b) => !!(a && b) && CARATS.every(k => Math.round(+a[k] || 0) === Math.round(+b[k] || 0));
async function verifyOrder(o) {
  const [rates, settings, hist] = await Promise.all([getDoc('public/rates'), getDoc('public/settings'), listDocs('rateHistory', 60)]);
  const st = settings || {};
  const ratesOk = !rates || sameRates(o.rates, rates) || hist.some(h => sameRates(o.rates, h));
  const making = +o.making || 0, minMaking = st.making != null ? +st.making : 6;
  const fee = st.deliveryFee != null ? +st.deliveryFee : 150;
  const ship = o.delivery && o.delivery.method === 'home' ? fee : 0;
  const goods = (o.items || []).reduce((s, l) => s + (+l.tb || 0) * (+(o.rates || {})[l.carat] || 0) * (1 + making / 100), 0);
  const expect = Math.round(goods + ship);
  const ok = ratesOk && making >= minMaking - 0.01 && Math.abs(expect - Math.round(+o.grand || 0)) <= Math.max(3, expect * 0.001)
    && Math.round(+((o.delivery || {}).fee) || 0) === ship;
  const advancePct = st.advancePct != null ? Math.min(100, Math.max(5, +st.advancePct)) : 30;
  const advance = Math.min(expect, Math.round((expect - ship) * advancePct / 100) + ship);
  return { ok, expect, ship, advance, reason: ok ? '' : !ratesOk ? 'rates' : making < minMaking - 0.01 ? 'making' : 'total' };
}

/* ---------- Firebase ID token check (admin only) ---------- */
let certs = null;
async function verifyAdminToken(idToken) {
  const sa = serviceAccount(); if (!sa || !idToken) return false;
  const [h, p, s] = String(idToken).split('.'); if (!s) return false;
  let head, pay;
  try { head = JSON.parse(Buffer.from(h, 'base64url').toString()); pay = JSON.parse(Buffer.from(p, 'base64url').toString()); } catch (e) { return false; }
  if (!certs || certs.exp < Date.now()) {
    const r = await _fetch('https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com');
    certs = { keys: await r.json(), exp: Date.now() + 3600 * 1000 };
  }
  const cert = certs.keys[head.kid]; if (!cert || head.alg !== 'RS256') return false;
  const okSig = crypto.createVerify('RSA-SHA256').update(h + '.' + p).verify(cert, Buffer.from(s, 'base64url'));
  const now = Math.floor(Date.now() / 1000);
  return okSig && pay.aud === sa.project_id && pay.iss === 'https://securetoken.google.com/' + sa.project_id && pay.exp > now
    && pay.email === ADMIN_EMAIL && pay.email_verified === true;
}

/* ---------- emails go out through the shop's Google Apps Script (MailApp) ---------- */
async function sheetMail(payload) {
  const url = process.env.SHEET_URL || DEFAULT_SHEET, secret = process.env.SHEET_SECRET;
  if (!url || !secret) return { ok: false, skipped: true };
  try {
    const r = await _fetch(url, { method: 'POST', headers: { 'content-type': 'text/plain;charset=utf-8' }, body: JSON.stringify(Object.assign({ type: 'mail', secret }, payload)), redirect: 'follow' });
    return await r.json().catch(() => ({ ok: r.ok }));
  } catch (e) { return { ok: false }; }
}
function mailPayload(o, status, extra) {
  const c = o.customer || {};
  return Object.assign({
    kind: 'status', id: o.id, status, lang: o.lang || 'bn', to: c.email || '', name: c.name || '', phone: c.phone || '',
    grand: Math.round(+o.grand || 0), paid: o.pay ? Math.round(+o.pay.amount || 0) : 0, due: o.pay ? Math.round(+o.pay.due || 0) : Math.round(+o.grand || 0),
    method: o.pay ? o.pay.method : '', delivery: (o.delivery || {}).method || 'pickup',
    items: (o.items || []).map(l => ({ name: l.title_en || l.name || l.cat, name_bn: l.title_bn || l.name || '', carat: l.carat, qty: l.qty || 1, total: Math.round(+l.total || 0) }))
  }, extra || {});
}

/* ---------- http helpers ---------- */
function send(res, code, obj) { res.statusCode = code; res.setHeader('content-type', 'application/json'); res.setHeader('cache-control', 'no-store'); res.end(JSON.stringify(obj)); }
function redirect(res, url) { res.statusCode = 303; res.setHeader('location', url); res.setHeader('cache-control', 'no-store'); res.end(); }
function origin(req) {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, '');
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return (req.headers['x-forwarded-proto'] || 'https') + '://' + host;
}
async function body(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch (e) { return Object.fromEntries(new URLSearchParams(req.body)); } }
  return {};
}

module.exports = { ADMIN_EMAIL, ORDER_RE, setFetch, serviceAccount, sslConfigured, sslLive, sslHost, getDoc, listDocs, patchDoc, verifyOrder,
  verifyAdminToken, sheetMail, mailPayload, send, redirect, origin, body, enc, dec, sameRates, http: (...a) => _fetch(...a) };
