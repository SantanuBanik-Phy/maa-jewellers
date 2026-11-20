/* =====================================================================
   MAA JEWELLERS — Admin console (admin.html)
   Only santanubanik2k@gmail.com (Firebase Auth, verified email) gets in.
   Firestore rules enforce the same check on the server, so the customer
   site can never change rates, products or orders.
   ===================================================================== */
import * as fb from './fb.js';

const MJ = window.MJ;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const { esc, money, dg, fdate, ftime, toNum, CARATS, CATS, GRAM } = MJ;

/* ---------- admin text (Bangla / English) ---------- */
const A = {
  dash: ['ড্যাশবোর্ড', 'Dashboard'], rates: ['বাজুস দর', 'BAJUS rates'], orders: ['অর্ডার', 'Orders'], products: ['পণ্য', 'Products'],
  pos: ['দোকানে বিক্রি', 'In-store sale'], settings: ['সেটিংস', 'Settings'], view_site: ['ওয়েবসাইট দেখুন ↗', 'View website ↗'], logout: ['লগ আউট', 'Log out'],
  login_h: ['অ্যাডমিন লগইন', 'Admin sign in'], email: ['ইমেইল', 'Email'], password: ['পাসওয়ার্ড', 'Password'], login: ['লগইন', 'Sign in'],
  forgot: ['পাসওয়ার্ড ভুলে গেছেন?', 'Forgot password?'], reset_sent: ['পাসওয়ার্ড রিসেট লিংক ইমেইলে পাঠানো হয়েছে', 'Password reset link sent to your email'],
  bad_login: ['ইমেইল বা পাসওয়ার্ড ভুল — Firebase-এ এই ইউজার যোগ করেছেন তো?', 'Wrong email or password — is this user added in Firebase Authentication?'],
  e_disabled: ['Firebase-এ Email/Password লগইন চালু করা হয়নি (Authentication → Sign-in method)', 'Email/Password sign-in is not enabled in Firebase (Authentication → Sign-in method)'],
  e_many: ['অনেকবার ভুল চেষ্টা — কিছুক্ষণ পরে চেষ্টা করুন বা পাসওয়ার্ড রিসেট করুন', 'Too many attempts — wait a while or reset the password'],
  e_net: ['ইন্টারনেট সংযোগ নেই', 'No internet connection'], e_userdis: ['এই ইউজার বন্ধ করা আছে', 'This user is disabled'],
  e_config: ['firebase-config.js এর তথ্য ভুল — Firebase থেকে আবার কপি করুন', 'firebase-config.js values are wrong — copy them again from Firebase'], not_admin: ['এই অ্যাকাউন্টের অ্যাডমিন অনুমতি নেই', 'This account is not the shop admin'],
  only_admin: ['শুধুমাত্র দোকান মালিকের জন্য', 'For the shop owner only'], no_fb: ['Firebase এখনো যুক্ত হয়নি', 'Firebase is not connected yet'],
  no_fb_p: ['assets/firebase-config.js ফাইলে আপনার Firebase প্রজেক্টের তথ্য বসান — ধাপগুলো FIREBASE-SETUP.md ফাইলে আছে।', 'Paste your Firebase project config into assets/firebase-config.js — the steps are in FIREBASE-SETUP.md.'],
  verify_b: ['ইমেইল যাচাই হয়নি — যাচাই না হলে দর বা অর্ডার পরিবর্তন সেভ হবে না।', 'Email not verified — changes will not save until you verify.'],
  send_verify: ['যাচাই ইমেইল পাঠান', 'Send verification email'], i_verified: ['যাচাই করেছি', 'I have verified'], verify_sent: ['যাচাই ইমেইল পাঠানো হয়েছে — ইনবক্স দেখুন', 'Verification email sent — check your inbox'],
  k_today: ['আজকের অর্ডার', "Today's orders"], k_pending: ['যাচাই বাকি', 'Awaiting verification'], k_rev: ['আজকের আদায়', "Today's collected"], k_total: ['মোট অর্ডার', 'All orders'],
  dash_rates: ['ওয়েবসাইটে এখনকার দর', 'Live rates on the website'], dash_recent: ['সাম্প্রতিক অর্ডার', 'Recent orders'], edit: ['পরিবর্তন', 'Change'], see_all: ['সব দেখুন', 'See all'],
  rates_h: ['নতুন বাজুস দর প্রকাশ', 'Publish new BAJUS rates'], rates_p: ['প্রতি ভরি (১১.৬৬৪ গ্রাম), ভ্যাটসহ। প্রকাশ করলেই সব গ্রাহকের পেজে সাথে সাথে বদলে যাবে।', 'Per bhori (11.664 g), VAT included. Publishing updates every customer page instantly.'],
  eff_date: ['কার্যকর তারিখ', 'Effective date'], publish: ['দর প্রকাশ করুন', 'Publish rates'], rates_src: ['উৎস: বাজুস ঘোষণা (সংবাদপত্র / bajus.org)।', 'Source: BAJUS announcement (newspapers / bajus.org).'],
  rates_hist: ['দরের ইতিহাস', 'Rate history'], published: ['দর প্রকাশিত হয়েছে ✓', 'Rates published ✓'], confirm_rates: ['নিশ্চিত? সব গ্রাহকের দাম এই দরে বদলে যাবে।', 'Sure? Every customer price will change to these rates.'],
  all: ['সব', 'All'], search: ['নাম, মোবাইল, অর্ডার নং বা TrxID…', 'Name, phone, order no. or TrxID…'], no_orders: ['কোনো অর্ডার নেই', 'No orders'],
  verify: ['যাচাই ✓', 'Verify ✓'], reject: ['বাতিল', 'Reject'], deliver: ['হস্তান্তর', 'Delivered'], mismatch: ['টাকা মেলেনি', 'Amount mismatch'], invoice: ['চালান', 'Invoice'], wa: ['হোয়াটসঅ্যাপ', 'WhatsApp'],
  price_ok: ['দাম যাচাই ঠিক আছে', 'Price check OK'], price_bad: ['দাম মেলেনি — যাচাইয়ের আগে দেখুন', 'Price mismatch — check before verifying'],
  rate_unknown: ['অর্ডারের দর প্রকাশিত দরের সাথে মেলেনি', 'Order rates do not match any published rate'],
  paid: ['পরিশোধ', 'Paid'], due: ['বাকি', 'Due'], items: ['গহনা', 'Items'], web: ['ওয়েব', 'Web'], shop: ['দোকান', 'Shop'],
  new_order: ['নতুন অর্ডার এসেছে', 'New order received'], status_set: ['অবস্থা হালনাগাদ হয়েছে', 'Status updated'],
  add_prod: ['+ নতুন পণ্য', '+ New product'], seed: ['ডিফল্ট ক্যাটালগ যোগ করুন', 'Add default catalogue'], seeded: ['ক্যাটালগ যোগ হয়েছে', 'Catalogue added'],
  confirm_seed: ['১৮টি ডিফল্ট পণ্য Firestore-এ যোগ হবে (একই আইডির পণ্য বদলে যাবে)। চালিয়ে যাবেন?', 'This writes the 18 default products to Firestore (same ids are replaced). Continue?'],
  prod_count: ['{n}টি পণ্য', '{n} products'], local_cat: ['এখনো Firestore-এ পণ্য নেই — ওয়েবসাইট ডিফল্ট ক্যাটালগ দেখাচ্ছে।', 'No products in Firestore yet — the website shows the default catalogue.'],
  edit_prod: ['পণ্য সম্পাদনা', 'Edit product'], new_prod: ['নতুন পণ্য', 'New product'], upload: ['ছবি আপলোড', 'Upload photo'], img_url: ['ছবির লিংক বা Unsplash আইডি', 'Image link or Unsplash id'],
  credit: ['ছবির ক্রেডিট', 'Photo credit'], name_bn: ['নাম (বাংলা)', 'Name (Bangla)'], name_en: ['নাম (English)', 'Name (English)'], cat: ['ধরন', 'Category'], carat: ['ক্যারেট', 'Carat'],
  weight_b: ['ওজন (ভরি)', 'Weight (bhori)'], gem: ['পাথর (ডিজাইন)', 'Stone (artwork)'], badge: ['ব্যাজ', 'Badge'], order: ['ক্রম', 'Order'],
  featured: ['হোমপেজে দেখান', 'Feature on home'], sold: ['স্টক শেষ', 'Sold out'], hidden: ['লুকিয়ে রাখুন', 'Hidden'],
  delete: ['মুছুন', 'Delete'], cancel: ['বাতিল', 'Cancel'], save: ['সেভ করুন', 'Save'], saved: ['সেভ হয়েছে ✓', 'Saved ✓'], deleted: ['মুছে ফেলা হয়েছে', 'Deleted'],
  confirm_del: ['এই পণ্যটি মুছে ফেলবেন?', 'Delete this product?'], img_big: ['ছবি খুব বড় — ছোট ছবি দিন', 'Image too large — use a smaller one'],
  pos_add: ['যোগ করুন', 'Add'], pos_custom: ['+ নিজস্ব গহনা', '+ Custom item'], pos_pick: ['ক্যাটালগ থেকে বাছুন…', 'Pick from catalogue…'],
  pos_buyer: ['ক্রেতা', 'Customer'], name: ['নাম', 'Name'], phone: ['মোবাইল', 'Mobile'], addr: ['ঠিকানা', 'Address'], disc: ['ছাড়', 'Discount'], vat: ['ভ্যাট', 'VAT'], adv: ['অগ্রিম', 'Advance'],
  grand: ['সর্বমোট', 'Grand total'], pos_pay: ['পেমেন্ট', 'Payment'], method: ['মাধ্যম', 'Method'], received: ['গ্রহণ করা হয়েছে', 'Received'], status: ['অবস্থা', 'Status'],
  pos_create: ['চালান তৈরি ও সেভ', 'Create & save invoice'], pos_clear: ['নতুন বিক্রি', 'New sale'], pos_done: ['চালান সেভ হয়েছে — নতুন ট্যাবে খুলছে', 'Invoice saved — opening in a new tab'],
  set_h: ['দোকানের সেটিংস', 'Shop settings'], set_making: ['মজুরি (%)', 'Making charge (%)'], set_lock: ['দাম লকের সময় (মিনিট)', 'Price lock (minutes)'], set_notice: ['ওয়েবসাইটে নোটিশ দেখান', 'Show a notice on the website'],
  err: ['সেভ হয়নি', 'Not saved'], perm: ['অনুমতি নেই — ইমেইল যাচাই করেছেন?', 'Permission denied — is your email verified?'], none: ['—', '—']
};
const a = (k, v) => { let s = (A[k] || [k, k])[MJ.lang === 'en' ? 1 : 0]; if (v) Object.keys(v).forEach(x => { s = s.replace('{' + x + '}', v[x]); }); return s; };
const VIEWS = [['dash', '◈'], ['orders', '◎'], ['rates', '৳'], ['products', '❖'], ['pos', '✎'], ['settings', '⚙']];
const STATUSES = ['Pending', 'Verified', 'Cash at shop', 'Not paid', 'Amount mismatch', 'Delivered', 'Rejected'];
const fail = (e) => { console.error(e); MJ.toast(/permission/i.test(String(e && (e.code || e.message))) ? a('perm') : a('err') + ' · ' + (e && (e.code || e.message) || ''), true); };

