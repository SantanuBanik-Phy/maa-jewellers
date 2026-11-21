/* GET /api/pay/config — tells the checkout whether SSLCommerz online payment is switched on */
'use strict';
const L = require('../_lib');
module.exports = (req, res) => L.send(res, 200, { ssl: L.sslConfigured(), live: L.sslLive() });
