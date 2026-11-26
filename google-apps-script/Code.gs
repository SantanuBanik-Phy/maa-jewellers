/**
 * =====================================================================
 *  MAA JEWELLERS — Google Sheet backend (Google Apps Script)
 * ---------------------------------------------------------------------
 *  What it does
 *   1. Saves every order from the website (customer, items, totals,
 *      payment method, TrxID) into the "Orders" and "Items" tabs.
 *   2. Blocks a TrxID that was already used on another order.
 *   3. Receives bKash / Nagad / bank SMS forwarded from the shop phone,
 *      reads TrxID + amount, and marks the matching order "Verified".
 *   4. Lets the website ask for an order's verification status.
 *   5. Emails the customer: order confirmation when they order, and an update
 *      when the shop verifies / delivers / SSLCommerz confirms a payment.
 *
 *  Setup: see SETUP-GOOGLE-SHEET.md (step by step, Bangla + English).
 * =====================================================================
 */

const SETTINGS = {
  // Change this! The SMS forwarder must send it as ?key=...  (letters/numbers only)
  SECRET: 'CHANGE-THIS-maa-2026-secret',
  // The shop gets an email for every new order and payment here (leave '' to switch off)
  ALERT_EMAIL: 'santanubanik2k@gmail.com',
  // Customer emails (order confirmation + status updates). Sent from your Gmail, max ~100/day.
  CUSTOMER_EMAILS: true,
  // The shop's own Gmail: test emails go here and are not limited to 4 per hour
  SHOP_EMAIL: 'santanubanik2k@gmail.com',
  SHOP_PHONE: '01819-508127', SHOP_WHATSAPP: '01817-533313',
  SITE_URL: 'https://maa-jewellers-shop.vercel.app',
  TZ: 'Asia/Dhaka',
  // An SMS amount this many taka below the "Paid" amount still counts as paid
  AMOUNT_TOLERANCE: 1
};

const TAB = { orders: 'Orders', items: 'Items', sms: 'Payments (SMS)', dash: 'Dashboard' };
const STATUS = ['Pending', 'Awaiting payment', 'Verified', 'Advance paid', 'Amount mismatch', 'Duplicate TrxID', 'Cash at shop', 'Cash on delivery', 'Not paid', 'Rejected', 'Delivered'];

const OH = ['Order ID', 'Date', 'Time', 'Customer', 'Mobile', 'Address', 'Items', 'Pieces', 'Gold (g)',
  'Gold value', 'Making', 'Discount', 'VAT', 'Advance / old gold', 'Grand total',
  'Method', 'Paid', 'Due', 'TrxID', 'Paid from', 'Status', 'Verified at', 'SMS amount', 'SMS sender',
  'Note', 'Language', 'Rate date', 'Email'];
const IH = ['Order ID', 'Date', '#', 'Item', 'Carat', 'Weight', 'Grams', 'Rate / bhori', 'Making', 'Amount'];
const SH = ['Received at', 'Provider', 'From', 'Amount', 'Sender number', 'TrxID', 'Matched order', 'Result', 'SMS text'];

const C = (h) => OH.indexOf(h) + 1;          // Orders column number by header
const S = (h) => SH.indexOf(h) + 1;          // SMS column number by header

/* =====================================================================
   1. ONE-TIME SETUP — run this once from the editor (▶ Run → setup)
   ===================================================================== */
function setup() {
  const ss = SpreadsheetApp.getActive();
  ss.setSpreadsheetTimeZone(SETTINGS.TZ);
  const o = makeTab_(ss, TAB.orders, OH, [150, 90, 70, 150, 110, 170, 280, 60, 75, 100, 85, 80, 70, 110, 110, 95, 95, 90, 120, 110, 130, 140, 95, 110, 160, 70, 90]);
  makeTab_(ss, TAB.items, IH, [150, 90, 40, 200, 100, 150, 70, 110, 90, 110]);
  const sm = makeTab_(ss, TAB.sms, SH, [140, 90, 110, 90, 110, 120, 150, 130, 420]);

  // Text columns (keep the leading 0 of phone numbers)
  ['Order ID', 'Mobile', 'TrxID', 'Paid from', 'SMS sender'].forEach(h => o.getRange(2, C(h), o.getMaxRows() - 1, 1).setNumberFormat('@'));
  ['Sender number', 'TrxID', 'Matched order'].forEach(h => sm.getRange(2, S(h), sm.getMaxRows() - 1, 1).setNumberFormat('@'));
  // Money columns
  ['Gold value', 'Making', 'Discount', 'VAT', 'Advance / old gold', 'Grand total', 'Paid', 'Due', 'SMS amount']
    .forEach(h => o.getRange(2, C(h), o.getMaxRows() - 1, 1).setNumberFormat('"৳"#,##0'));
  sm.getRange(2, S('Amount'), sm.getMaxRows() - 1, 1).setNumberFormat('"৳"#,##0.00');

  // Status: dropdown + colours
  const stRange = o.getRange(2, C('Status'), o.getMaxRows() - 1, 1);
  stRange.setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(STATUS, true).setAllowInvalid(false).build());
  const all = o.getRange(2, 1, o.getMaxRows() - 1, OH.length);
  const L = colLetter_(C('Status'));
  const rule = (text, bg, fg) => SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=$' + L + '2="' + text + '"').setBackground(bg).setFontColor(fg).setRanges([all]).build();
  o.setConditionalFormatRules([
    rule('Verified', '#fbf3d5', '#5c430b'),
    rule('Pending', '#ffffff', '#111111'),
    rule('Amount mismatch', '#fde8e8', '#9b1c1c'),
    rule('Duplicate TrxID', '#fde8e8', '#9b1c1c'),
    rule('Rejected', '#eeeeee', '#666666'),
    rule('Delivered', '#f1ead2', '#3d2f17')
  ]);
  makeDashboard_(ss);
  ss.setActiveSheet(ss.getSheetByName(TAB.dash));
  SpreadsheetApp.getActive().toast('Maa Jewellers sheet is ready ✓', 'Setup', 6);
}

function makeTab_(ss, name, headers, widths) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  sh.getRange(1, 1, 1, headers.length).setValues([headers])
    .setBackground('#111111').setFontColor('#e7c34c').setFontWeight('bold').setVerticalAlignment('middle');
  sh.setFrozenRows(1);
  sh.setRowHeight(1, 34);
  widths.forEach((w, i) => sh.setColumnWidth(i + 1, w));
  sh.setTabColor('#c9a227');
  return sh;
}