let user = null, orders = [], rateHist = [], fsProducts = null, settings = {}, view = 'dash', orderFilter = 'all', orderQ = '';
let seenIds = null;

/* ---------- gate ---------- */
$('#gateLogo').innerHTML = MJ.emblem({ sparkle: true });
$('#sideLogo').innerHTML = MJ.emblem();
function gate(html) { $('#app').hidden = true; $('#gate').hidden = false; $('#gateBody').innerHTML = html; }
function loginForm(msg) {
  gate(`<p class="muted">${a('only_admin')}</p>
    <form id="loginForm" class="login">
      <label class="f"><span>${a('email')}</span><input type="email" id="lEmail" autocomplete="username" required value="${esc(fb.adminEmail)}"></label>
      <label class="f"><span>${a('password')}</span><input type="password" id="lPass" autocomplete="current-password" required></label>
      ${msg ? `<p class="err">${esc(msg)}</p>` : ''}
      <button class="a-btn gold wide" type="submit">${a('login')}</button>
      <button class="link-btn" type="button" id="forgot">${a('forgot')}</button>
    </form>
    <button class="pill-btn" type="button" id="gLang">${MJ.lang === 'en' ? 'বাংলা' : 'English'}</button>`);
  $('#loginForm').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = $('#loginForm button[type=submit]'); btn.disabled = true;
    try { await fb.login($('#lEmail').value.trim(), $('#lPass').value); }
    catch (err) {
      const c = String(err && err.code || '');
      const k = /operation-not-allowed/.test(c) ? 'e_disabled' : /too-many-requests/.test(c) ? 'e_many' : /network/.test(c) ? 'e_net' : /user-disabled/.test(c) ? 'e_userdis' : /api-key|configuration|invalid-api/.test(c) ? 'e_config' : 'bad_login';
      loginForm(a(k) + (c && k !== 'bad_login' ? ' (' + c + ')' : ''));
    }
  });
  $('#forgot').addEventListener('click', async () => {
    try { await fb.resetPassword($('#lEmail').value.trim() || fb.adminEmail); MJ.toast(a('reset_sent')); } catch (e) { fail(e); }
  });
  $('#gLang').addEventListener('click', () => { MJ.lang = MJ.lang === 'en' ? 'bn' : 'en'; loginForm(); });
}

