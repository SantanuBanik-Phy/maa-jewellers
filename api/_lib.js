/* Shared server helpers for the Vercel functions in /api (no npm packages needed).
 *
 * Environment variables (Vercel → Project → Settings → Environment Variables):
 *   FIREBASE_SERVICE_ACCOUNT   whole JSON key of a Firebase service account (Project settings → Service accounts)
 *   SSLCZ_STORE_ID             SSLCommerz store id
 *   SSLCZ_STORE_PASSWORD       SSLCommerz store password (API password, not the panel login)
 *   SSLCZ_LIVE                 "true" for real payments, anything else = sandbox (test cards)
 *   SHEET_URL                  optional — Google Apps Script /exec URL (for emails); defaults to the site's
 *   SHEET_SECRET               optional — same value as SETTINGS.SECRET in Code.gs (for emails)
 *   SMS_SECRET                 optional — key the shop phone's SMS forwarder sends to /api/sms (defaults to SHEET_SECRET)
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
/* values pasted into Vercel sometimes carry spaces, line breaks or quote marks — ignore them */
const envClean = (k) => String(process.env[k] || '').trim().replace(/^["'`]+|["'`]+$/g, '').trim();
const sslId = () => envClean('SSLCZ_STORE_ID'), sslPass = () => envClean('SSLCZ_STORE_PASSWORD');
const sslConfigured = () => !!(sslId() && sslPass() && serviceAccount());
const sslLive = () => envClean('SSLCZ_LIVE').toLowerCase() === 'true';
const sslHost = () => (sslLive() ? 'https://securepay.sslcommerz.com' : 'https://sandbox.sslcommerz.com');

/* ---------- Google OAuth token from the service account (RS256 JWT) ---------- */
const toks = {};
const DS_SCOPE = 'https://www.googleapis.com/auth/datastore', CP_SCOPE = 'https://www.googleapis.com/auth/cloud-platform';
const b64u = (x) => Buffer.from(typeof x === 'string' ? x : JSON.stringify(x)).toString('base64url');
async function accessToken(scope) {
  scope = scope || DS_SCOPE;
  const tok = toks[scope];
  if (tok && tok.exp > Date.now() + 60000) return tok.v;
  const sa = serviceAccount(); if (!sa) throw new Error('no_service_account');
  const now = Math.floor(Date.now() / 1000);
  const unsigned = b64u({ alg: 'RS256', typ: 'JWT' }) + '.' + b64u({ iss: sa.client_email, scope, aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 });
  const sig = crypto.createSign('RSA-SHA256').update(unsigned).sign(sa.private_key).toString('base64url');
  const r = await _fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: unsigned + '.' + sig }).toString() });
  const j = await r.json();
  if (!j.access_token) throw new Error('token_failed');
  toks[scope] = { v: j.access_token, exp: Date.now() + (j.expires_in || 3600) * 1000 };
  return j.access_token;
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
    items: (o.items || []).map(l => ({ name: l.title_en || l.name || l.cat, name_bn: l.title_bn || l.name || '', carat: l.carat, qty: l.qty || 1, total: Math.round(+l.total || 0) })),
    inv: invoiceData(o)
  }, extra || {});
}
/* everything the emailed invoice needs, taken from the order saved in Firestore (never from the browser) */
function invoiceData(o) {
  const T = o.totals || {}, P = o.pay || {}, c = o.customer || {}, r = (x) => Math.round(+x || 0);
  return {
    date: +o.createdAt || Date.now(), rateDate: o.rateDate || '', delivery: (o.delivery || {}).method || 'pickup', grand: r(o.grand),
    customer: { name: c.name || '', phone: c.phone || '', addr: c.addr || '' },
    items: (o.items || []).slice(0, 30).map(l => ({ name: l.title_en || l.name || l.cat || '', name_bn: l.title_bn || l.name || '', carat: l.carat || '', tb: +l.tb || 0,
      qty: +l.qty || 1, rate: r(l.rate), making: r(l.making), total: r(l.total) })),
    totals: { gold: r(T.gold), making: r(T.making), discAmt: r(T.discAmt), vatAmt: r(T.vatAmt), adv: r(T.adv), ship: r(T.ship || (o.delivery || {}).fee) },
    pay: { method: P.method || '', trx: P.trx || '', amount: r(P.amount), due: P.due != null ? r(P.due) : r(o.grand) }
  };
}

