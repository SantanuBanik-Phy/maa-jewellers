/* SSLCommerz returns here: /api/pay/callback?r=success|fail|cancel|ipn  (form POST from the gateway)
 * A payment counts only after the SSLCommerz validation API confirms it; then the order and its public
 * status are marked paid, the customer's invoice unlocks live, and a "payment received" email is sent. */
'use strict';
const L = require('../_lib');

async function confirm(id, tran, valId) {
  const o = await L.getDoc('orders/' + id);
  if (!o || !o.ssl || o.ssl.tran_id !== tran) return { ok: false, why: 'unknown' };
  if (o.ssl.paid) return { ok: true, already: true };
  const q = new URLSearchParams({ val_id: valId, store_id: L.sslId(), store_passwd: L.sslPass(), v: '1', format: 'json' });
  const r = await L.http(L.sslHost() + '/validator/api/validationserverAPI.php?' + q.toString());
  const v = await r.json().catch(() => ({}));
  if (!['VALID', 'VALIDATED'].includes(v.status) || v.tran_id !== tran) return { ok: false, why: 'invalid' };
  if ((v.currency_type || v.currency || 'BDT') !== 'BDT') return { ok: false, why: 'currency' };
  const paid = Math.round(+v.amount || 0);
  if (paid + 1 < Math.round(+o.ssl.amount || 0)) return { ok: false, why: 'amount' };

  const grand = Math.round(+o.grand || 0), due = Math.max(grand - paid, 0);
  const risky = String(v.risk_level) === '1';                       // gateway flags it — shop checks by hand
  const status = risky ? 'Pending' : due > 0 ? 'Advance paid' : 'Verified';
  const now = Date.now();
  const pay = Object.assign({}, o.pay || {}, { method: 'ssl', amount: paid, due, trx: String(v.bank_tran_id || tran).slice(0, 40), sender: String(v.card_type || '').slice(0, 40) });
  await L.patchDoc('orders/' + id, { status, statusAt: now, verifiedAt: risky ? null : now, pay,
    ssl: Object.assign({}, o.ssl, { paid: true, val_id: valId, card: v.card_type || '', bank_tran_id: v.bank_tran_id || '', risk: String(v.risk_level || '0'), at_paid: now }) });
  await L.patchDoc('orderStatus/' + id, { status, updatedAt: now, method: 'ssl', paid, due, grand });
  await L.customerMail(Object.assign({ id }, o, { pay }), status, { kind: 'paid', trx: pay.trx, card: pay.sender });
  return { ok: true, status };
}

module.exports = async (req, res) => {
  const r = String((req.query && req.query.r) || '');
  const b = await L.body(req);
  const tran = String(b.tran_id || '').toUpperCase();
  const id = String(b.value_a || tran.split('-').slice(0, 4).join('-')).toUpperCase();
  const back = (state) => L.redirect(res, `${L.origin(req)}/invoice.html?id=${encodeURIComponent(id)}&pay=${state}`);
  if (!L.sslConfigured()) return r === 'ipn' ? L.send(res, 503, { ok: false }) : back('failed');
  try {
    if ((r === 'success' || r === 'ipn') && b.val_id && L.ORDER_RE.test(id)) {
      const out = await confirm(id, tran, String(b.val_id));
      if (r === 'ipn') return L.send(res, 200, { ok: out.ok });
      return back(out.ok ? 'success' : 'failed');
    }
    if (r === 'ipn') return L.send(res, 200, { ok: false });
    return back(r === 'cancel' ? 'cancelled' : 'failed');
  } catch (e) {
    console.error('pay/callback', e);
    return r === 'ipn' ? L.send(res, 500, { ok: false }) : back('failed');
  }
};
module.exports.confirm = confirm;
