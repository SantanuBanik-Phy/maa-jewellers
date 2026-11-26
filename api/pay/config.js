/* GET /api/pay/config — tells the checkout whether SSLCommerz online payment and the free SMS auto-check are switched on.
 * GET /api/pay/config?check=1 — setup check for the shop owner (which step is missing; never shows a secret). */
'use strict';
const L = require('../_lib');
module.exports = async (req, res) => {
  const base = { ssl: L.sslConfigured(), live: L.sslLive(), auto: L.smsConfigured() };
  if (!(req.query && req.query.check)) return L.send(res, 200, base);
  try { return L.send(res, 200, Object.assign(base, { check: await L.diagnose(L.origin(req)) })); }
  catch (e) { return L.send(res, 200, Object.assign(base, { check: { error: 'server' } })); }
};