/* ---------- free automatic check of bKash / Nagad / Bangla QR payments ----------
 * The shop phone forwards every "money received" SMS to /api/sms. The server keeps it in smsPay/{TRXID}
 * and, when an order with the same TrxID exists, marks it paid (amount and sender number must agree). */
const smsSecret = () => String(process.env.SMS_SECRET || process.env.SHEET_SECRET || '');
const smsConfigured = () => !!(serviceAccount() && smsSecret().length >= 8 && !/^CHANGE-THIS/.test(smsSecret()));
function safeEq(a, b) {
  const x = Buffer.from(String(a || '')), y = Buffer.from(String(b || ''));
  return x.length === y.length && x.length > 0 && crypto.timingSafeEqual(x, y);
}
/* Only alphanumeric sender IDs of the payment companies count — an SMS typed by a person comes from a phone number */
function trustedSender(from) {
  const f = String(from || '').trim();
  if (!f || /^\+?\d{10,}$/.test(f.replace(/[\s-]/g, ''))) return false;   // a personal phone number is never trusted
  return /bkash|nagad|ibbl|islami|cellfin/i.test(f) || /^(16247|16167)$/.test(f);
}
function parseSms(text, from) {
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  const all = String(from || '') + ' ' + t;
  const provider = /bkash/i.test(all) ? 'bKash' : /nagad/i.test(all) ? 'Nagad' : /islami|ibbl|cellfin|qr/i.test(all) ? 'Bangla QR' : 'Other';
  const incoming = /(received|credited|cash ?in|deposit|payment received|জমা|পেয়েছেন)/i.test(t) &&
    !/(you have sent|send money to|cash ?out|payment to|paid to|debited)/i.test(t);
  const trxM = t.match(/(?:Trx\s*ID|TrxId|TxnID|Txn\s*ID|Transaction\s*ID|Trans\.?\s*ID|TXN)\s*[:.#\-]?\s*([A-Z0-9]{6,20})/i);
  const amtM = t.match(/(?:received|credited|amount|tk\.?|bdt|৳)[^0-9]{0,24}([0-9][0-9,]*(?:\.[0-9]{1,2})?)/i);
  const sndM = t.match(/(?:from|sender|by)\s*[:\-]?\s*(?:a\/c\s*)?(?:\+?88)?(01[3-9][0-9]{8})/i) || t.match(/(?:\+?88)?(01[3-9][0-9]{8})/);
  return { provider, incoming, trx: trxM ? trxM[1].toUpperCase() : '', amount: amtM ? parseFloat(amtM[1].replace(/,/g, '')) : 0, sender: sndM ? sndM[1] : '' };
}
const MFS = ['bkash', 'nagad', 'qr'];
const OPEN_ST = ['Pending', 'Amount mismatch'];
const PAID_ST = ['Verified', 'Advance paid'];
const last11 = (s) => String(s || '').replace(/[০-৯]/g, d => '০১২৩৪৫৬৭৮৯'.indexOf(d)).replace(/\D/g, '').slice(-11);
async function matchPayment(id, smsDoc) {
  const o = await getDoc('orders/' + id);
  if (!o) return { ok: false, why: 'no_order' };
  const pay = o.pay || {}, trx = String(pay.trx || '').toUpperCase();
  if (!trx || !MFS.includes(pay.method)) return { ok: false, why: 'not_mfs' };
  if (!OPEN_ST.includes(o.status)) return { ok: true, status: o.status, already: true };
  const s = smsDoc || await getDoc('smsPay/' + trx);
  if (!s) return { ok: false, why: 'no_sms', status: o.status };
  if (s.order && s.order !== id) return { ok: false, why: 'sms_used', status: o.status };
  const need = Math.round(+pay.amount || 0), got = +s.amount || 0;
  const senderOk = !pay.sender || !s.sender || last11(pay.sender) === last11(s.sender);
  const check = got + 1 < need ? 'amount' : !senderOk ? 'sender' : 'ok';
  const status = check === 'amount' ? 'Amount mismatch' : check === 'sender' ? 'Pending' : (+pay.due || 0) > 0 ? 'Advance paid' : 'Verified';
  const now = Date.now();
  const upd = { sms: { amount: got, sender: s.sender || '', provider: s.provider || '', at: s.at || now, check } };
  if (status !== o.status) Object.assign(upd, { status, statusAt: now });
  if (PAID_ST.includes(status)) Object.assign(upd, { verifiedAt: now, verifiedBy: 'sms' });
  await patchDoc('smsPay/' + trx, { order: id, result: status, matchedAt: now });
  await patchDoc('orders/' + id, upd);
  if (status !== o.status) await patchDoc('orderStatus/' + id, { status, updatedAt: now });
  if (PAID_ST.includes(status)) await customerMail(Object.assign({ id }, o), status, { kind: 'paid', trx });
  return { ok: true, status, check };
}
/* keep the Google Sheet's "Payments (SMS)" tab filled too (optional) */
async function sheetSms(from, text) {
  const url = process.env.SHEET_URL || DEFAULT_SHEET, key = process.env.SHEET_SECRET;
  if (!url || !key || /^CHANGE-THIS/.test(key)) return false;
  try { await _fetch(url, { method: 'POST', headers: { 'content-type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ type: 'sms', key, from, text }), redirect: 'follow' }); return true; }
  catch (e) { return false; }
}

/* ---------- setup check (admin Settings → "Setup check", or /api/pay/config?check=1) ----------
 * Says which owner step is missing without showing any secret: service account, published Firestore rules,
 * SSLCommerz store id/password (opens a throw-away gateway session that nobody is sent to), mail secret, SMS check. */
let diag = null;
async function diagnose(base) {
  if (diag && diag.exp > Date.now()) return diag.v;
  const out = { firebase: 'missing', rules: 'unknown', sslcommerz: 'not_set', mode: sslLive() ? 'live' : 'sandbox',
    mail: process.env.SHEET_SECRET && !/^CHANGE-THIS/.test(process.env.SHEET_SECRET) ? 'set' : 'not_set', sms: smsConfigured() ? 'on' : 'off' };
  const sa = serviceAccount();
  if (process.env.FIREBASE_SERVICE_ACCOUNT && !sa) out.firebase = 'bad_json';
  if (sa) {
    try { await getDoc('public/settings'); out.firebase = 'ok'; } catch (e) { out.firebase = 'error_' + String(e.message || e).replace(/\W+/g, '_').slice(0, 40); }
    try {
      const h = { authorization: 'Bearer ' + await accessToken(CP_SCOPE) };
      const rel = await _fetch(`https://firebaserules.googleapis.com/v1/projects/${sa.project_id}/releases/cloud.firestore`, { headers: h });
      if (!rel.ok) out.rules = 'unknown_' + rel.status;
      else {
        const rj = await rel.json();
        const rs = await _fetch('https://firebaserules.googleapis.com/v1/' + rj.rulesetName, { headers: h });
        const src = rs.ok ? (((await rs.json()).source || {}).files || []).map(f => f.content || '').join('\n') : '';
        out.rules = !src ? 'unknown' : /smsPay/.test(src) ? 'current' : /'plan'/.test(src) && /Awaiting payment/.test(src) ? 'update_sms' : 'old';
      }
    } catch (e) { out.rules = 'unknown'; }
  }
  if (sslId() && sslPass()) {
    try {
      const form = { store_id: sslId(), store_passwd: sslPass(), total_amount: '10.00', currency: 'BDT',
        tran_id: 'CHECK-' + Date.now().toString(36).toUpperCase(), success_url: base + '/', fail_url: base + '/', cancel_url: base + '/',
        cus_name: 'Setup check', cus_email: ADMIN_EMAIL, cus_add1: 'Parashuram Bazar', cus_city: 'Feni', cus_postcode: '3940', cus_country: 'Bangladesh',
        cus_phone: '01819508127', shipping_method: 'NO', num_of_item: '1', product_name: 'Setup check', product_category: 'Jewellery', product_profile: 'physical-goods' };
      const r = await _fetch(sslHost() + '/gwprocess/v4/api.php', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(form).toString() });
      const j = await r.json().catch(() => ({}));
      out.sslcommerz = j.status === 'SUCCESS' && j.GatewayPageURL ? 'ok' : 'error: ' + String(j.failedreason || j.status || ('HTTP ' + r.status)).slice(0, 120);
    } catch (e) { out.sslcommerz = 'error: network'; }
  }
  // Is the Google Sheet script the new version (with emails) and does its SECRET match? A request with an unknown
  // status is refused before anything is written or mailed, and the refusal says which case it is.
  if (out.mail === 'set') {
    try {
      const r = await _fetch(process.env.SHEET_URL || DEFAULT_SHEET, { method: 'POST', headers: { 'content-type': 'text/plain;charset=utf-8' }, redirect: 'follow',
        body: JSON.stringify({ type: 'mail', secret: process.env.SHEET_SECRET, id: 'MJ-000000-000000-TEST', status: 'Setup check' }) });
      const j = await r.json().catch(() => null);
      out.mail = !j ? 'unreachable' : j.error === 'bad request' ? 'ok' : j.error === 'wrong secret' ? 'secret_mismatch' : j.error === 'unknown request' ? 'old_script' : 'unknown';
    } catch (e) { out.mail = 'unreachable'; }
  }
  diag = { v: out, exp: Date.now() + 30000 };
  return out;
}

/* Customer emails: only ONE email, the invoice, when the order succeeds (payment verified, advance paid or delivered).
 * Other status changes still update the Google Sheet but send nothing (mail:false). New orders only alert the shop. */
const SUCCESS_ST = ['Verified', 'Advance paid', 'Delivered'];
async function customerMail(o, status, extra) {
  let email = (o.customer && o.customer.email) || '';
  if (!email && o.uid) { try { const u = await getDoc('users/' + o.uid); email = (u && u.email) || ''; } catch (e) { /* no profile */ } }
  if (email && !(o.customer || {}).email) o = Object.assign({}, o, { customer: Object.assign({}, o.customer, { email }) });   // account email from the profile
  const send = SUCCESS_ST.includes(status) && !o.invoiceMailedAt && !!email;
  const out = await sheetMail(mailPayload(o, status, Object.assign({}, extra || {}, { mail: send })));
  if (send && out.mailed && o.id) { try { await patchDoc('orders/' + o.id, { invoiceMailedAt: Date.now() }); } catch (e) { /* not critical */ } }
  return Object.assign({}, out, { attempted: send });
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

module.exports = { invoiceData, customerMail, ADMIN_EMAIL, ORDER_RE, setFetch, serviceAccount, sslConfigured, sslLive, sslHost, sslId, sslPass, getDoc, listDocs, patchDoc, verifyOrder,
  verifyAdminToken, sheetMail, mailPayload, send, redirect, origin, body, enc, dec, sameRates, http: (...a) => _fetch(...a),
  smsSecret, smsConfigured, safeEq, trustedSender, parseSms, matchPayment, sheetSms, diagnose };