if (!fb.enabled) {
  gate(`<h3>${a('no_fb')}</h3><p class="muted">${a('no_fb_p')}</p>`);
} else {
  fb.onAuth(async u => {
    if (!u) { user = null; loginForm(); return; }
    if (!fb.isAdmin(u)) { await fb.logout(); loginForm(a('not_admin')); return; }
    user = u; startApp();
  });
}

/* ---------- app shell ---------- */
let started = false;
function startApp() {
  $('#gate').hidden = true; $('#app').hidden = false;
  renderShell(); renderVerifyBanner();
  if (started) return; started = true;
  fb.onRates(r => { if (r && CARATS.every(k => toNum(r[k]))) { MJ.setRates({ date: r.date, k22: +r.k22, k21: +r.k21, k18: +r.k18, trad: +r.trad, updatedAt: r.updatedAt }); } renderRatesView(); renderDash(); });
  fb.onRateHistory(h => { rateHist = h || []; renderRatesView(); renderOrders(); });
  fb.onSettings(st => { settings = st || {}; MJ.setSettings(settings); renderSettings(); });
  fb.onProducts(list => { fsProducts = list || []; if (fsProducts.length) MJ.setCatalog(fsProducts); renderProducts(); renderPosPick(); });
  fb.onOrders((list, err) => {
    if (!list) { if (err) fail(err); return; }
    const fresh = seenIds ? list.filter(o => !seenIds.has(o.id) && o.source !== 'shop') : [];
    seenIds = new Set(list.map(o => o.id));
    orders = list;
    if (fresh.length) { MJ.toast('🔔 ' + a('new_order') + ' · ' + fresh[0].id); chime(); }
    const pend = orders.filter(o => o.status === 'Pending').length;
    document.title = (pend ? `(${pend}) ` : '') + 'Admin · মা জুয়েলার্স';
    renderOrders(); renderDash();
  });
  MJ.renderPOS();
}
function renderShell() {
  document.documentElement.lang = MJ.lang;
  $$('[data-a]').forEach(el => { el.textContent = a(el.dataset.a); });
  $('#sideNav').innerHTML = VIEWS.map(([k, ic]) => `<button type="button" data-go="${k}" class="${view === k ? 'on' : ''}"><i>${ic}</i><span>${a(k)}</span>${k === 'orders' ? `<em id="pendBadge"></em>` : ''}</button>`).join('');
  $('#viewTitle').textContent = a(view);
  $('#viewSite').textContent = a('view_site'); $('#logoutBtn').textContent = a('logout');
  $('#langBtn').textContent = MJ.lang === 'en' ? 'বাংলা' : 'English';
  $('#who').textContent = user ? user.email : '';
  $('#orderSearch').placeholder = a('search');
  $('#rPublish').textContent = a('publish');
  $('#addProd').textContent = a('add_prod'); $('#seedProd').textContent = a('seed');
  $('#posAddPick').textContent = a('pos_add'); $('#addCustom').textContent = a('pos_custom');
  $('#posCreate').textContent = a('pos_create'); $('#posClear').textContent = a('pos_clear');
  $('#posMethod').innerHTML = ['cash', 'bkash', 'nagad', 'qr', 'none'].map(m => `<option value="${m}">${m === 'none' ? a('none') : MJ.t('m_' + m)}</option>`).join('');
  $('#posStatus').innerHTML = ['Delivered', 'Verified', 'Not paid'].map(s => `<option value="${s}">${MJ.t(MJ.ST_KEY[s])}</option>`).join('');
  $$('.view').forEach(v => { v.hidden = v.dataset.view !== view; });
  renderDash(); renderRatesView(); renderOrders(); renderProducts(); renderSettings(); renderPosPick(); MJ.renderPOS(); posMethodUI();
}
function renderVerifyBanner() {
  const b = $('#verifyBanner');
  if (!user || user.emailVerified) { b.hidden = true; return; }
  b.hidden = false;
  b.innerHTML = `<span>⚠ ${a('verify_b')}</span><button class="a-btn small" type="button" id="sendV">${a('send_verify')}</button><button class="a-btn small gold" type="button" id="reV">${a('i_verified')}</button>`;
  $('#sendV').onclick = async () => { try { await fb.sendVerify(); MJ.toast(a('verify_sent')); } catch (e) { fail(e); } };
  $('#reV').onclick = async () => { user = await fb.reloadUser(); renderVerifyBanner(); };
}
function setView(v) {
  view = v; $$('.view').forEach(x => { x.hidden = x.dataset.view !== v; });
  $$('#sideNav [data-go]').forEach(b => b.classList.toggle('on', b.dataset.go === v));
  $('#viewTitle').textContent = a(v); $('#side').classList.remove('open');
  if (v === 'pos') MJ.renderPOS();
  scrollTo({ top: 0 });
}
document.addEventListener('click', e => {
  const g = e.target.closest('[data-go]'); if (g) { setView(g.dataset.go); return; }
  if (e.target.closest('#menuBtn')) { $('#side').classList.toggle('open'); return; }
  if (e.target.closest('#logoutBtn')) { fb.logout(); return; }
  if (e.target.closest('#langBtn')) { MJ.lang = MJ.lang === 'en' ? 'bn' : 'en'; renderShell(); return; }
});
function chime() {
  try {
    const ac = new (window.AudioContext || window.webkitAudioContext)();
    [880, 1320].forEach((f, i) => { const o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = f; o.type = 'sine'; g.gain.setValueAtTime(.0001, ac.currentTime + i * .18); g.gain.exponentialRampToValueAtTime(.18, ac.currentTime + i * .18 + .02); g.gain.exponentialRampToValueAtTime(.0001, ac.currentTime + i * .18 + .5); o.connect(g).connect(ac.destination); o.start(ac.currentTime + i * .18); o.stop(ac.currentTime + i * .18 + .55); });
  } catch (e) { /* no audio */ }
}

