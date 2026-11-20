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
 *
 *  Setup: see SETUP-GOOGLE-SHEET.md (step by step, Bangla + English).
 * =====================================================================
 */

const SETTINGS = {
  // Change this! The SMS forwarder must send it as ?key=...  (letters/numbers only)
  SECRET: 'CHANGE-THIS-maa-2026-secret',
  // Optional: email address that gets an alert for every new order / payment
  ALERT_EMAIL: '',
  TZ: 'Asia/Dhaka',
  // An SMS amount this many taka below the "Paid" amount still counts as paid
  AMOUNT_TOLERANCE: 1
};

const TAB = { orders: 'Orders', items: 'Items', sms: 'Payments (SMS)', dash: 'Dashboard' };
const STATUS = ['Pending', 'Verified', 'Amount mismatch', 'Duplicate TrxID', 'Cash at shop', 'Not paid', 'Rejected', 'Delivered'];

const OH = ['Order ID', 'Date', 'Time', 'Customer', 'Mobile', 'Address', 'Items', 'Pieces', 'Gold (g)',
  'Gold value', 'Making', 'Discount', 'VAT', 'Advance / old gold', 'Grand total',
  'Method', 'Paid', 'Due', 'TrxID', 'Paid from', 'Status', 'Verified at', 'SMS amount', 'SMS sender',
  'Note', 'Language', 'Rate date'];
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
    const trx = pay && pay.method !== 'cash' && pay.trx ? text_(pay.trx, 20).toUpperCase().replace(/[^A-Z0-9]/g, '') : '';
    const paid = num_(pay && pay.amount);
    let status = !pay ? 'Not paid' : pay.method === 'cash' ? 'Cash at shop' : 'Pending';
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
      'SMS amount': smsAmount, 'SMS sender': smsSender, 'Note': '', 'Language': text_(o.lang, 4), 'Rate date': text_(o.rateDate, 12)
    };
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
    alert_('New order ' + id + ' — ' + status, row);
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
    if (s.incoming && s.trx) alert_('Payment SMS ' + s.trx + ' — ' + result, { 'TrxID': s.trx, 'Amount': s.amount, 'From': s.sender, 'Order': matched });
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
function alert_(subject, data) {
  if (!SETTINGS.ALERT_EMAIL) return;
  try {
    const body = Object.keys(data).map(k => k + ': ' + data[k]).join('\n');
    MailApp.sendEmail(SETTINGS.ALERT_EMAIL, 'Maa Jewellers — ' + subject, body + '\n\n' + SpreadsheetApp.getActive().getUrl());
  } catch (err) { /* mail quota or not authorised */ }
}
