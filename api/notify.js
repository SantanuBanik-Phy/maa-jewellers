/* POST /api/notify  { orderId, idToken }
 * Called by the admin panel after changing an order's status. Only the shop admin's Firebase
 * sign-in is accepted; the email goes to the customer through the shop's Google Apps Script. */
'use strict';
const L = require('./_lib');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return L.send(res, 405, { error: 'method' });
  if (!L.serviceAccount()) return L.send(res, 503, { error: 'not_configured' });
  try {
    const { orderId, idToken } = await L.body(req);
    if (!(await L.verifyAdminToken(idToken))) return L.send(res, 403, { error: 'forbidden' });
    const id = String(orderId || '').toUpperCase();
    if (!L.ORDER_RE.test(id)) return L.send(res, 400, { error: 'bad_order' });
    const o = await L.getDoc('orders/' + id);
    if (!o) return L.send(res, 404, { error: 'not_found' });
    if (!o.customer || !o.customer.email) return L.send(res, 200, { ok: true, skipped: 'no_email' });
    const out = await L.sheetMail(L.mailPayload(o, o.status));
    return L.send(res, 200, { ok: !!out.ok, skipped: out.skipped || undefined });
  } catch (e) {
    console.error('notify', e);
    return L.send(res, 500, { error: 'server' });
  }
};