/* ---------- dashboard ---------- */
const dayKey = (ts) => { const d = new Date(ts || 0); return d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate(); };
function renderDash() {
  if (!$('#kpis')) return;
  const today = dayKey(Date.now()), td = orders.filter(o => dayKey(o.createdAt) === today);
  const pend = orders.filter(o => o.status === 'Pending' || o.status === 'Amount mismatch').length;
  const rev = td.filter(o => ['Verified', 'Delivered'].includes(o.status)).reduce((s, o) => s + (o.pay ? +o.pay.amount || 0 : 0), 0);
  const pb = $('#pendBadge'); if (pb) pb.textContent = pend ? dg(pend) : '';
  $('#kpis').innerHTML = [['k_today', dg(td.length), '◎'], ['k_pending', dg(pend), '◷'], ['k_rev', money(rev), '৳'], ['k_total', dg(orders.length), '❖']]
    .map(([k, v, ic]) => `<div class="kpi ${k === 'k_pending' && pend ? 'hot' : ''}"><i>${ic}</i><small>${a(k)}</small><b>${v}</b></div>`).join('');
  const O = MJ.official;
  $('#dashRates').innerHTML = `<div class="rate-mini">${CARATS.map(k => `<div><small>${MJ.t(k)}</small><b>${money(O[k])}</b></div>`).join('')}</div><p class="muted small">${MJ.t(O.from === 'firebase' ? 'rate_meta_live' : 'rate_meta', { d: fdate(O.date) })}</p>`;
  $('#dashRecent').innerHTML = orders.slice(0, 6).map(o => `<button class="mini-order" type="button" data-go="orders"><span class="mono">${esc(o.id)}</span><span>${esc((o.customer && o.customer.name) || '—')}</span><b>${money(o.grand)}</b>${stBadge(o.status)}</button>`).join('') || `<p class="muted">${a('no_orders')}</p>`;
}
const stBadge = (s) => `<span class="st ${MJ.ST_CLS[s] || ''}">${MJ.t(MJ.ST_KEY[s] || 'st_pending')}</span>`;

