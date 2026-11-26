/* POST /api/pay/init  { orderId }
 * Re-checks the order's price against the shop's published rates, then opens an SSLCommerz
 * payment session and returns the gateway URL. The customer can never choose the amount. */
'use strict';
const L = require('../_lib');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return L.send(res, 405, { error: 'method' });
  if (!L.sslConfigured()) return L.send(res, 503, { error: 'not_configured' });
  try {
    const { orderId } = await L.body(req);
    const id = String(orderId || '').toUpperCase();
    if (!L.ORDER_RE.test(id)) return L.send(res, 400, { error: 'bad_order' });
    const o = await L.getDoc('orders/' + id);
    if (!o) return L.send(res, 404, { error: 'not_found' });
    if (!o.pay || o.pay.method !== 'ssl') return L.send(res, 409, { error: 'not_online' });
    if (o.ssl && o.ssl.paid) return L.send(res, 409, { error: 'already_paid' });
    if (o.status !== 'Awaiting payment') return L.send(res, 409, { error: 'status' });
    const v = await L.verifyOrder(o);
    if (!v.ok) return L.send(res, 422, { error: 'price_mismatch', reason: v.reason });

    const amount = o.plan === 'advance' ? v.advance : v.expect;
    const tran = id + '-' + Date.now().toString(36).toUpperCase();
    const base = L.origin(req), cb = (r) => `${base}/api/pay/callback?r=${r}`;
    const c = o.customer || {}, home = o.delivery && o.delivery.method === 'home';
    const items = o.items || [];
    const form = {
      store_id: L.sslId(), store_passwd: L.sslPass(),
      total_amount: amount.toFixed(2), currency: 'BDT', tran_id: tran,
      success_url: cb('success'), fail_url: cb('fail'), cancel_url: cb('cancel'), ipn_url: cb('ipn'),
      cus_name: String(c.name || 'Customer').slice(0, 50), cus_email: c.email || 'santanubanik2k@gmail.com',
      cus_add1: String(c.addr || 'Parashuram Bazar').slice(0, 50), cus_city: 'Feni', cus_postcode: '3940', cus_country: 'Bangladesh',
      cus_phone: String(c.phone || '').slice(0, 20) || '01819508127',
      shipping_method: home ? 'Courier' : 'NO', num_of_item: String(items.reduce((s, l) => s + (+l.qty || 1), 0) || 1),
      product_name: items.map(l => l.title_en || l.name || l.cat).join(', ').slice(0, 250) || 'Gold jewellery',
      product_category: 'Jewellery', product_profile: 'physical-goods',
      value_a: id, value_b: o.plan || 'full'
    };
    if (home) Object.assign(form, { ship_name: form.cus_name, ship_add1: form.cus_add1, ship_city: 'Feni', ship_postcode: '3940', ship_country: 'Bangladesh' });

    const r = await L.http(L.sslHost() + '/gwprocess/v4/api.php', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(form).toString() });
    const j = await r.json().catch(() => ({}));
    if (j.status !== 'SUCCESS' || !j.GatewayPageURL) return L.send(res, 502, { error: 'gateway', reason: j.failedreason || '' });
    await L.patchDoc('orders/' + id, { ssl: { tran_id: tran, amount, plan: o.plan || 'full', at: Date.now(), live: L.sslLive(), paid: false } });
    return L.send(res, 200, { url: j.GatewayPageURL });
  } catch (e) {
    console.error('pay/init', e);
    return L.send(res, 500, { error: 'server' });
  }
};
