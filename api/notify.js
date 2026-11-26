/* POST /api/notify  { orderId, idToken }
 * Called by the admin panel after changing an order's status. Only the shop admin's Firebase
 * sign-in is accepted; the email goes to the customer through the shop's Google Apps Script. */
'use strict';
const L = require('./_lib');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return L.send(res, 405, { error: 'method' });
  if (!L.serviceAccount()) return L.send(res, 503, { error: 'not_configured' });
  try {
    const { orderId, idToken, test } = await L.body(req);
    if (!(await L.verifyAdminToken(idToken))) return L.send(res, 403, { error: 'forbidden' });
    if (test) {   // admin Settings → "send test email": goes only to the shop's own Gmail, touches no order
      if (!process.env.SHEET_SECRET) return L.send(res, 200, { ok: false, why: 'no_secret' });
      const out = await L.sheetMail({ kind: 'status', id: 'MJ-000000-000000-TEST', status: 'Verified', lang: 'bn', to: L.ADMIN_EMAIL, name: 'মা জুয়েলার্স (টেস্ট)',
        grand: 0, paid: 0, due: 0, method: '', delivery: 'pickup', items: [] });
      return L.send(res, 200, { ok: !!out.ok, mailed: !!out.mailed, why: out.ok ? (out.mailed ? '' : 'not_sent') : String(out.error || 'script'), detail: String(out.mailError || '').slice(0, 220) });
    }
    const id = String(orderId || '').toUpperCase();
    if (!L.ORDER_RE.test(id)) return L.send(res, 400, { error: 'bad_order' });
    const o = await L.getDoc('orders/' + id);
    if (!o) return L.send(res, 404, { error: 'not_found' });
    if (!o.customer || !o.customer.email) return L.send(res, 200, { ok: true, skipped: 'no_email' });
    const out = await L.customerMail(Object.assign({ id }, o), o.status);
    if (!out.attempted) return L.send(res, 200, { ok: true, skipped: 'not_invoice_time' });
    return L.send(res, 200, { ok: !!out.ok, mailed: out.mailed === undefined ? undefined : !!out.mailed, invoice: true });
  } catch (e) {
    console.error('notify', e);
    return L.send(res, 500, { error: 'server' });
  }
};