function makeDashboard_(ss) {
  let d = ss.getSheetByName(TAB.dash);
  if (!d) d = ss.insertSheet(TAB.dash, 0);
  d.clear();
  const O = "'" + TAB.orders + "'!";
  const M = "'" + TAB.sms + "'!";
  const col = (h) => O + colLetter_(C(h)) + '2:' + colLetter_(C(h));
  const today = 'TODAY()';
  const rows = [
    ['MAA JEWELLERS — Dashboard', ''],
    ['', ''],
    ['Orders today', '=COUNTIF(' + col('Date') + ',' + today + ')'],
    ['Sales today (৳)', '=SUMIF(' + col('Date') + ',' + today + ',' + col('Grand total') + ')'],
    ['Received today — verified (৳)', '=SUMIFS(' + col('Paid') + ',' + col('Date') + ',' + today + ',' + col('Status') + ',"Verified")'],
    ['', ''],
    ['All orders', '=COUNTA(' + O + 'A2:A)'],
    ['All sales (৳)', '=SUM(' + col('Grand total') + ')'],
    ['Verified payments (৳)', '=SUMIF(' + col('Status') + ',"Verified",' + col('Paid') + ')'],
    ['Waiting for verification', '=COUNTIF(' + col('Status') + ',"Pending")'],
    ['Problems (mismatch / duplicate)', '=COUNTIF(' + col('Status') + ',"Amount mismatch")+COUNTIF(' + col('Status') + ',"Duplicate TrxID")'],
    ['Total due from customers (৳)', '=SUM(' + col('Due') + ')'],
    ['SMS not matched to any order', '=COUNTIF(' + M + colLetter_(S('Result')) + '2:' + colLetter_(S('Result')) + ',"Unmatched")']
  ];
  d.getRange(1, 1, rows.length, 2).setValues(rows);
  d.getRange('A1:B1').merge().setBackground('#111111').setFontColor('#e7c34c').setFontSize(16).setFontWeight('bold');
  d.setRowHeight(1, 44);
  d.getRange('A3:A13').setFontWeight('bold');
  d.getRange('B3:B13').setHorizontalAlignment('right').setFontSize(13);
  ['B4', 'B5', 'B8', 'B9', 'B12'].forEach(a => d.getRange(a).setNumberFormat('"৳"#,##0'));
  d.getRange('A3:B5').setBackground('#fbf3d5');
  d.getRange('A7:B13').setBorder(true, true, true, true, true, true, '#c9a227', SpreadsheetApp.BorderStyle.SOLID);
  d.setColumnWidth(1, 300); d.setColumnWidth(2, 180);
  d.setTabColor('#111111');
}

/* =====================================================================
   2. WEB ENDPOINTS
   ===================================================================== */