/* ---------- rates ---------- */
let ratesDirty = false;
function renderRatesView() {
  if (!$('#rateInputs')) return;
  const O = MJ.official;
  if (!ratesDirty) {
    $('#rDate').value = new Date().toISOString().slice(0, 10);
    $('#rateInputs').innerHTML = CARATS.map(k => `<label class="f"><span>${MJ.t(k)} · ${MJ.t('per_bhori')}</span><div class="tk"><b>৳</b><input type="number" min="1000" step="1" id="r_${k}" value="${Math.round(O[k] || 0)}" required></div><small class="muted">${money((O[k] || 0) / GRAM)} / ${MJ.t('gram')}</small></label>`).join('');
  }
  $('#rateHist').innerHTML = rateHist.length ? `<table class="tbl"><thead><tr><th>${a('eff_date')}</th>${CARATS.map(k => `<th>${MJ.t(k)}</th>`).join('')}<th></th></tr></thead><tbody>${rateHist.map(r => `<tr><td>${fdate(r.date)}</td>${CARATS.map(k => `<td>${money(r[k])}</td>`).join('')}<td class="muted small">${r.updatedAt ? ftime(r.updatedAt) + ' · ' + fdate(r.updatedAt) : ''}</td></tr>`).join('')}</tbody></table>` : `<p class="muted">—</p>`;
}
$('#rateForm').addEventListener('input', () => { ratesDirty = true; });
$('#rateForm').addEventListener('submit', async e => {
  e.preventDefault();
  const r = { date: $('#rDate').value }; CARATS.forEach(k => { r[k] = Math.round(toNum($('#r_' + k).value)); });
  if (!CARATS.every(k => r[k] > 1000)) return;
  if (!confirm(a('confirm_rates'))) return;
  const btn = $('#rPublish'); btn.disabled = true;
  try { await fb.publishRates(r, user && user.email); ratesDirty = false; MJ.toast(a('published')); } catch (err) { fail(err); }
  btn.disabled = false;
});

