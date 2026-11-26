/* POST /api/sms?key=SECRET  — the shop phone's SMS forwarder app sends every incoming SMS here.
 * Body: JSON {"from":"bKash","text":"You have received Tk ..."} (other common field names and form posts work too).
 * Free automatic payment check: a "money received" SMS from bKash / Nagad / the bank is stored in smsPay/{TRXID};
 * if a customer's order carries that TrxID and the amount is enough, the order is marked paid and the invoice unlocks. */
'use strict';
const L = require('./_lib');

const TEXT = ['text', 'message', 'msg', 'body', 'content', 'sms'];
const FROM = ['from', 'sender', 'number', 'phone', 'address', 'originatingAddress'];
const pick = (o, keys) => { for (const k of keys) if (o && o[k] != null && String(o[k]).trim()) return String(o[k]); return ''; };

module.exports = async (req, res) => {
  const q = req.query || {};
  const b = await L.body(req);
  const key = String(q.key || (b && b.key) || req.headers['x-key'] || '');
  if (!L.smsConfigured()) return L.send(res, 503, { ok: false, error: 'not_configured' });
  if (!L.safeEq(key, L.smsSecret())) return L.send(res, 403, { ok: false, error: 'wrong_key' });
  const raw = typeof req.body === 'string' ? req.body : '';
  const text = (pick(b, TEXT) || pick(q, TEXT) || raw).slice(0, 1000);
  const from = (pick(b, FROM) || pick(q, FROM)).slice(0, 60);
  if (!text) return L.send(res, 200, { ok: true, result: 'empty' });
  try {
    await L.sheetSms(from, text);
    if (!L.trustedSender(from)) return L.send(res, 200, { ok: true, result: 'ignored_sender' });
    const s = L.parseSms(text, from);
    if (!s.incoming) return L.send(res, 200, { ok: true, result: 'ignored' });
    if (!s.trx) return L.send(res, 200, { ok: true, result: 'no_trx' });
    if (await L.getDoc('smsPay/' + s.trx)) return L.send(res, 200, { ok: true, result: 'duplicate', trx: s.trx });
    const doc = { trx: s.trx, provider: s.provider, amount: s.amount, sender: s.sender, from, text: text.slice(0, 500), at: Date.now(), order: '', result: 'waiting' };
    await L.patchDoc('smsPay/' + s.trx, doc);
    const t = await L.getDoc('trx/' + s.trx);
    if (t && L.ORDER_RE.test(String(t.order || ''))) {
      const m = await L.matchPayment(t.order, doc);
      return L.send(res, 200, { ok: true, trx: s.trx, amount: s.amount, order: t.order, result: m.status || m.why });
    }
    return L.send(res, 200, { ok: true, trx: s.trx, amount: s.amount, result: 'waiting' });
  } catch (e) {
    console.error('sms', e);
    return L.send(res, 500, { ok: false, error: 'server' });
  }
};
