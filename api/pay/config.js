/* GET /api/pay/config — tells the checkout whether SSLCommerz online payment and the free SMS auto-check are switched on */
'use strict';
const L = require('../_lib');
module.exports = (req, res) => L.send(res, 200, { ssl: L.sslConfigured(), live: L.sslLive(), auto: L.smsConfigured() });