/* ---------- orders ---------- */
const sameRates = (x, y) => CARATS.every(k => Math.round(+x[k] || 0) === Math.round(+y[k] || 0));
function priceCheck(o) {
  if (o.source === 'shop') return { ok: true };
  const R = o.rates || {}, mk = +o.making || 0;
  const known = sameRates(R, MJ.official) || rateHist.some(h => sameRates(R, h));
  const re = (o.items || []).reduce((s, l) => s + (+l.tb || 0) * (+R[l.carat] || 0) * (1 + mk / 100), 0);
  const okMath = Math.abs(re - (+o.grand || 0)) <= Math.max(3, re * .001);
  const okMk = mk >= MJ.CONFIG.making - .01;          // a lower making charge than the shop's is suspicious
  return { ok: known && okMath && okMk, known, okMath, re };
}
function orderCard(o) {
  const c = o.customer || {}, P = o.pay || {}, pc = priceCheck(o);
  const phone = String(c.phone || '').replace(/[০-৯]/g, d => '০১২৩৪৫৬৭৮৯'.indexOf(d)).replace(/\D/g, '');
  const wa = phone ? 'https://wa.me/88' + phone.replace(/^88/, '') : '';
  const title = (l) => (MJ.lang === 'en' ? l.title_en : l.title_bn) || l.name || l.cat;
  return `<article class="ord ${o.status === 'Pending' ? 'pending' : ''}" data-id="${esc(o.id)}">
    <header><div><span class="mono">${esc(o.id)}</span><small>${o.createdAt ? fdate(o.createdAt) + ' · ' + ftime(o.createdAt) : ''} · ${o.source === 'shop' ? a('shop') : a('web')}</small></div>${stBadge(o.status)}</header>
    <div class="ord-b">
      <div class="who2"><b>${esc(c.name || '—')}</b><span>${esc(c.phone ? dg(c.phone) : '')}</span><small>${esc(c.addr || '')}</small></div>
      <ul class="its">${(o.items || []).map(l => `<li><span>${l.custom ? '<em class="cust">✎</em> ' : ''}${esc(title(l))} · ${MJ.t(l.carat)}</span><span>${MJ.weightText(+l.tb || 0)}</span><b>${money(l.total)}</b>${l.desc ? `<p class="idesc">${esc(l.desc)}</p>` : ''}</li>`).join('')}</ul>
      <div class="payx">
        <div><small>${MJ.t('grand')}</small><b>${money(o.grand)}</b></div>
        <div><small>${a('paid')}${P.method ? ' · ' + MJ.t('m_' + P.method) : ''}</small><b>${money(P.amount || 0)}</b></div>
        <div><small>${a('due')}</small><b>${money(P.due != null ? P.due : o.grand)}</b></div>
        ${P.trx ? `<div class="trx"><small>TrxID${P.sender ? ' · ' + esc(P.sender) : ''}</small><b class="mono">${esc(P.trx)}</b></div>` : ''}
      </div>
      <div class="pchk ${pc.ok ? 'ok' : 'bad'}">${pc.ok ? '✓ ' + a('price_ok') : '⚠ ' + a('price_bad') + (pc.known === false ? ' · ' + a('rate_unknown') : '') + (pc.re ? ' · ' + money(pc.re) : '')}</div>
    </div>
    <footer>
      ${o.status !== 'Verified' && o.status !== 'Delivered' ? `<button class="a-btn small gold" type="button" data-st="Verified">${a('verify')}</button>` : ''}
      ${o.status !== 'Delivered' ? `<button class="a-btn small" type="button" data-st="Delivered">${a('deliver')}</button>` : ''}
      ${o.status === 'Pending' ? `<button class="a-btn small" type="button" data-st="Amount mismatch">${a('mismatch')}</button>` : ''}
      ${o.status !== 'Rejected' && o.status !== 'Delivered' ? `<button class="a-btn small danger" type="button" data-st="Rejected">${a('reject')}</button>` : ''}
      <span class="grow"></span>
      ${wa ? `<a class="a-btn small wa" href="${wa}" target="_blank" rel="noopener">${a('wa')}</a>` : ''}
      <button class="a-btn small" type="button" data-inv>${a('invoice')}</button>
    </footer>
  </article>`;
}
function renderOrders() {
  if (!$('#orderList')) return;
  const counts = { all: orders.length }; STATUSES.forEach(s => { counts[s] = orders.filter(o => o.status === s).length; });
  $('#orderChips').innerHTML = ['all', ...STATUSES].filter(s => s === 'all' || counts[s]).map(s => `<button type="button" class="chip ${orderFilter === s ? 'on' : ''}" data-of="${s}">${s === 'all' ? a('all') : MJ.t(MJ.ST_KEY[s])} <em>${dg(counts[s])}</em></button>`).join('');
  const q = orderQ.trim().toLowerCase();
  const list = orders.filter(o => (orderFilter === 'all' || o.status === orderFilter) && (!q || [o.id, o.customer && o.customer.name, o.customer && o.customer.phone, o.pay && o.pay.trx].some(x => String(x || '').toLowerCase().includes(q))));
  $('#orderList').innerHTML = list.map(orderCard).join('') || `<p class="muted empty-a">${a('no_orders')}</p>`;
}
$('#orderChips').addEventListener('click', e => { const b = e.target.closest('[data-of]'); if (b) { orderFilter = b.dataset.of; renderOrders(); } });
$('#orderSearch').addEventListener('input', e => { orderQ = e.target.value; renderOrders(); });
$('#orderList').addEventListener('click', async e => {
  const card = e.target.closest('.ord'); if (!card) return;
  const o = orders.find(x => x.id === card.dataset.id); if (!o) return;
  const st = e.target.closest('[data-st]');
  if (st) {
    st.disabled = true;
    try { await fb.setOrderStatus(o.id, st.dataset.st, { by: user.email }); MJ.toast(a('status_set')); } catch (err) { fail(err); st.disabled = false; }
    return;
  }
  if (e.target.closest('[data-inv]')) {
    MJ.openInvoice({ no: o.id, ts: o.createdAt || Date.now(), rateDate: o.rateDate, buyer: o.customer || {}, lines: o.items || [], totals: o.totals || { grand: o.grand }, pay: o.pay, status: o.status, cloud: true, sync: 'off' });
  }
});