function doGet(e) {
  const p = (e && e.parameter) || {};
  try {
    if (p.action === 'status') {
      const o = findOrder_(p.order);
      return json_(o ? { ok: true, status: o.status, verifiedAt: o.verifiedAt } : { ok: false, error: 'not found' });
    }
    if (p.action === 'checkTrx') {
      return json_({ ok: true, used: trxUsed_(p.trx, p.order) });
    }
    return json_({ ok: true, shop: 'Maa Jewellers', time: new Date().toISOString() });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  try {
    const p = (e && e.parameter) || {};
    const raw = (e && e.postData && e.postData.contents) || '';
    let body = {};
    try { body = JSON.parse(raw); } catch (err) { body = {}; }

    // SMS forwarder (needs the secret key)
    const key = p.key || body.key;
    if (key || body.type === 'sms') {
      if (key !== SETTINGS.SECRET) return json_({ ok: false, error: 'wrong key' });
      const text = body.text || body.message || body.msg || body.body || body.content || p.text || p.message || p.msg || p.body || raw;
      const from = body.from || body.sender || body.number || p.from || p.sender || p.number || '';
      return json_(handleSms_(String(text), String(from)));
    }
    // Website order
    if (body.type === 'order') return json_(saveOrder_(body));
    // Status email from the website server (needs the secret; refused while it is still the default)
    if (body.type === 'mail') {
      if (/^CHANGE-THIS/.test(SETTINGS.SECRET) || body.secret !== SETTINGS.SECRET) return json_({ ok: false, error: 'wrong secret' });
      return json_(statusMail_(body));
    }
    return json_({ ok: false, error: 'unknown request' });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

/* =====================================================================
   3. ORDERS
   ===================================================================== */
function saveOrder_(o) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const id = text_(o.id, 40);
    if (!/^MJ-[0-9A-Z-]{6,40}$/.test(id)) return { ok: false, error: 'bad order id' };
    const existing = findOrder_(id);
    if (existing) return { ok: true, status: existing.status, already: true };

    const pay = o.pay || null, T = o.totals || {}, cu = o.customer || {};
    const items = Array.isArray(o.items) ? o.items.slice(0, 60) : [];
    const trx = pay && ['bkash', 'nagad', 'qr'].indexOf(pay.method) >= 0 && pay.trx ? text_(pay.trx, 20).toUpperCase().replace(/[^A-Z0-9]/g, '') : '';
    const paid = num_(pay && pay.amount);
    let status = !pay ? 'Not paid' : pay.method === 'cash' ? 'Cash at shop' : pay.method === 'cod' ? 'Cash on delivery' : pay.method === 'ssl' ? 'Awaiting payment' : 'Pending';
    let verifiedAt = '', smsAmount = '', smsSender = '';

    if (trx && trxUsed_(trx, id)) status = 'Duplicate TrxID';

    // The SMS may have arrived before the order
    if (status === 'Pending' && trx) {
      const smsRow = findRow_(sheet_(TAB.sms), S('TrxID'), trx);
      if (smsRow) {
        const sh = sheet_(TAB.sms);
        const v = sh.getRange(smsRow, 1, 1, SH.length).getValues()[0];
        const matchedAlready = v[S('Matched order') - 1];
        if (!matchedAlready) {
          smsAmount = num_(v[S('Amount') - 1]); smsSender = v[S('Sender number') - 1];
          status = smsAmount + SETTINGS.AMOUNT_TOLERANCE >= paid ? 'Verified' : 'Amount mismatch';
          if (status === 'Verified') verifiedAt = stamp_();
          sh.getRange(smsRow, S('Matched order')).setValue(id);
          sh.getRange(smsRow, S('Result')).setValue(status);
        }
      }
    }

    const now = new Date();
    const row = {
      'Order ID': id, 'Date': dateOnly_(now), 'Time': fmt_(now, 'HH:mm:ss'),
      'Customer': text_(cu.name, 80), 'Mobile': text_(cu.phone, 20), 'Address': text_(cu.addr, 160),
      'Items': items.map(i => text_(i.name, 60) + ' (' + text_(i.carat, 20) + ', ' + text_(i.weight, 40) + ')').join('; '),
      'Pieces': items.length, 'Gold (g)': Math.round(items.reduce((s, i) => s + num_(i.grams), 0) * 1000) / 1000,
      'Gold value': Math.round(num_(T.gold)), 'Making': Math.round(num_(T.making)), 'Discount': Math.round(num_(T.discAmt)),
      'VAT': Math.round(num_(T.vatAmt)), 'Advance / old gold': Math.round(num_(T.adv)), 'Grand total': Math.round(num_(T.grand)),
      'Method': pay ? text_(pay.methodLabel || pay.method, 30) : '—', 'Paid': Math.round(paid), 'Due': Math.round(num_(pay ? pay.due : T.grand)),
      'TrxID': trx, 'Paid from': text_(pay && pay.sender, 20), 'Status': status, 'Verified at': verifiedAt,
      'SMS amount': smsAmount, 'SMS sender': smsSender, 'Language': text_(o.lang, 4), 'Rate date': text_(o.rateDate, 12),
      'Note': [o.delivery && o.delivery.method === 'home' ? 'Home delivery' + (num_(o.delivery.fee) ? ' ৳' + num_(o.delivery.fee) : '') : 'Pickup at shop',
               o.plan ? 'Plan: ' + text_(o.plan, 10) : '', items.some(i => i.desc) ? 'Design: ' + items.filter(i => i.desc).map(i => text_(i.desc, 120)).join(' | ') : '',
               items.some(i => num_(i.photos)) ? 'Reference photos in admin panel' : ''].filter(String).join(' · '),
      'Email': validEmail_(cu.email) ? text_(cu.email, 80) : ''
    };
    if (!sheet_(TAB.orders).getRange(1, C('Email')).getValue()) sheet_(TAB.orders).getRange(1, C('Email')).setValue('Email').setFontWeight('bold');
    const sh = sheet_(TAB.orders);
    const r = sh.getLastRow() + 1;
    sh.getRange(r, 1, 1, OH.length).setNumberFormats([OH.map(h => ['Order ID', 'Mobile', 'TrxID', 'Paid from', 'SMS sender'].indexOf(h) >= 0 ? '@' : (['Gold value', 'Making', 'Discount', 'VAT', 'Advance / old gold', 'Grand total', 'Paid', 'Due', 'SMS amount'].indexOf(h) >= 0 ? '"৳"#,##0' : (h === 'Date' ? 'yyyy-mm-dd' : 'General')))]);
    sh.getRange(r, 1, 1, OH.length).setValues([OH.map(h => row[h] === undefined ? '' : row[h])]);

    if (items.length) {
      const ish = sheet_(TAB.items);
      const start = ish.getLastRow() + 1;
      const vals = items.map((i, n) => [id, row['Date'], n + 1, text_(i.name, 80), text_(i.carat, 20), text_(i.weight, 40),
        Math.round(num_(i.grams) * 1000) / 1000, Math.round(num_(i.rate)), Math.round(num_(i.making)), Math.round(num_(i.total))]);
      ish.getRange(start, 1, vals.length, 1).setNumberFormat('@');
      ish.getRange(start, 1, vals.length, IH.length).setValues(vals);
      ish.getRange(start, 8, vals.length, 3).setNumberFormat('"৳"#,##0');
      ish.getRange(start, 2, vals.length, 1).setNumberFormat('yyyy-mm-dd');
    }
    alert_('নতুন অর্ডার · New order ' + id + ' · ' + tk_(row['Grand total']), Object.assign({ 'Delivery': o.delivery && o.delivery.method === 'home' ? 'Home delivery' : 'Pick up', 'Plan': o.plan || '' }, row),
      items.map(i => ({ name: text_(i.name, 60), qty: i.qty, carat: text_(i.carat, 20), weight: text_(i.weight, 40), total: num_(i.total) })));
    if (row['Email']) orderMail_(o, id, status, row);
    return { ok: true, status: status };
  } finally {
    lock.releaseLock();
  }
}

function findOrder_(id) {
  id = text_(id, 40);
  if (!id) return null;
  const sh = sheet_(TAB.orders);
  const r = findRow_(sh, C('Order ID'), id);
  if (!r) return null;
  const v = sh.getRange(r, 1, 1, OH.length).getValues()[0];
  const va = v[C('Verified at') - 1];
  return { row: r, id: id, status: v[C('Status') - 1], paid: num_(v[C('Paid') - 1]),
    verifiedAt: va instanceof Date ? fmt_(va, 'yyyy-MM-dd HH:mm') : String(va || '') };
}

function trxUsed_(trx, exceptOrder) {
  trx = text_(trx, 20).toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (trx.length < 6) return false;
  const sh = sheet_(TAB.orders);
  const found = sh.getRange(2, C('TrxID'), Math.max(sh.getLastRow() - 1, 1), 1).createTextFinder(trx).matchEntireCell(true).findAll();
  return found.some(cell => String(sh.getRange(cell.getRow(), C('Order ID')).getValue()) !== String(exceptOrder || ''));
}

/* =====================================================================
   4. SMS → AUTOMATIC VERIFICATION
   ===================================================================== */
function handleSms_(text, from) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const s = parseSms_(text, from);
    const sh = sheet_(TAB.sms);
    let result = 'Unmatched', matched = '';
    if (!s.incoming) result = 'Ignored (not money received)';
    else if (!s.trx) result = 'No TrxID found';
    else if (findRow_(sh, S('TrxID'), s.trx)) result = 'Duplicate SMS';
    else {
      const osh = sheet_(TAB.orders);
      const r = findRow_(osh, C('TrxID'), s.trx);
      if (r) {
        matched = String(osh.getRange(r, C('Order ID')).getValue());
        const cur = osh.getRange(r, C('Status')).getValue();
        const paid = num_(osh.getRange(r, C('Paid')).getValue());
        osh.getRange(r, C('SMS amount')).setValue(s.amount);
        osh.getRange(r, C('SMS sender')).setValue(s.sender);
        if (cur === 'Pending' || cur === 'Amount mismatch') {
          const ok = s.amount + SETTINGS.AMOUNT_TOLERANCE >= paid;
          osh.getRange(r, C('Status')).setValue(ok ? 'Verified' : 'Amount mismatch');
          if (ok) osh.getRange(r, C('Verified at')).setValue(stamp_());
          result = ok ? 'Verified' : 'Amount mismatch';
        } else result = 'Order already ' + cur;
      }
    }
    const nr = sh.getLastRow() + 1;
    sh.getRange(nr, 1, 1, SH.length).setNumberFormats([SH.map(h => ['Sender number', 'TrxID', 'Matched order'].indexOf(h) >= 0 ? '@' : (h === 'Amount' ? '"৳"#,##0.00' : 'General'))]);
    sh.getRange(nr, 1, 1, SH.length).setValues([[stamp_(), s.provider, text_(from, 40), s.amount || '', s.sender, s.trx, matched, result, text_(text, 600)]]);
    if (s.incoming && s.trx) alert_('Payment SMS ' + s.trx + ' — ' + result, { 'TrxID': s.trx, 'Amount': s.amount, 'From': s.sender, 'Order': matched || '—' });
    return { ok: true, trx: s.trx, amount: s.amount, result: result, order: matched };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Reads TrxID, amount and sender from bKash / Nagad / bank SMS.
 * The formats differ a little between operators and change over time:
 * if a real SMS is not read correctly, send its text to the developer
 * and adjust the patterns below.
 */
function parseSms_(text, from) {
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  const all = (String(from || '') + ' ' + t);
  const provider = /bkash/i.test(all) ? 'bKash' : /nagad/i.test(all) ? 'Nagad'
    : /islami|ibbl|cellfin|qr/i.test(all) ? 'Bank / Bangla QR' : 'Other';
  const incoming = /(received|credited|cash ?in|deposit|payment received|জমা|পেয়েছেন)/i.test(t) &&
    !/(you have sent|send money to|cash ?out|payment to|paid to|debited)/i.test(t);
  const trxM = t.match(/(?:Trx\s*ID|TrxId|TxnID|Txn\s*ID|Transaction\s*ID|Trans\.?\s*ID|TXN)\s*[:.#\-]?\s*([A-Z0-9]{6,20})/i);
  const amtM = t.match(/(?:received|credited|amount|tk\.?|bdt|৳)[^0-9]{0,24}([0-9][0-9,]*(?:\.[0-9]{1,2})?)/i);
  const sndM = t.match(/(?:from|sender|by)\s*[:\-]?\s*(?:a\/c\s*)?(?:\+?88)?(01[3-9][0-9]{8})/i) || t.match(/(?:\+?88)?(01[3-9][0-9]{8})/);
  return {
    provider: provider,
    incoming: incoming,
    trx: trxM ? trxM[1].toUpperCase() : '',
    amount: amtM ? parseFloat(amtM[1].replace(/,/g, '')) : 0,
    sender: sndM ? sndM[1] : ''
  };
}

/* When the owner changes Status to "Verified" by hand, stamp the time. */
function onEdit(e) {
  try {
    const sh = e.range.getSheet();
    if (sh.getName() !== TAB.orders || e.range.getColumn() !== C('Status') || e.range.getRow() < 2) return;
    const at = sh.getRange(e.range.getRow(), C('Verified at'));
    if (e.value === 'Verified' && !at.getValue()) at.setValue(stamp_());
  } catch (err) { /* ignore */ }
}

/* Try the SMS reader from the editor: ▶ Run → testSms, then View → Logs */
function testSms() {
  [
    'You have received Tk 5,000.00 from 01712345678. Ref MJ2011. Fee Tk 0.00. Balance Tk 25,300.50. TrxID 9KD4A7XB2C at 20/11/2026 23:41',
    'Money Received. Amount: Tk 3000.00 Sender: 01812345678 Ref: N/A TxnID: 73HG82KD Balance: Tk 9000.00 20/11/2026 23:45',
    'You have sent Tk 500.00 to 01912345678. TrxID ABC123XYZ9'
  ].forEach(s => Logger.log(JSON.stringify(parseSms_(s, ''))));
}

/* =====================================================================
   5. HELPERS
   ===================================================================== */
function sheet_(name) {
  const sh = SpreadsheetApp.getActive().getSheetByName(name);
  if (!sh) throw new Error('Run setup() first — missing tab: ' + name);
  return sh;
}
function findRow_(sh, col, value) {
  if (!value || sh.getLastRow() < 2) return 0;
  const cell = sh.getRange(2, col, sh.getLastRow() - 1, 1).createTextFinder(String(value)).matchEntireCell(true).findNext();
  return cell ? cell.getRow() : 0;
}
/* Plain text, trimmed, and never a formula (protects the sheet). */
function text_(v, max) {
  let s = v === null || v === undefined ? '' : String(v).replace(/[\u0000-\u001f]/g, ' ').trim();
  s = s.slice(0, max || 200);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}
function num_(v) { const n = parseFloat(String(v === undefined || v === null ? '' : v).replace(/[^0-9.\-]/g, '')); return isFinite(n) ? n : 0; }
function fmt_(d, f) { return Utilities.formatDate(d, SETTINGS.TZ, f); }
function dateOnly_(d) { return Utilities.parseDate(fmt_(d, 'yyyy-MM-dd'), SETTINGS.TZ, 'yyyy-MM-dd'); }
function stamp_() { return fmt_(new Date(), 'yyyy-MM-dd HH:mm:ss'); }
function colLetter_(n) { let s = ''; while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; }
function json_(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
/* Email to the shop for every new order / payment (instant; not limited per hour) */
const ALERT_KEYS = ['Order ID', 'order', 'Status', 'Customer', 'Mobile', 'Email', 'Address', 'Delivery', 'Plan', 'Grand total', 'Paid', 'paid', 'Due', 'due',
  'Method', 'TrxID', 'trx', 'Paid from', 'Amount', 'From', 'Order', 'SMS amount', 'Note'];
function alert_(subject, data, items) {
  if (!SETTINGS.ALERT_EMAIL) return;
  try {
    const money = /total|paid|due|amount/i;
    const rows = ALERT_KEYS.filter(k => data[k] !== undefined && data[k] !== '' && data[k] !== null)
      .map(k => '<tr><td style="padding:6px 10px;color:#7a6b52;white-space:nowrap">' + esc_(k) + '</td><td style="padding:6px 10px;font-weight:600">' +
        esc_(money.test(k) && num_(data[k]) ? tk_(data[k]) : data[k]) + '</td></tr>').join('');
    const its = (items || []).map(i => '<li>' + esc_(i.name) + (num_(i.qty) > 1 ? ' × ' + num_(i.qty) : '') + ' · ' + esc_(i.carat || '') + ' · ' + esc_(i.weight || '') + ' — <b>' + tk_(i.total) + '</b></li>').join('');
    const html = '<div style="font-family:Segoe UI,Arial,sans-serif;background:#f7f2e7;padding:18px"><div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e7dcc6;border-radius:14px;overflow:hidden">' +
      '<div style="height:5px;background:linear-gradient(90deg,#b8860b,#f6e27a,#c9a227)"></div><div style="padding:18px 20px"><h2 style="margin:0 0 10px;font-size:18px;color:#1f170c">🔔 ' + esc_(subject) + '</h2>' +
      '<table style="border-collapse:collapse;font-size:14px;width:100%">' + rows + '</table>' + (its ? '<ul style="margin:12px 0 0;padding-left:18px;font-size:14px;line-height:1.7">' + its + '</ul>' : '') +
      '<p style="margin:16px 0 0"><a href="' + SETTINGS.SITE_URL + '/admin.html" style="display:inline-block;background:#1f170c;color:#f6e27a;text-decoration:none;padding:10px 18px;border-radius:999px;font-weight:700">Open admin panel →</a>' +
      ' &nbsp;<a href="' + SpreadsheetApp.getActive().getUrl() + '" style="color:#8a6510">Google Sheet</a></p></div></div></div>';
    MailApp.sendEmail({ to: SETTINGS.ALERT_EMAIL, subject: 'মা জুয়েলার্স · ' + subject, htmlBody: html, name: 'Maa Jewellers website',
      body: Object.keys(data).map(k => k + ': ' + data[k]).join('\n') + '\n\n' + SETTINGS.SITE_URL + '/admin.html' });
  } catch (err) { /* mail quota or not authorised — the order is still saved */ }
}


/* =====================================================================
   5. CUSTOMER EMAILS (sent from your Gmail with MailApp)
   ===================================================================== */
function validEmail_(e) { return /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/.test(String(e || '').trim()); }
let MAIL_ERR = '';   // why the last email was not sent (shown in the admin panel and in the Logs)
// at most 4 emails to one address per hour, so nobody can use the form to spam someone (the shop's own Gmail is exempt)
function mailAllowed_(to) {
  const own = String(to).toLowerCase() === String(SETTINGS.SHOP_EMAIL || '').toLowerCase();
  if (!own) {
    const c = CacheService.getScriptCache(), k = 'm_' + Utilities.base64EncodeWebSafe(String(to).toLowerCase()).slice(0, 200);
    const n = Number(c.get(k) || 0);
    if (n >= 4) { MAIL_ERR = 'limit: already 4 emails to this address in the last hour'; return false; }
    c.put(k, String(n + 1), 3600);
  }
  let left;
  try { left = MailApp.getRemainingDailyQuota(); } catch (err) { MAIL_ERR = 'permission: ' + String(err && err.message || err); return false; }
  if (left <= 5) { MAIL_ERR = 'quota: Gmail daily email limit reached (' + left + ' left) — try tomorrow'; return false; }
  return true;
}
const MT = {
  bn: { hi: 'প্রিয় {n},', thanks: 'মা জুয়েলার্সে অর্ডার করার জন্য ধন্যবাদ!', got: 'আপনার অর্ডার আমরা পেয়েছি।', order: 'অর্ডার নং', total: 'সর্বমোট',
        paid: 'পরিশোধ', due: 'বাকি', status: 'অবস্থা', track: 'অর্ডার দেখুন', del: { home: 'হোম ডেলিভারি', pickup: 'দোকান থেকে নেবেন' }, dl: 'ডেলিভারি',
        next: { 'Pending': 'আমরা আপনার পেমেন্ট যাচাই করছি — যাচাই হলেই চালান খুলে যাবে।', 'Awaiting payment': 'অনলাইন পেমেন্ট সম্পন্ন হলেই অর্ডার নিশ্চিত হবে।',
          'Cash on delivery': 'পাঠানোর আগে আমরা ফোন করে অর্ডার নিশ্চিত করব। গহনা হাতে পেয়ে নগদ পরিশোধ করুন।', 'Cash at shop': 'দোকানে এসে পরিশোধ করে গহনা নিয়ে যান।',
          'Verified': 'আপনার পেমেন্ট যাচাই হয়েছে ✓ চালান এখন প্রিন্ট করতে পারবেন।', 'Advance paid': 'অগ্রিম পেয়েছি ✓ কারিগর আপনার ডিজাইন বানানো শুরু করবেন।',
          'Delivered': 'গহনা হস্তান্তর সম্পন্ন। মা জুয়েলার্সের সাথে থাকার জন্য ধন্যবাদ!', 'Rejected': 'পেমেন্ট মেলেনি — অনুগ্রহ করে দোকানে যোগাযোগ করুন।',
          'Amount mismatch': 'পরিশোধিত টাকা মেলেনি — অনুগ্রহ করে দোকানে যোগাযোগ করুন।' },
        sub: { order: 'অর্ডার নিশ্চিতকরণ', paid: 'পেমেন্ট পেয়েছি', status: 'অর্ডার আপডেট', invoice: 'আপনার চালান' }, call: 'প্রশ্ন থাকলে কল করুন', foot: 'পরশুরাম বাজার, ফেনী',
        item: 'বিবরণ', mk: 'মজুরি', amt: 'মূল্য', gold: 'স্বর্ণের দাম', disc: 'ছাড়', vat: 'ভ্যাট', adv: 'অগ্রিম / পুরোনো স্বর্ণ', ship: 'ডেলিভারি চার্জ', rate: 'দর', per: 'ভরি',
        attached: 'আপনার পেমেন্ট নিশ্চিত হয়েছে — পূর্ণ চালান নিচে দেওয়া হলো এবং PDF হিসেবে সংযুক্ত আছে।', method: 'পরিশোধ মাধ্যম' },
  en: { hi: 'Dear {n},', thanks: 'Thank you for ordering from Maa Jewellers!', got: 'We have received your order.', order: 'Order no.', total: 'Grand total',
        paid: 'Paid', due: 'Due', status: 'Status', track: 'View your order', del: { home: 'Home delivery', pickup: 'Pick up at the shop' }, dl: 'Delivery',
        next: { 'Pending': 'We are checking your payment — your invoice unlocks as soon as it is verified.', 'Awaiting payment': 'Your order is confirmed as soon as the online payment completes.',
          'Cash on delivery': 'We will call you to confirm before dispatch. Pay cash when you receive the jewellery.', 'Cash at shop': 'Please pay at the shop when you collect your jewellery.',
          'Verified': 'Your payment is verified ✓ You can now print your invoice.', 'Advance paid': 'Advance received ✓ Our craftsmen will start on your design.',
          'Delivered': 'Your jewellery has been handed over. Thank you for choosing Maa Jewellers!', 'Rejected': 'The payment could not be matched — please contact the shop.',
          'Amount mismatch': 'The amount paid does not match — please contact the shop.' },
        sub: { order: 'Order confirmation', paid: 'Payment received', status: 'Order update', invoice: 'Your invoice' }, call: 'Questions? Call us', foot: 'Parashuram Bazar, Feni',
        item: 'Item', mk: 'Making', amt: 'Amount', gold: 'Gold value', disc: 'Discount', vat: 'VAT', adv: 'Advance / old gold', ship: 'Delivery charge', rate: 'Rate', per: 'bhori',
        attached: 'Your payment is confirmed — the full invoice is below and attached as a PDF.', method: 'Paid by' }
};
const ST_BN = { 'Pending': 'যাচাইয়ের অপেক্ষায়', 'Awaiting payment': 'অনলাইন পেমেন্টের অপেক্ষায়', 'Verified': 'যাচাইকৃত ✓', 'Advance paid': 'অগ্রিম পরিশোধিত ✓',
  'Cash on delivery': 'ক্যাশ অন ডেলিভারি', 'Cash at shop': 'দোকানে পরিশোধ', 'Not paid': 'পরিশোধ হয়নি', 'Delivered': 'হস্তান্তরিত ✓', 'Rejected': 'বাতিল', 'Amount mismatch': 'টাকা মেলেনি' };
function tk_(n, bn) { const s = '৳ ' + Math.round(num_(n)).toLocaleString('en-IN'); return bn ? s.replace(/[0-9]/g, d => '০১২৩৪৫৬৭৮৯'[d]) : s; }
function esc_(s) { return String(s === undefined || s === null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
const KT = { k22: ['২২ ক্যারেট', '22K'], k21: ['২১ ক্যারেট', '21K'], k18: ['১৮ ক্যারেট', '18K'], trad: ['সনাতন', 'Traditional'] };
const MNAME = { bkash: ['বিকাশ', 'bKash'], nagad: ['নগদ', 'Nagad'], qr: ['বাংলা কিউআর', 'Bangla QR'], ssl: ['অনলাইন (SSLCommerz)', 'Online (SSLCommerz)'],
  cod: ['ক্যাশ অন ডেলিভারি', 'Cash on delivery'], cash: ['দোকানে নগদ', 'Cash at shop'] };
const bnd_ = (s) => String(s).replace(/[0-9]/g, x => '০১২৩৪৫৬৭৮৯'[x]);
function kt_(k, bn) { const x = KT[k]; return x ? x[bn ? 0 : 1] : String(k || ''); }
function weight_(tb, bn) {
  let pts = Math.round(num_(tb) * 960); if (!pts) return '';
  const b = Math.floor(pts / 960); pts -= b * 960; const a = Math.floor(pts / 60); pts -= a * 60; const r = Math.floor(pts / 10); const p = pts - r * 10;
  const U = bn ? ['ভরি', 'আনা', 'রতি', 'পয়েন্ট'] : ['bhori', 'ana', 'rati', 'point'], out = [];
  [b, a, r, p].forEach((n, i) => { if (n) out.push(n + ' ' + U[i]); });
  const s = out.join(' ') + ' (' + (num_(tb) * 11.664).toFixed(3) + (bn ? ' গ্রাম)' : ' g)');
  return bn ? bnd_(s) : s;
}
/* Itemised invoice block (items + totals) shared by the email body and the PDF */
function invTable_(inv, bn, L, pdf) {
  const T = inv.totals || {}, P = inv.pay || {};
  const M = pdf ? (n => 'Tk ' + Math.round(num_(n)).toLocaleString('en-IN')) : (n => tk_(n, bn));
  const cell = 'padding:8px 6px;border-bottom:1px solid #e9dfc6;vertical-align:top';
  const rows = (inv.items || []).map((i, n) => {
    const nm = bn ? (i.name_bn || i.name) : (i.name || i.name_bn);
    const meta = [i.carat ? kt_(i.carat, bn) : i.caratLabel, i.tb ? weight_(i.tb, bn) : i.weight, i.rate ? L.rate + ' ' + M(i.rate) + '/' + L.per : ''].filter(Boolean).join(' · ');
    return '<tr><td style="' + cell + ';width:22px;color:#8a6510">' + (bn ? bnd_(n + 1) : n + 1) + '</td><td style="' + cell + '"><b>' + esc_(nm) + (num_(i.qty) > 1 ? ' × ' + (bn ? bnd_(num_(i.qty)) : num_(i.qty)) : '') +
      '</b><br><span style="color:#7a6b52;font-size:12.5px">' + esc_(meta) + '</span></td><td style="' + cell + ';text-align:right;white-space:nowrap;color:#7a6b52">' + (num_(i.making) ? M(i.making) : '') +
      '</td><td style="' + cell + ';text-align:right;white-space:nowrap;font-weight:600">' + M(i.total) + '</td></tr>';
  }).join('');
  const kv = (k, v, strong) => '<tr><td style="padding:5px 6px;color:#5d5140">' + k + '</td><td style="padding:5px 6px;text-align:right;white-space:nowrap;' + (strong ? 'font-weight:700;font-size:17px;border-top:2px solid #c9a227' : '') + '">' + v + '</td></tr>';
  let tot = '';
  if (num_(T.gold)) tot += kv(L.gold, M(T.gold));
  if (num_(T.making)) tot += kv(L.mk, M(T.making));
  if (num_(T.discAmt)) tot += kv(L.disc, '− ' + M(T.discAmt));
  if (num_(T.vatAmt)) tot += kv(L.vat, '+ ' + M(T.vatAmt));
  if (num_(T.adv)) tot += kv(L.adv, '− ' + M(T.adv));
  if (num_(T.ship)) tot += kv(L.ship, '+ ' + M(T.ship));
  tot += kv(L.total, M(inv.grand), true);
  if (P.method) tot += kv(L.method, esc_((MNAME[P.method] || [P.method, P.method])[bn ? 0 : 1]) + (P.trx ? ' · ' + esc_(P.trx) : ''));
  tot += kv(L.paid, M(P.amount)) + kv(L.due, M(P.due));
  return '<table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:6px"><tr style="background:' + (pdf ? '#1f170c;color:#f6e27a' : '#fbf6ea') + '">' +
    '<th style="padding:8px 6px;text-align:left">#</th><th style="padding:8px 6px;text-align:left">' + L.item + '</th><th style="padding:8px 6px;text-align:right">' + L.mk + '</th><th style="padding:8px 6px;text-align:right">' + L.amt + '</th></tr>' +
    rows + '</table><table style="width:100%;max-width:360px;margin:10px 0 0 auto;border-collapse:collapse;font-size:14px">' + tot + '</table>';
}
/* A4 invoice as PDF (English text and digits, so it prints the same everywhere) */
function invoicePdf_(d) {
  const L = MT.en, inv = d.inv, c = inv.customer || {}, paidUp = num_((inv.pay || {}).due) <= 0;
  const html = '<html><body style="font-family:Arial,Helvetica,sans-serif;color:#111;margin:28px">' +
    '<table style="width:100%;border-collapse:collapse"><tr><td><div style="font-size:26px;font-weight:700;letter-spacing:.5px">MAA JEWELLERS</div>' +
    '<div style="color:#8a6510;font-size:12px;letter-spacing:3px">GOLD &amp; JEWELLERY</div><div style="font-size:12px;color:#444;margin-top:6px">1 Kazi Shopping Complex, Parashuram Bazar, Parashuram, Feni<br>Proprietor: Badal Chandra Bonik · ' + SETTINGS.SHOP_PHONE + '</div></td>' +
    '<td style="text-align:right;vertical-align:top"><div style="font-size:22px;font-weight:700;color:#8a6510">INVOICE</div><div style="font-size:13px">No. <b>' + esc_(d.id) + '</b><br>Date: ' + esc_(fmt_(new Date(num_(inv.date) || Date.now()), 'dd MMM yyyy')) +
    (inv.rateDate ? '<br>BAJUS rate of ' + esc_(inv.rateDate) : '') + '</div></td></tr></table>' +
    '<div style="height:3px;background:#c9a227;margin:14px 0"></div>' +
    '<table style="width:100%;font-size:13px"><tr><td><b>Bill to</b><br>' + esc_(c.name || d.name || '') + '<br>' + esc_(c.phone || '') + (c.addr ? '<br>' + esc_(c.addr) : '') + '</td>' +
    '<td style="text-align:right;vertical-align:top"><b>Delivery</b><br>' + (inv.delivery === 'home' ? 'Home delivery' : 'Pick up at the shop') + '<br><span style="display:inline-block;margin-top:8px;border:2px solid #c9a227;color:#8a6510;padding:4px 10px;font-weight:700">' +
    (d.status === 'Delivered' ? 'DELIVERED' : paidUp ? 'PAID · VERIFIED' : 'ADVANCE PAID') + '</span></td></tr></table>' +
    invTable_(inv, false, L, true) +
    '<p style="margin-top:28px;font-size:11.5px;color:#555">Prices follow the BAJUS gold rate on the order date, plus making charge. Thank you for shopping with Maa Jewellers.<br>' +
    'Questions: ' + SETTINGS.SHOP_PHONE + ' · WhatsApp ' + SETTINGS.SHOP_WHATSAPP + ' · ' + SETTINGS.SITE_URL + '</p></body></html>';
  return Utilities.newBlob(html, 'text/html', 'invoice.html').getAs('application/pdf').setName('Maa-Jewellers-Invoice-' + d.id + '.pdf');
}
function mailHtml_(L, bn, d) {
  const gold = '#c9a227', rows = (d.items || []).map(i => '<tr><td style="padding:8px 0;border-bottom:1px solid #f0e6c8">' + esc_(bn ? (i.name_bn || i.name) : i.name) + (num_(i.qty) > 1 ? ' × ' + num_(i.qty) : '') +
    '</td><td style="padding:8px 0;border-bottom:1px solid #f0e6c8;text-align:right;white-space:nowrap">' + tk_(i.total, bn) + '</td></tr>').join('');
  const kv = (k, v, strong) => '<tr><td style="padding:6px 0;color:#7a6b52">' + k + '</td><td style="padding:6px 0;text-align:right;' + (strong ? 'font-weight:700;font-size:17px' : '') + '">' + v + '</td></tr>';
  return '<div style="background:#f7f2e7;padding:24px 12px;font-family:\'Hind Siliguri\',Segoe UI,Arial,sans-serif;color:#1f170c">' +
    '<div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e7dcc6;border-radius:18px;overflow:hidden">' +
    '<div style="height:6px;background:linear-gradient(90deg,#b8860b,#f6e27a,#c9a227)"></div>' +
    '<div style="padding:26px 28px 8px;text-align:center"><div style="font-size:26px;font-weight:700;color:#1f170c">মা জুয়েলার্স</div>' +
    '<div style="letter-spacing:.35em;font-size:11px;color:' + gold + '">MAA JEWELLERS</div></div>' +
    '<div style="padding:10px 28px 4px"><h2 style="margin:10px 0 6px;font-size:20px;color:#1f170c">' + esc_(d.heading) + '</h2>' +
    '<p style="margin:0 0 6px">' + esc_(L.hi.replace('{n}', d.name || '')) + '</p><p style="margin:0 0 14px;line-height:1.7">' + esc_(d.intro) + '</p>' +
    '<div style="background:#fbf6ea;border:1px solid #efe3c4;border-radius:12px;padding:12px 16px;margin-bottom:14px"><b>' + L.order + ':</b> <span style="font-family:Consolas,monospace">' + esc_(d.id) + '</span><br>' +
    '<b>' + L.status + ':</b> <span style="color:#8a6510">' + esc_(bn ? (ST_BN[d.status] || d.status) : d.status) + '</span></div>' +
    (d.inv && (d.inv.items || []).length ? invTable_(d.inv, bn, L, false) + '<table style="width:100%;border-collapse:collapse;font-size:14.5px;margin-top:8px">' + kv(L.dl, L.del[d.delivery === 'home' ? 'home' : 'pickup']) + '</table>'
      : (rows ? '<table style="width:100%;border-collapse:collapse;font-size:14.5px">' + rows + '</table>' : '') +
    '<table style="width:100%;border-collapse:collapse;font-size:14.5px;margin-top:8px">' + kv(L.dl, L.del[d.delivery === 'home' ? 'home' : 'pickup']) +
    kv(L.total, tk_(d.grand, bn), true) + kv(L.paid, tk_(d.paid, bn)) + kv(L.due, tk_(d.due, bn)) + '</table>') +
    '<p style="margin:16px 0;line-height:1.7;background:#fff8e1;border-left:4px solid ' + gold + ';padding:10px 14px;border-radius:8px">' + esc_(d.next || '') + '</p>' +
    '<div style="text-align:center;margin:20px 0 8px"><a href="' + SETTINGS.SITE_URL + '/track.html?id=' + encodeURIComponent(d.id) + '" style="display:inline-block;background:linear-gradient(135deg,#fff1b8,#e7c34c 45%,#c9a227);color:#1b1406;text-decoration:none;font-weight:700;padding:12px 26px;border-radius:999px">' + L.track + ' →</a></div></div>' +
    '<div style="padding:16px 28px 22px;text-align:center;color:#7a6b52;font-size:13px;border-top:1px solid #f0e6c8">' + L.call + ': ' + SETTINGS.SHOP_PHONE + ' · WhatsApp ' + SETTINGS.SHOP_WHATSAPP + '<br>' + L.foot + '</div>' +
    '<div style="height:6px;background:linear-gradient(90deg,#c9a227,#f6e27a,#b8860b)"></div></div></div>';
}
function sendMail_(to, kind, d) {
  MAIL_ERR = '';
  if (!SETTINGS.CUSTOMER_EMAILS) { MAIL_ERR = 'off: CUSTOMER_EMAILS is false in SETTINGS'; return false; }
  if (!validEmail_(to)) { MAIL_ERR = 'address: not a valid email (' + String(to || 'empty') + ')'; return false; }
  if (!mailAllowed_(to)) return false;
  const bn = d.lang !== 'en', L = MT[bn ? 'bn' : 'en'];
  const withInv = !!(d.inv && d.attachInvoice);
  d.next = L.next[d.status] || ''; d.heading = kind === 'order' ? L.thanks : withInv ? L.sub.invoice : L.sub[kind];
  d.intro = kind === 'order' ? L.got : withInv ? L.attached : (bn ? 'আপনার অর্ডারের অবস্থা হালনাগাদ হয়েছে।' : 'Your order has been updated.');
  try {
    const mail = { to: to, subject: 'মা জুয়েলার্স · ' + (withInv ? L.sub.invoice : L.sub[kind]) + ' · ' + d.id, htmlBody: mailHtml_(L, bn, d), name: 'Maa Jewellers · মা জুয়েলার্স',
      body: L.order + ': ' + d.id + '\n' + L.status + ': ' + d.status + '\n' + L.total + ': ' + tk_(d.grand) + '\n' + d.next + '\n' + SETTINGS.SITE_URL + '/track.html?id=' + d.id };
    if (withInv) { try { mail.attachments = [invoicePdf_(d)]; } catch (e) { /* send the email even if the PDF could not be made */ } }
    MailApp.sendEmail(mail);
    return true;
  } catch (err) { MAIL_ERR = 'google: ' + String(err && err.message || err).slice(0, 200); return false; }
}

/* Try email from the editor: choose testEmail → ▶ Run, allow the permissions, then read the Execution log */
function testEmail() {
  const ok = sendMail_(SETTINGS.SHOP_EMAIL, 'status', { id: 'MJ-000000-000000-TEST', status: 'Verified', lang: 'bn', name: 'মা জুয়েলার্স (টেস্ট)', grand: 0, paid: 0, due: 0, items: [] });
  Logger.log(ok ? '✓ Test email sent to ' + SETTINGS.SHOP_EMAIL + ' — check Inbox / Spam' : '✕ NOT sent — ' + MAIL_ERR);
}
function orderMail_(o, id, status, row) {
  const items = (o.items || []).slice(0, 30).map(i => ({ name: text_(i.name, 60), name_bn: '', qty: num_(i.qty) || 1, total: num_(i.total) }));
  const P = o.pay || {}, paid = status === 'Pending' ? num_(row['Paid']) : 0;
  const inv = { items: (o.items || []).slice(0, 30).map(i => ({ name: text_(i.name, 60), qty: num_(i.qty) || 1, caratLabel: text_(i.carat, 20), weight: text_(i.weight, 40),
    rate: num_(i.rate), making: num_(i.making), total: num_(i.total) })), totals: o.totals || {}, grand: row['Grand total'],
    pay: { method: P.method || '', trx: text_(P.trx, 40), amount: paid, due: num_(row['Grand total']) - paid } };
  sendMail_(row['Email'], 'order', { id: id, status: status, lang: o.lang, name: row['Customer'], grand: row['Grand total'], paid: paid,
    due: row['Due'], delivery: o.delivery && o.delivery.method, items: items, inv: inv });
}
// called by the website server after SSLCommerz confirms a payment, or when the admin changes a status
function statusMail_(b) {
  const id = text_(b.id, 40), status = text_(b.status, 30);
  if (!/^MJ-[0-9A-Z-]{6,40}$/.test(id) || STATUS.indexOf(status) < 0) return { ok: false, error: 'bad request' };
  const f = findOrder_(id);
  if (f) {
    const sh = sheet_(TAB.orders);
    sh.getRange(f.row, C('Status')).setValue(status);
    if (b.kind === 'paid') { sh.getRange(f.row, C('Paid')).setValue(num_(b.paid)); sh.getRange(f.row, C('Due')).setValue(num_(b.due)); sh.getRange(f.row, C('TrxID')).setValue(text_(b.trx, 40));
      sh.getRange(f.row, C('Method')).setValue(b.method === 'ssl' ? 'SSLCommerz ' + text_(b.card, 30) : (MNAME[b.method] || ['', text_(b.method, 20)])[1] + ' (auto-verified)'); }
    if (status === 'Verified' || status === 'Advance paid') sh.getRange(f.row, C('Verified at')).setValue(stamp_());
  }
  const inv = b.inv && typeof b.inv === 'object' ? b.inv : null;
  const sent = sendMail_(text_(b.to, 80), b.kind === 'paid' ? 'paid' : 'status', { id: id, status: status, lang: b.lang, name: text_(b.name, 80), grand: b.grand, paid: b.paid, due: b.due,
    delivery: b.delivery, items: b.items || [], inv: inv, attachInvoice: !!inv && (status === 'Verified' || status === 'Delivered') });
  if (b.kind === 'paid') alert_('পেমেন্ট এসেছে · Payment ' + id + ' · ' + tk_(b.paid), { 'Order ID': id, Status: status, Paid: b.paid, Due: b.due, TrxID: b.trx, Method: (MNAME[b.method] || ['', b.method || ''])[1], Customer: text_(b.name, 80) });
  return { ok: true, mailed: sent, mailError: sent ? '' : MAIL_ERR };
}
