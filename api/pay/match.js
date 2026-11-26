/* POST /api/pay/match { orderId }
 * Called by the website right after an order with a bKash / Nagad / Bangla QR TrxID is placed (the payment SMS
 * usually reaches the shop phone before the order does). Only server-side data decides: the order is marked
 * paid if a genuine payment SMS with the same TrxID and enough amount is on file. Safe to call repeatedly. */
'use strict';
const L = require('../_lib');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return L.send(res, 405, { error: 'method' });
  if (!L.serviceAccount()) return L.send(res, 503, { error: 'not_configured' });
  try {
    const { orderId } = await L.body(req);
    const id = String(orderId || '').toUpperCase();
    if (!L.ORDER_RE.test(id)) return L.send(res, 400, { error: 'bad_order' });
    const m = await L.matchPayment(id);
    return L.send(res, 200, { ok: !!m.ok, status: m.status || null });
  } catch (e) {
    console.error('pay/match', e);
    return L.send(res, 500, { error: 'server' });
  }
};