/* ---------- products ---------- */
const usingFs = () => fsProducts && fsProducts.length;
function renderProducts() {
  if (!$('#prodGrid')) return;
  const list = MJ.catalog;
  $('#prodCount').textContent = a('prod_count', { n: dg(list.length) }) + (usingFs() ? '' : ' · ' + a('local_cat'));
  $('#seedProd').hidden = !!usingFs();
  $('#prodGrid').innerHTML = list.map(p => `<button type="button" class="pc ${p.hidden ? 'off' : ''}" data-edit="${esc(p.id)}">
      <div class="pc-img">${MJ.art(p.cat, p.gem)}${MJ.photo(p, 300)}${p.soldOut ? `<span class="tagx">${MJ.t('sold_out')}</span>` : ''}${p.featured ? '<span class="star">★</span>' : ''}</div>
      <b>${esc(MJ.pName(p))}</b><small>${MJ.t(p.kt)} · ${MJ.weightText(p.w)} · ${MJ.t('cat_' + p.cat)}</small>
    </button>`).join('');
}
$('#seedProd').addEventListener('click', async () => {
  if (!confirm(a('confirm_seed'))) return;
  const feat = ['p01', 'p05', 'p11', 'p17'];
  try { await fb.seedProducts(MJ.PRODUCTS.map(p => Object.assign({}, p, { featured: feat.includes(p.id), soldOut: false, hidden: false, img: p.img || '', credit: p.credit || '' }))); MJ.toast(a('seeded')); } catch (e) { fail(e); }
});
const dlg = $('#prodDlg'); let editing = null, peImgData = '';
function openProd(p) {
  editing = p || null; peImgData = p ? p.img || '' : '';
  $('#prodDlgTitle').textContent = a(p ? 'edit_prod' : 'new_prod');
  $('#peCat').innerHTML = CATS.map(c => `<option value="${c}">${MJ.t('cat_' + c)}</option>`).join('');
  $('#peKt').innerHTML = CARATS.map(k => `<option value="${k}">${MJ.t(k)}</option>`).join('');
  $('#peNameBn').value = p ? p.name.bn : ''; $('#peNameEn').value = p ? p.name.en : '';
  $('#peCat').value = p ? p.cat : 'necklace'; $('#peKt').value = p ? p.kt : 'k22'; $('#peW').value = p ? p.w : '';
  $('#peGem').value = p ? p.gem || 'diamond' : 'diamond'; $('#peBadge').value = p ? p.badge || '' : '';
  $('#peOrder').value = p && p.order != null ? p.order : MJ.catalog.length;
  $('#peImg').value = /^data:/.test(peImgData) ? '' : peImgData; $('#peCredit').value = p ? p.credit || '' : '';
  $('#peFeat').checked = !!(p && p.featured); $('#peSold').checked = !!(p && p.soldOut); $('#peHide').checked = !!(p && p.hidden);
  $('#peDel').hidden = !p || !usingFs();
  prevPhoto(); hintW();
  dlg.showModal();
}
function prevPhoto() {
  const p = { img: peImgData, cat: $('#peCat').value, gem: $('#peGem').value, name: { bn: '', en: '' } };
  $('#pePrev').innerHTML = MJ.art(p.cat, p.gem) + MJ.photo(p, 400);
}
function hintW() { const w = toNum($('#peW').value); $('#peHint').textContent = w ? `${MJ.weightText(w)} · ${(w * GRAM).toFixed(3)} g · ${MJ.t($('#peKt').value)} ≈ ${money(w * (MJ.official[$('#peKt').value] || 0) * (1 + MJ.CONFIG.making / 100))}` : ''; }
$('#prodGrid').addEventListener('click', e => { const b = e.target.closest('[data-edit]'); if (b) openProd(MJ.catalog.find(p => p.id === b.dataset.edit)); });
$('#addProd').addEventListener('click', () => openProd(null));
$$('[data-x]', dlg).forEach(b => b.addEventListener('click', () => dlg.close()));
$('#peImg').addEventListener('input', e => { peImgData = e.target.value.trim(); prevPhoto(); });
['peCat', 'peGem'].forEach(id => $('#' + id).addEventListener('change', prevPhoto));
['peW', 'peKt'].forEach(id => $('#' + id).addEventListener('input', hintW));
$('#peFile').addEventListener('change', async e => {
  const f = e.target.files && e.target.files[0]; if (!f) return;
  try { peImgData = await shrink(f, 900, .8); if (peImgData.length > 700000) peImgData = await shrink(f, 640, .72); if (peImgData.length > 900000) { MJ.toast(a('img_big'), true); peImgData = ''; } $('#peImg').value = ''; prevPhoto(); }
  catch (err) { MJ.toast(a('img_big'), true); }
});
function shrink(file, max, q) {
  return new Promise((res, rej) => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas');
      c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
      res(c.toDataURL('image/jpeg', q));
    };
    img.onerror = rej; img.src = url;
  });
}
$('#prodForm').addEventListener('submit', async e => {
  e.preventDefault();
  const w = toNum($('#peW').value); if (!(w > 0)) return;
  const p = {
    id: editing ? editing.id : '', cat: $('#peCat').value, kt: $('#peKt').value, w, gem: $('#peGem').value, badge: $('#peBadge').value,
    name: { bn: $('#peNameBn').value.trim(), en: $('#peNameEn').value.trim() }, img: peImgData || '', credit: $('#peCredit').value.trim(),
    featured: $('#peFeat').checked, soldOut: $('#peSold').checked, hidden: $('#peHide').checked, order: toNum($('#peOrder').value) || 0
  };
  try {
    if (!usingFs()) {                              // first edit: move the whole default catalogue to Firestore
      const base = MJ.catalog.map((x, i) => Object.assign({}, x, { order: x.order != null ? x.order : i, featured: !!x.featured, soldOut: !!x.soldOut, hidden: !!x.hidden, img: x.img || '', credit: x.credit || '' }));
      await fb.seedProducts(base.filter(x => x.id !== p.id));
    }
    await fb.saveProduct(p); dlg.close(); MJ.toast(a('saved'));
  } catch (err) { fail(err); }
});
$('#peDel').addEventListener('click', async () => {
  if (!editing || !confirm(a('confirm_del'))) return;
  try { await fb.deleteProduct(editing.id); dlg.close(); MJ.toast(a('deleted')); } catch (err) { fail(err); }
});

/* ---------- in-store sale (POS) ---------- */
function renderPosPick() {
  if (!$('#posPick')) return;
  $('#posPick').innerHTML = `<option value="">${a('pos_pick')}</option>` + MJ.catalog.map(p => `<option value="${esc(p.id)}">${esc(MJ.pName(p))} · ${MJ.t(p.kt)} · ${MJ.weightText(p.w)}</option>`).join('');
}
$('#posAddPick').addEventListener('click', e => { const id = $('#posPick').value; if (id) MJ.addProduct(id, null, e.currentTarget); });
function posMethodUI() { const m = $('#posMethod').value; $('#posTrxWrap').hidden = !['bkash', 'nagad', 'qr'].includes(m); if (m === 'none') $('#posStatus').value = 'Not paid'; }
$('#posMethod').addEventListener('change', posMethodUI);
document.addEventListener('mj:cart', () => { const T = MJ.totals(); if (!$('#posAmt').dataset.touched) $('#posAmt').value = T.grand ? Math.round(T.grand) : ''; });
$('#posAmt').addEventListener('input', e => { e.target.dataset.touched = '1'; });
$('#posCreate').addEventListener('click', async e => {
  const btn = e.currentTarget, m = $('#posMethod').value, amt = m === 'none' ? 0 : Math.round(toNum($('#posAmt').value));
  const trx = String($('#posTrx').value || '').trim().toUpperCase();
  const pay = amt > 0 ? { method: m === 'none' ? 'cash' : m, methodLabel: MJ.I18N.en['m_' + m] || m, amount: amt, trx: ['bkash', 'nagad', 'qr'].includes(m) ? trx : '', sender: '' } : null;
  const inv = MJ.buildInvoice(pay, amt > 0 ? $('#posStatus').value : 'Not paid'); if (!inv) return;
  btn.disabled = true;
  try { await fb.createAdminOrder(MJ.orderDoc(inv, 'shop')); inv.cloud = true; } catch (err) { fail(err); btn.disabled = false; return; }
  btn.disabled = false;
  MJ.commitInvoice(inv, { currentTarget: btn }); MJ.toast(a('pos_done'));
  MJ.openInvoice(inv);
  MJ.clearPOS(); $('#posAmt').value = ''; delete $('#posAmt').dataset.touched; $('#posTrx').value = '';
});
$('#posClear').addEventListener('click', () => { MJ.clearPOS(); $('#posAmt').value = ''; delete $('#posAmt').dataset.touched; });

/* ---------- settings ---------- */
let setDirty = false;
function renderSettings() {
  if (!$('#setForm') || setDirty) return;
  const C = MJ.CONFIG;
  $('#sMaking').value = settings.making != null ? settings.making : C.making;
  $('#sLock').value = settings.lockMinutes || C.lockMinutes;
  $('#sBkash').value = settings.bkash || C.bkash; $('#sNagad').value = settings.nagad || C.nagad;
  $('#sNoticeOn').checked = !!settings.noticeOn; $('#sNoticeBn').value = settings.notice_bn || ''; $('#sNoticeEn').value = settings.notice_en || '';
}
$('#setForm').addEventListener('input', () => { setDirty = true; });
$('#setForm').addEventListener('submit', async e => {
  e.preventDefault();
  const st = { making: +toNum($('#sMaking').value), lockMinutes: Math.round(toNum($('#sLock').value)) || 15, bkash: $('#sBkash').value.trim(), nagad: $('#sNagad').value.trim(),
    noticeOn: $('#sNoticeOn').checked, notice_bn: $('#sNoticeBn').value.trim(), notice_en: $('#sNoticeEn').value.trim() };
  try { await fb.saveSettings(st); setDirty = false; MJ.toast(a('saved')); } catch (err) { fail(err); }
});
