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
  setup_h: ['সেটআপ পরীক্ষা', 'Setup check'], setup_re: ['আবার পরীক্ষা', 'Check again'], ck_running: ['পরীক্ষা চলছে…', 'Checking…'],
  ck_net: ['সার্ভারে পৌঁছানো যায়নি — একটু পরে আবার চেষ্টা করুন', 'Could not reach the server — try again shortly'],
  ck_fb: ['Firebase সার্ভিস অ্যাকাউন্ট (Vercel)', 'Firebase service account (Vercel)'], ck_rules: ['Firestore রুলস (Firebase)', 'Firestore rules (Firebase)'],
  ck_ssl: ['SSLCommerz অনলাইন পেমেন্ট', 'SSLCommerz online payment'], ck_mail: ['গ্রাহকের ইমেইল (SHEET_SECRET)', 'Customer emails (SHEET_SECRET)'], ck_sms: ['SMS দিয়ে স্বয়ংক্রিয় যাচাই', 'SMS auto-check'],
  ck_sandbox: ['টেস্ট মোড (sandbox) — আসল টাকা কাটবে না', 'Test mode (sandbox) — no real money'], ck_live: ['লাইভ — আসল পেমেন্ট', 'Live — real payments'],
  fix_fb_missing: ['Vercel → Environment Variables-এ FIREBASE_SERVICE_ACCOUNT যোগ করে Redeploy করুন', 'Add FIREBASE_SERVICE_ACCOUNT in Vercel → Environment Variables, then Redeploy'],
  fix_fb_bad: ['মান অসম্পূর্ণ — .json ফাইলের পুরো লেখা আবার Value-তে পেস্ট করে Redeploy করুন', 'The value is incomplete — paste the whole .json text into Value again, then Redeploy'],
  fix_fb_err: ['Firebase-এ সংযোগ হয়নি — সঠিক প্রজেক্টের কী কিনা দেখুন', 'Could not connect to Firebase — check the key is from this project'],
  fix_rules: ['পুরোনো রুলস চালু আছে — Firebase → Firestore → Rules-এ নতুন firestore.rules পুরোটা পেস্ট করে Publish করুন। এটা না করলে নতুন অর্ডার সেভ হয় না।', 'Old rules are published — paste the new firestore.rules in Firebase → Firestore → Rules and Publish. New orders cannot save until you do.'],
  fix_rules_unknown: ['যাচাই করা যায়নি — নিশ্চিত হতে নতুন firestore.rules আবার Publish করুন', 'Could not check — publish the new firestore.rules again to be sure'],
  fix_ssl_not: ['SSLCZ_STORE_ID ও SSLCZ_STORE_PASSWORD যোগ করলে চালু হবে', 'Turns on after you add SSLCZ_STORE_ID and SSLCZ_STORE_PASSWORD'],
  fix_ssl_err: ['SSLCommerz Store ID / Password গ্রহণ করেনি — ইমেইল থেকে আবার কপি করুন; টেস্ট স্টোর হলে SSLCZ_LIVE = false', 'SSLCommerz refused the Store ID / Password — copy them again from the email; for a test store SSLCZ_LIVE = false'],
  mt_btn: ['টেস্ট ইমেইল পাঠান (আপনার জিমেইলে)', 'Send a test email (to your Gmail)'], mt_sending: ['পাঠানো হচ্ছে…', 'Sending…'],
  mt_ok: ['✓ পাঠানো হয়েছে {e}-এ — ইনবক্স না পেলে Spam / Promotions দেখুন। তাহলে গ্রাহকের ইমেইলও যাবে।', '✓ Sent to {e} — if it is not in the inbox, look in Spam / Promotions. Customer emails work the same way.'],
  mt_not_sent: ['✕ গুগল শিট স্ক্রিপ্ট ইমেইল পাঠাতে পারেনি। Google Sheet → Extensions → Apps Script → ▶ Run → setup চালান এবং “Review permissions → Allow” দিয়ে জিমেইল দিয়ে পাঠানোর অনুমতি দিন। (একই ঠিকানায় এক ঘণ্টায় ৪টির বেশি ইমেইল যায় না — টেস্ট বেশি হলে এক ঘণ্টা পরে আবার চেষ্টা করুন।)',
    '✕ The Google Sheet script could not send. Open Google Sheet → Extensions → Apps Script → ▶ Run → setup and choose “Review permissions → Allow” so it may send from your Gmail. (At most 4 emails per hour go to one address — after many tests, wait an hour.)'],
  mt_fail: ['✕ পাঠানো যায়নি', '✕ Could not send'], mt_forbidden: ['✕ অ্যাডমিন যাচাই হয়নি — আবার লগইন করুন', '✕ Admin check failed — sign in again'],
  mail_not_sent: ['স্ট্যাটাস সেভ হয়েছে, কিন্তু গ্রাহকের ইমেইল যায়নি — সেটিংস → টেস্ট ইমেইল দেখুন', 'Status saved, but the customer email was not sent — see Settings → test email'],
  fix_mail_old: ['গুগল শিটে পুরোনো Apps Script চলছে — Extensions → Apps Script-এ নতুন Code.gs পুরোটা পেস্ট করুন, SECRET বসান, তারপর Deploy → Manage deployments → ✏️ → New version → Deploy (ইমেইল পাঠানোর অনুমতি দিন)', 'The Google Sheet still runs the old Apps Script — paste the new Code.gs, set SECRET, then Deploy → Manage deployments → ✏️ → New version → Deploy (allow sending email)'],
  fix_mail_secret: ['Apps Script-এর SECRET আর Vercel-এর SHEET_SECRET মেলেনি — দুটো হুবহু এক করুন (Apps Script-এ বদলালে New version Deploy করুন; Vercel-এ বদলালে Redeploy)', 'The Apps Script SECRET and Vercel SHEET_SECRET differ — make them identical (new Apps Script version / Vercel redeploy after changing)'],
  fix_mail_net: ['গুগল শিট স্ক্রিপ্টে পৌঁছানো যায়নি — Deploy-এর সময় “Who has access: Anyone” দেওয়া আছে কিনা দেখুন', 'Could not reach the Google Sheet script — check the deployment has “Who has access: Anyone”'],
  fix_mail: ['ইমেইল পাঠাতে SHEET_SECRET যোগ করুন (PAYMENTS-EMAIL-SETUP.md → D)', 'Add SHEET_SECRET to send emails (PAYMENTS-EMAIL-SETUP.md → D)'],
  fix_sms: ['ঐচ্ছিক — PAYMENTS-EMAIL-SETUP.md → সেকশন F', 'Optional — PAYMENTS-EMAIL-SETUP.md → section F'],
  sms_h: ['স্বয়ংক্রিয় পেমেন্ট যাচাই (SMS) — ফ্রি', 'Automatic payment check (SMS) — free'],
  sms_on: ['চালু', 'On'], sms_off: ['বন্ধ — সেটআপ বাকি', 'Off — setup needed'],
  sms_p: ['দোকানের ফোনে বিকাশ / নগদ / ব্যাংকের “টাকা পেয়েছেন” SMS এলে TrxID ও টাকার পরিমাণ মিলিয়ে অর্ডার নিজে থেকে যাচাই হয়, ক্রেতার চালান খুলে যায় ও ইমেইল যায়। প্রেরকের নম্বর না মিললে বা টাকা কম হলে আপনাকে হাতে দেখতে বলা হবে।',
    'When a bKash / Nagad / bank “money received” SMS reaches the shop phone, the order with the same TrxID and amount is verified automatically — the invoice unlocks and the customer gets an email. If the sender number differs or the amount is short, it waits for you.'],
  sms_url: ['SMS ফরওয়ার্ডার অ্যাপে এই লিংক দিন', 'Put this link in the SMS forwarder app'], sms_secret: ['আপনার-SECRET', 'YOUR-SECRET'],
  sms_recent: ['সাম্প্রতিক পেমেন্ট SMS', 'Recent payment SMS'], sms_none: ['এখনো কোনো SMS আসেনি', 'No payment SMS yet'], sms_wait: ['অর্ডারের অপেক্ষায়', 'Waiting for an order'],
  auto_ok: ['স্বয়ংক্রিয় যাচাই', 'Auto-verified'], sms_sender_bad: ['প্রেরকের নম্বর মেলেনি — দেখে যাচাই করুন', 'sender number differs — check and verify'],
  sms_amt_bad: ['SMS-এ টাকা কম', 'SMS amount is short'],
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
  err: ['সেভ হয়নি', 'Not saved'],
  dl_home: ['হোম ডেলিভারি', 'Home delivery'], dl_pickup: ['দোকান থেকে নেবে', 'Pickup at shop'], plan_advance: ['অগ্রিম', 'Advance'], plan_full: ['পুরো টাকা', 'Full payment'],
  plan_cod: ['ক্যাশ অন ডেলিভারি', 'Cash on delivery'], plan_shop: ['দোকানে পরিশোধ', 'Pay at shop'], refs: ['রেফারেন্স ছবি', 'Reference photos'],
  collected: ['টাকা পেয়েছি · হস্তান্তর', 'Cash collected · delivered'], mailed: ['গ্রাহককে ইমেইল পাঠানো হয়েছে', 'Customer emailed'],
  set_fee: ['হোম ডেলিভারি চার্জ (৳)', 'Home delivery charge (৳)'], set_adv: ['কাস্টম অর্ডারে অগ্রিম (%)', 'Advance for custom orders (%)'], set_cod: ['ক্যাশ অন ডেলিভারি চালু', 'Allow cash on delivery'],
  online: ['অনলাইন (SSLCommerz)', 'Online (SSLCommerz)'], show_more: ['আরও দেখুন ({n})', 'Show more ({n})'],
  customers: ['গ্রাহক', 'Customers'], ch_sales: ['গত ১৪ দিনের বিক্রি', 'Sales — last 14 days'], ch_status: ['অর্ডারের অবস্থা', 'Order status'],
  ch_top: ['সবচেয়ে বেশি বিক্রি', 'Best sellers'], ch_pay: ['পেমেন্ট মাধ্যম', 'Payment methods'], ch_cust: ['নতুন গ্রাহক', 'Newest customers'],
  morning: ['শুভ সকাল', 'Good morning'], noon: ['শুভ দুপুর', 'Good afternoon'], evening: ['শুভ সন্ধ্যা', 'Good evening'], night: ['শুভ রাত্রি', 'Good night'],
  hello_p: ['আজ {n}টি অর্ডার · {p}টি যাচাইয়ের অপেক্ষায়', '{n} orders today · {p} waiting for verification'],
  q_rates: ['দর প্রকাশ', 'Publish rates'], q_sale: ['নতুন বিক্রি', 'New sale'], q_pending: ['যাচাই বাকি দেখুন', 'Review pending'],
  csv: ['CSV ডাউনলোড', 'Download CSV'], registered: ['রেজিস্টার্ড', 'Registered'], guests: ['অতিথি', 'Guests'],
  c_name: ['নাম', 'Name'], c_contact: ['যোগাযোগ', 'Contact'], c_orders: ['অর্ডার', 'Orders'], c_spent: ['মোট কেনা', 'Spent'], c_last: ['শেষ অর্ডার', 'Last order'],
  c_wish: ['পছন্দ', 'Wishlist'], c_since: ['যোগদান', 'Joined'], no_cust: ['কোনো গ্রাহক নেই', 'No customers yet'], c_search: ['নাম, মোবাইল বা ইমেইল…', 'Name, phone or email…'],
  view_orders: ['অর্ডার দেখুন', 'View orders'], sold: ['বিক্রি', 'sold'], none_yet: ['এখনো ডেটা নেই', 'No data yet'], perm: ['অনুমতি নেই — ইমেইল যাচাই করেছেন?', 'Permission denied — is your email verified?'], none: ['—', '—']
};
const a = (k, v) => { let s = (A[k] || [k, k])[MJ.lang === 'en' ? 1 : 0]; if (v) Object.keys(v).forEach(x => { s = s.replace('{' + x + '}', v[x]); }); return s; };
const VIEWS = [['dash', '◈'], ['orders', '◎'], ['customers', '♛'], ['rates', '৳'], ['products', '❖'], ['pos', '✎'], ['settings', '⚙']];
const STATUSES = ['Pending', 'Awaiting payment', 'Verified', 'Advance paid', 'Cash on delivery', 'Cash at shop', 'Not paid', 'Amount mismatch', 'Delivered', 'Rejected'];
const fail = (e) => { console.error(e); MJ.toast(/permission/i.test(String(e && (e.code || e.message))) ? a('perm') : a('err') + ' · ' + (e && (e.code || e.message) || ''), true); };

let user = null, orders = [], rateHist = [], fsProducts = null, settings = {}, view = 'dash', orderFilter = 'all', orderQ = '';
let seenIds = null, users = [], custFilter = 'all', custQ = '';
/* smooth rendering: only the visible tab is redrawn, at most once per frame; hidden tabs catch up when opened */
let ordersLoaded = false, orderLimit = 40, dashSettled = false;
const freshIds = new Map();
let smsLog = null, autoOn = null, setup = null, setupBusy = false;
const dirty = new Set();
const shown = (name) => { if (view === name) return true; dirty.add(name); return false; };
let rq = 0;
function refresh() { if (rq) return; rq = requestAnimationFrame(() => { rq = 0; updBadge(); renderOrders(); renderDash(); renderCustomers(); }); }
function updBadge() {
  const pend = orders.filter(o => o.status === 'Pending' || o.status === 'Amount mismatch').length;
  const pb = $('#pendBadge'); if (pb) { pb.textContent = pend ? dg(pend) : ''; pb.classList.toggle('bump', !!pend); }
  document.title = (pend ? `(${pend}) ` : '') + 'Admin · মা জুয়েলার্স';
}
const skel = (n, cls) => Array.from({ length: n }, () => `<div class="sk ${cls || ''}"></div>`).join('');

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
  if (fb.onUsers) fb.onUsers(list => { users = list || []; refresh(); });
  if (fb.onSmsLog) fb.onSmsLog(list => { smsLog = list; renderSms(); });
  fetch('/api/pay/config', { cache: 'no-store' }).then(r => r.ok ? r.json() : null).then(j => { autoOn = !!(j && j.auto); }).catch(() => { autoOn = false; }).then(renderSms);
  fb.onOrders((list, err) => {
    if (!list) { if (err) fail(err); return; }
    const fresh = seenIds ? list.filter(o => !seenIds.has(o.id) && o.source !== 'shop') : [];
    seenIds = new Set(list.map(o => o.id));
    orders = list; ordersLoaded = true;
    if (fresh.length) {
      MJ.toast('🔔 ' + a('new_order') + ' · ' + fresh[0].id); chime();
      fresh.forEach(o => freshIds.set(o.id, Date.now())); setTimeout(() => { freshIds.clear(); }, 8000);
    }
    refresh();
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
  $('#csvBtn').textContent = '⇩ ' + a('csv'); $('#custSearch').placeholder = a('c_search');
  $('#posAddPick').textContent = a('pos_add'); $('#addCustom').textContent = a('pos_custom');
  $('#posCreate').textContent = a('pos_create'); $('#posClear').textContent = a('pos_clear');
  $('#posMethod').innerHTML = ['cash', 'bkash', 'nagad', 'qr', 'none'].map(m => `<option value="${m}">${m === 'none' ? a('none') : MJ.t('m_' + m)}</option>`).join('');
  $('#posStatus').innerHTML = ['Delivered', 'Verified', 'Not paid'].map(s => `<option value="${s}">${MJ.t(MJ.ST_KEY[s])}</option>`).join('');
  $$('.view').forEach(v => { v.hidden = v.dataset.view !== view; });
  updBadge(); renderDash(); renderRatesView(); renderOrders(); renderCustomers(); renderProducts(); renderSettings(); renderSms(); renderSetup(); renderPosPick(); MJ.renderPOS(); posMethodUI();
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
  if (dirty.has(v)) { dirty.delete(v); ({ dash: renderDash, orders: renderOrders, customers: renderCustomers, products: renderProducts })[v](); }
  $$('#sideNav [data-go]').forEach(b => b.classList.toggle('on', b.dataset.go === v));
  $('#viewTitle').textContent = a(v); $('#side').classList.remove('open');
  if (v === 'pos') MJ.renderPOS();
  if (v === 'settings') runSetup();
  scrollTo({ top: 0 });
}
document.addEventListener('click', e => {
  const g = e.target.closest('[data-go]'); if (g) { setView(g.dataset.go); return; }
  if (e.target.closest('#menuBtn')) { $('#side').classList.toggle('open'); return; }
  if (e.target.closest('#logoutBtn')) { fb.logout(); return; }
  if (e.target.closest('#themeBtn')) { const d = document.body.classList.toggle('dark'); try { localStorage.setItem('mj_admin_theme', d ? 'dark' : 'light'); } catch (er) { /* */ } return; }
  const qf = e.target.closest('[data-qfilter]'); if (qf) { orderFilter = qf.dataset.qfilter; setView('orders'); renderOrders(); return; }
  const co = e.target.closest('[data-cust-orders]'); if (co) { orderFilter = 'all'; orderQ = co.dataset.custOrders; $('#orderSearch').value = orderQ; setView('orders'); renderOrders(); return; }
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
const PAID_ST = ['Verified', 'Delivered', 'Advance paid'];
const paidOf = (o) => PAID_ST.includes(o.status) && o.pay ? +o.pay.amount || 0 : 0;
const ST_COL = { 'Pending': '#e0a526', 'Awaiting payment': '#5b8def', 'Verified': '#c9a227', 'Advance paid': '#d9a441', 'Cash on delivery': '#8e6bd6', 'Cash at shop': '#7a6b52',
  'Not paid': '#a7a09a', 'Amount mismatch': '#e56a3a', 'Delivered': '#1e7d33', 'Rejected': '#b3263c', 'Duplicate TrxID': '#b3263c' };
function greet() { const h = new Date().getHours(); return a(h < 12 ? 'morning' : h < 16 ? 'noon' : h < 20 ? 'evening' : 'night'); }
function salesChart() {
  const days = [...Array(14)].map((_, i) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - 13 + i); return d; });
  const vals = days.map(d => orders.filter(o => dayKey(o.createdAt) === dayKey(d.getTime())).reduce((s, o) => s + paidOf(o), 0));
  const cnt = days.map(d => orders.filter(o => dayKey(o.createdAt) === dayKey(d.getTime())).length);
  const max = Math.max(1, ...vals), W = 560, H = 210, bw = W / 14;
  $('#salesTotal').textContent = money(vals.reduce((x, y) => x + y, 0));
  return `<svg viewBox="0 0 ${W} ${H + 34}" preserveAspectRatio="none" role="img" aria-label="${a('ch_sales')}">
    <defs><linearGradient id="barG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3d77a"/><stop offset="1" stop-color="#b8860b"/></linearGradient></defs>
    ${[.25, .5, .75, 1].map(f => `<line x1="0" x2="${W}" y1="${H - H * f + 4}" y2="${H - H * f + 4}" class="gl"/>`).join('')}
    ${vals.map((v, i) => { const h = v ? Math.max(4, (v / max) * (H - 18)) : 2; const x = i * bw + bw * .18;
      return `<g class="bar" style="--i:${i}"><rect x="${x}" y="${H - h + 4}" width="${bw * .64}" height="${h}" rx="5" fill="${v ? 'url(#barG)' : 'currentColor'}" opacity="${v ? 1 : .15}"><title>${fdate(days[i].getTime())} · ${money(v)} · ${dg(cnt[i])} ${a('orders')}</title></rect>
      ${cnt[i] ? `<text x="${x + bw * .32}" y="${H - h - 2}" class="cnt">${dg(cnt[i])}</text>` : ''}
      <text x="${x + bw * .32}" y="${H + 24}" class="dl">${dg(days[i].getDate())}</text></g>`; }).join('')}
  </svg>`;
}
function donut() {
  const counts = {}; orders.forEach(o => { counts[o.status] = (counts[o.status] || 0) + 1; });
  const ent = Object.entries(counts).sort((x, y) => y[1] - x[1]), tot = orders.length;
  if (!tot) return `<p class="muted">${a('none_yet')}</p>`;
  let acc = 0; const R = 70, C = 2 * Math.PI * R;
  const segs = ent.map(([st, n]) => { const len = C * n / tot, seg = `<circle r="${R}" cx="90" cy="90" fill="none" stroke="${ST_COL[st] || '#999'}" stroke-width="26" stroke-dasharray="${len} ${C - len}" stroke-dashoffset="${-acc}" class="seg"><title>${MJ.t(MJ.ST_KEY[st] || 'st_pending')} · ${n}</title></circle>`; acc += len; return seg; }).join('');
  return `<svg viewBox="0 0 180 180" class="donut"><g transform="rotate(-90 90 90)">${segs}</g><text x="90" y="86" class="dn">${dg(tot)}</text><text x="90" y="108" class="dl2">${a('orders')}</text></svg>
    <ul class="legend">${ent.map(([st, n]) => `<li><i style="background:${ST_COL[st] || '#999'}"></i><span>${MJ.t(MJ.ST_KEY[st] || 'st_pending')}</span><b>${dg(n)}</b></li>`).join('')}</ul>`;
}
function topProducts() {
  const m = {}; orders.filter(o => o.status !== 'Rejected').forEach(o => (o.items || []).forEach(l => { const k = l.pid || ('c:' + (l.title_en || l.name)); const e = m[k] || (m[k] = { l, n: 0, sum: 0 }); e.n += +l.qty || 1; e.sum += +l.total || 0; }));
  const top = Object.values(m).sort((x, y) => y.sum - x.sum).slice(0, 5), max = Math.max(1, ...top.map(x => x.sum));
  if (!top.length) return `<p class="muted">${a('none_yet')}</p>`;
  return `<ol class="toplist">${top.map((x, i) => `<li><span class="rk">${dg(i + 1)}</span><div><b>${esc((MJ.lang === 'en' ? x.l.title_en : x.l.title_bn) || x.l.name || x.l.cat)}</b><div class="tbar"><i style="width:${(x.sum / max * 100).toFixed(1)}%"></i></div><small>${dg(x.n)} ${a('sold')} · ${money(x.sum)}</small></div></li>`).join('')}</ol>`;
}
function payMix() {
  const m = {}; orders.forEach(o => { const k = o.pay ? o.pay.method : 'none'; m[k] = (m[k] || 0) + 1; });
  const ent = Object.entries(m).sort((x, y) => y[1] - x[1]), tot = orders.length || 1;
  const col = { ssl: '#1f6fd1', bkash: '#e2136e', nagad: '#f26522', qr: '#2b2b2b', cod: '#8e6bd6', cash: '#c9a227', none: '#a7a09a' };
  if (!orders.length) return `<p class="muted">${a('none_yet')}</p>`;
  return `<div class="stackbar">${ent.map(([k, n]) => `<i style="width:${n / tot * 100}%;background:${col[k] || '#999'}" title="${k}"></i>`).join('')}</div>
    <ul class="legend">${ent.map(([k, n]) => `<li><i style="background:${col[k] || '#999'}"></i><span>${k === 'none' ? a('none') : MJ.t('m_' + k)}</span><b>${dg(Math.round(n / tot * 100))}%</b></li>`).join('')}</ul>`;
}
function renderDash() {
  if (!$('#kpis') || !shown('dash')) return;
  if (!ordersLoaded) { $('#kpis').innerHTML = skel(5, 'kpi-sk'); ['#chSales', '#chStatus', '#chTop', '#chPay', '#chCust', '#dashRecent'].forEach(id => { $(id).innerHTML = skel(3, 'line-sk'); }); return; }
  const today = dayKey(Date.now()), td = orders.filter(o => dayKey(o.createdAt) === today);
  const pend = orders.filter(o => o.status === 'Pending' || o.status === 'Amount mismatch').length;
  const rev = td.reduce((s, o) => s + paidOf(o), 0);
  const name = (user && (user.displayName || user.email || '').split(/[@\s]/)[0]) || '';
  $('#hello').innerHTML = `<div class="hello-in"><div><small>${new Date().toLocaleDateString(MJ.lang === 'en' ? 'en-GB' : 'bn-BD', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</small>
      <h2>${greet()}${name ? ', ' + esc(name) : ''} ✦</h2><p>${a('hello_p', { n: dg(td.length), p: dg(pend) })}</p></div>
      <div class="q-acts"><button class="a-btn gold" type="button" data-go="rates">৳ ${a('q_rates')}</button><button class="a-btn" type="button" data-go="pos">✎ ${a('q_sale')}</button>${pend ? `<button class="a-btn hotbtn" type="button" data-qfilter="Pending">◷ ${a('q_pending')} · ${dg(pend)}</button>` : ''}</div></div>
    <svg class="hello-art" viewBox="0 0 200 120" aria-hidden="true"><g fill="none" stroke="#f3d77a" stroke-width="1.2" opacity=".55"><path d="M10 20 C60 110 140 110 190 20"/><path d="M30 10 C70 80 130 80 170 10"/></g><g fill="#f3d77a">${[20, 45, 72, 100, 128, 155, 180].map((x, i) => `<circle cx="${x}" cy="${20 + Math.sin(i / 6 * Math.PI) * 62}" r="${i === 3 ? 7 : 4}"/>`).join('')}</g></svg>`;
  const ord = orders.length, cust = new Set(orders.map(o => (o.customer && o.customer.phone) || o.uid || o.id)).size;
  $('#kpis').innerHTML = [['k_today', dg(td.length), '◎', 'g1'], ['k_pending', dg(pend), '◷', 'g2'], ['k_rev', money(rev), '৳', 'g3'], ['k_total', dg(ord), '❖', 'g4'], ['customers', dg(Math.max(cust, users.length)), '♛', 'g5']]
    .map(([k, v, ic, g], i) => `<div class="kpi ${g} ${k === 'k_pending' && pend ? 'hot' : ''}" style="animation-delay:${i * .06}s"><i>${ic}</i><small>${a(k)}</small><b>${v}</b></div>`).join('');
  $('#chSales').innerHTML = salesChart(); $('#chStatus').innerHTML = donut(); $('#chTop').innerHTML = topProducts(); $('#chPay').innerHTML = payMix();
  const newest = users.slice().sort((x, y) => (y.createdAt || 0) - (x.createdAt || 0)).slice(0, 5);
  $('#chCust').innerHTML = newest.length ? newest.map(u => `<div class="cu-mini"><span class="cav">${u.photo ? `<img src="${esc(u.photo)}" alt="" referrerpolicy="no-referrer">` : esc(String(u.name || u.email || '?').charAt(0).toUpperCase())}</span><div><b>${esc(u.name || '—')}</b><small>${esc(u.email || '')}</small></div></div>`).join('') : `<p class="muted">${a('no_cust')}</p>`;
  const O = MJ.official;
  $('#dashRates').innerHTML = `<div class="rate-mini">${CARATS.map(k => `<div><small>${MJ.t(k)}</small><b>${money(O[k])}</b></div>`).join('')}</div><p class="muted small">${MJ.t(O.from === 'firebase' ? 'rate_meta_live' : 'rate_meta', { d: fdate(O.date) })}</p>`;
  if (!dashSettled) { dashSettled = true; setTimeout(() => { const d = $('.view[data-view="dash"]'); if (d) d.classList.add('settled'); }, 1400); }
  $('#dashRecent').innerHTML = orders.slice(0, 6).map(o => `<button class="mini-order" type="button" data-go="orders"><span class="mono">${esc(o.id)}</span><span>${esc((o.customer && o.customer.name) || '—')}</span><b>${money(o.grand)}</b>${stBadge(o.status)}</button>`).join('') || `<p class="muted">${a('no_orders')}</p>`;
}

/* ---------- customers ---------- */
function customerRows() {
  const rows = new Map();
  const key = (o) => o.uid ? 'u:' + o.uid : 'p:' + String((o.customer && o.customer.phone) || '').replace(/\D/g, '').slice(-10);
  users.forEach(u => rows.set('u:' + u.uid, { reg: true, name: u.name || '', email: u.email || '', phone: u.phone || '', photo: u.photo || '', since: u.createdAt || 0, wish: (u.wish || []).length, orders: 0, spent: 0, last: 0, q: u.phone || u.email || '' }));
  orders.forEach(o => {
    if (o.source === 'shop' && !(o.customer && o.customer.phone)) return;
    const k = key(o); if (k === 'p:') return;
    const c = o.customer || {}, r = rows.get(k) || { reg: false, name: c.name || '', email: c.email || '', phone: c.phone || '', photo: '', since: 0, wish: 0, orders: 0, spent: 0, last: 0 };
    r.orders++; r.spent += paidOf(o); r.last = Math.max(r.last, o.createdAt || 0);
    if (!r.name) r.name = c.name || ''; if (!r.phone) r.phone = c.phone || ''; if (!r.email) r.email = c.email || '';
    r.q = r.phone || r.email || r.name; rows.set(k, r);
  });
  return [...rows.values()];
}
function renderCustomers() {
  if (!$('#custTable') || !shown('customers')) return;
  const all = customerRows(), reg = all.filter(r => r.reg).length;
  $('#custChips').innerHTML = [['all', a('all'), all.length], ['reg', a('registered'), reg], ['guest', a('guests'), all.length - reg]]
    .map(([k, l, n]) => `<button type="button" class="chip ${custFilter === k ? 'on' : ''}" data-cf="${k}">${l} <em>${dg(n)}</em></button>`).join('');
  const q = custQ.trim().toLowerCase();
  const list = all.filter(r => (custFilter === 'all' || (custFilter === 'reg') === r.reg) && (!q || [r.name, r.phone, r.email].some(x => String(x).toLowerCase().includes(q))))
    .sort((x, y) => y.spent - x.spent || y.last - x.last);
  $('#custTable').innerHTML = list.length ? `<table class="tbl cust"><thead><tr><th>${a('c_name')}</th><th>${a('c_contact')}</th><th>${a('c_orders')}</th><th>${a('c_spent')}</th><th>${a('c_last')}</th><th></th></tr></thead><tbody>
    ${list.map(r => `<tr><td><div class="cu-mini"><span class="cav">${r.photo ? `<img src="${esc(r.photo)}" alt="" referrerpolicy="no-referrer">` : esc(String(r.name || r.email || '?').charAt(0).toUpperCase())}</span><div><b>${esc(r.name || '—')}</b><small>${r.reg ? '♛ ' + a('registered') + (r.since ? ' · ' + fdate(r.since) : '') : a('guests')}${r.wish ? ' · ♥ ' + dg(r.wish) : ''}</small></div></div></td>
      <td>${esc(r.phone ? dg(r.phone) : '')}${r.email ? `<br><a class="em" href="mailto:${esc(r.email)}">${esc(r.email)}</a>` : ''}</td><td>${dg(r.orders)}</td><td><b>${money(r.spent)}</b></td><td>${r.last ? fdate(r.last) : '—'}</td>
      <td>${r.orders ? `<button class="a-btn small" type="button" data-cust-orders="${esc(r.q)}">${a('view_orders')}</button>` : ''}</td></tr>`).join('')}</tbody></table>` : `<p class="muted empty-a">${a('no_cust')}</p>`;
}
$('#custChips').addEventListener('click', e => { const b = e.target.closest('[data-cf]'); if (b) { custFilter = b.dataset.cf; renderCustomers(); } });
$('#custSearch').addEventListener('input', e => { custQ = e.target.value; renderCustomers(); });

/* ---------- CSV export (opens in Excel / Google Sheets) ---------- */
$('#csvBtn').addEventListener('click', () => {
  const cols = ['Order', 'Date', 'Status', 'Customer', 'Phone', 'Email', 'Address', 'Delivery', 'Plan', 'Items', 'Grand total', 'Paid', 'Due', 'Method', 'TrxID', 'Source'];
  const q = (v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
  const rows = orders.map(o => { const c = o.customer || {}, P = o.pay || {};
    return [o.id, o.createdAt ? new Date(o.createdAt).toISOString().slice(0, 16).replace('T', ' ') : '', o.status, c.name, c.phone, c.email, c.addr, (o.delivery || {}).method || '', o.plan || '',
      (o.items || []).map(l => `${l.title_en || l.name || l.cat} ${l.carat} ${(+l.tb || 0).toFixed(4)}bh x${l.qty || 1}`).join(' | '), Math.round(+o.grand || 0), Math.round(+P.amount || 0), Math.round(+(P.due != null ? P.due : o.grand) || 0), P.method || '', P.trx || '', o.source || ''].map(q).join(','); });
  const blob = new Blob(['﻿' + [cols.map(q).join(',')].concat(rows).join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob), link = document.createElement('a');
  link.href = url; link.download = 'maa-jewellers-orders-' + new Date().toISOString().slice(0, 10) + '.csv'; document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1500);
});
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
  const ship = o.delivery && o.delivery.method === 'home' ? +o.delivery.fee || 0 : 0;
  const re = (o.items || []).reduce((s, l) => s + (+l.tb || 0) * (+R[l.carat] || 0) * (1 + mk / 100), 0) + ship;
  if (ship && Math.round(ship) !== Math.round(MJ.CONFIG.deliveryFee)) return { ok: false, known, okMath: false, re };
  const okMath = Math.abs(re - (+o.grand || 0)) <= Math.max(3, re * .001);
  const okMk = mk >= MJ.CONFIG.making - .01;          // a lower making charge than the shop's is suspicious
  return { ok: known && okMath && okMk, known, okMath, re };
}
function orderCard(o) {
  const c = o.customer || {}, P = o.pay || {}, pc = priceCheck(o);
  const phone = String(c.phone || '').replace(/[০-৯]/g, d => '০১২৩৪৫৬৭৮৯'.indexOf(d)).replace(/\D/g, '');
  const wa = phone ? 'https://wa.me/88' + phone.replace(/^88/, '') : '';
  const title = (l) => (MJ.lang === 'en' ? l.title_en : l.title_bn) || l.name || l.cat;
  return `<article class="ord ${o.status === 'Pending' ? 'pending' : ''} ${freshIds.has(o.id) ? 'fresh' : ''}" data-id="${esc(o.id)}">
    <header><div><span class="mono">${esc(o.id)}</span><small>${o.createdAt ? fdate(o.createdAt) + ' · ' + ftime(o.createdAt) : ''} · ${o.source === 'shop' ? a('shop') : a('web')}</small></div>${stBadge(o.status)}</header>
    <div class="ord-b">
      <div class="who2"><b>${esc(c.name || '—')}</b><span>${esc(c.phone ? dg(c.phone) : '')}</span>${c.email ? `<a class="em" href="mailto:${esc(c.email)}">${esc(c.email)}</a>` : ''}<small>${esc(c.addr || '')}</small></div>
      <div class="tags2"><span class="tg">${o.delivery && o.delivery.method === 'home' ? '🚚 ' + a('dl_home') + (o.delivery.fee ? ' · ' + money(o.delivery.fee) : '') : '🏬 ' + a('dl_pickup')}</span>${o.plan ? `<span class="tg">${a('plan_' + o.plan)}</span>` : ''}${P.method === 'ssl' ? `<span class="tg blue">${a('online')}</span>` : ''}${smsChip(o)}</div>
      <ul class="its">${(o.items || []).map(l => `<li><span>${l.custom ? '<em class="cust">✎</em> ' : ''}${esc(title(l))}${(+l.qty || 1) > 1 ? ' × ' + dg(l.qty) : ''} · ${MJ.t(l.carat)}</span><span>${MJ.weightText(+l.tb || 0)}</span><b>${money(l.total)}</b>${l.desc ? `<p class="idesc">${esc(l.desc)}</p>` : ''}${(l.refs || []).length ? `<div class="arefs">${l.refs.map(r => `<button type="button" class="aref" data-img><img src="${r}" alt="${a('refs')}"></button>`).join('')}</div>` : ''}</li>`).join('')}</ul>
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
      ${o.status !== 'Delivered' ? `<button class="a-btn small" type="button" data-st="Delivered">${P.method === 'cod' || P.method === 'cash' ? a('collected') : a('deliver')}</button>` : ''}
      ${o.status === 'Pending' ? `<button class="a-btn small" type="button" data-st="Amount mismatch">${a('mismatch')}</button>` : ''}
      ${o.status !== 'Rejected' && o.status !== 'Delivered' ? `<button class="a-btn small danger" type="button" data-st="Rejected">${a('reject')}</button>` : ''}
      <span class="grow"></span>
      ${wa ? `<a class="a-btn small wa" href="${wa}" target="_blank" rel="noopener">${a('wa')}</a>` : ''}
      <button class="a-btn small" type="button" data-inv>${a('invoice')}</button>
    </footer>
  </article>`;
}
function renderOrders() {
  if (!$('#orderList') || !shown('orders')) return;
  if (!ordersLoaded) { $('#orderList').innerHTML = skel(4, 'ord-sk'); return; }
  const counts = { all: orders.length }; STATUSES.forEach(s => { counts[s] = orders.filter(o => o.status === s).length; });
  $('#orderChips').innerHTML = ['all', ...STATUSES].filter(s => s === 'all' || counts[s]).map(s => `<button type="button" class="chip ${orderFilter === s ? 'on' : ''}" data-of="${s}">${s === 'all' ? a('all') : MJ.t(MJ.ST_KEY[s])} <em>${dg(counts[s])}</em></button>`).join('');
  const q = orderQ.trim().toLowerCase();
  const list = orders.filter(o => (orderFilter === 'all' || o.status === orderFilter) && (!q || [o.id, o.customer && o.customer.name, o.customer && o.customer.phone, o.pay && o.pay.trx].some(x => String(x || '').toLowerCase().includes(q))));
  const more = list.length - orderLimit;
  $('#orderList').innerHTML = (list.slice(0, orderLimit).map(orderCard).join('') || `<p class="muted empty-a">${a('no_orders')}</p>`)
    + (more > 0 ? `<button class="a-btn more-btn" type="button" data-more>${a('show_more', { n: dg(more) })}</button>` : '');
}
$('#orderChips').addEventListener('click', e => { const b = e.target.closest('[data-of]'); if (b) { orderFilter = b.dataset.of; orderLimit = 40; renderOrders(); } });
let qT = 0;
$('#orderSearch').addEventListener('input', e => { orderQ = e.target.value; orderLimit = 40; clearTimeout(qT); qT = setTimeout(renderOrders, 120); });
$('#orderList').addEventListener('click', async e => {
  if (e.target.closest('[data-more]')) { orderLimit += 40; renderOrders(); return; }
  const card = e.target.closest('.ord'); if (!card) return;
  const o = orders.find(x => x.id === card.dataset.id); if (!o) return;
  const st = e.target.closest('[data-st]');
  if (st) {
    st.disabled = true;
    const S = st.dataset.st, P = o.pay || {};
    const cashIn = S === 'Delivered' && (P.method === 'cod' || P.method === 'cash' || (+P.due || 0) > 0);
    const extra = { by: user.email }, pub = {};
    if (cashIn) { extra.pay = Object.assign({}, P, { amount: Math.round(+o.grand || 0), due: 0, collectedAt: Date.now() }); Object.assign(pub, { paid: Math.round(+o.grand || 0), due: 0 }); }
    try {
      await fb.setOrderStatus(o.id, S, extra, pub); MJ.toast(a('status_set'));
      if (o.customer && o.customer.email && fb.idToken) fb.idToken().then(tk => fetch('/api/notify', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ orderId: o.id, idToken: tk }) }))
        .then(r => r && r.json()).then(j => { if (j && j.ok && !j.skipped) MJ.toast(j.mailed === false ? '⚠ ' + a('mail_not_sent') : '✉ ' + a('mailed'), j.mailed === false); }).catch(() => {});
    } catch (err) { fail(err); st.disabled = false; }
    return;
  }
  const im = e.target.closest('[data-img]');
  if (im) { const v = document.createElement('div'); v.className = 'imgview on'; v.innerHTML = `<img src="${$('img', im).src}" alt="">`; v.onclick = () => v.remove(); document.body.appendChild(v); return; }
  if (e.target.closest('[data-inv]')) {
    MJ.openInvoice({ no: o.id, ts: o.createdAt || Date.now(), rateDate: o.rateDate, buyer: o.customer || {}, lines: (o.items || []).map(l => Object.assign({ q: +l.qty || 1 }, l)), totals: o.totals || { grand: o.grand }, pay: o.pay, status: o.status, delivery: o.delivery, plan: o.plan, cloud: true, sync: 'off' });
  }
});

/* ---------- products ---------- */
const usingFs = () => fsProducts && fsProducts.length;
function renderProducts() {
  if (!$('#prodGrid') || !shown('products')) return;
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

/* ---------- free automatic payment check (payment SMS from the shop phone) ---------- */
function smsChip(o) {
  const m = o.sms; if (!m) return '';
  const bad = m.check === 'sender' ? a('sms_sender_bad') : m.check === 'amount' ? a('sms_amt_bad') : '';
  return `<span class="tg ${bad ? 'warn' : 'green'}">${o.verifiedBy === 'sms' ? '⚡ ' + a('auto_ok') + ' · ' : '✉ '}SMS ${money(m.amount || 0)}${m.sender ? ' · ' + esc(dg(m.sender)) : ''}${bad ? ' · ' + bad : ''}</span>`;
}
function renderSms() {
  const host = $('#smsCard'); if (!host) return;
  const st = autoOn == null ? '' : `<span class="tg ${autoOn ? 'green' : 'warn'}">${autoOn ? '● ' + a('sms_on') : '○ ' + a('sms_off')}</span>`;
  const res = (x) => x.order ? `<span class="mono">${esc(x.order)}</span> · ${MJ.t(MJ.ST_KEY[x.result] || 'st_pending')}` : `<span class="muted">${a('sms_wait')}</span>`;
  const rows = smsLog == null ? `<p class="muted small">—</p>` : !smsLog.length ? `<p class="muted small">${a('sms_none')}</p>`
    : `<div class="sms-log">${smsLog.map(x => `<div class="sl"><small>${x.at ? fdate(x.at) + ' · ' + ftime(x.at) : ''} · ${esc(x.provider || '')}</small><b>${money(x.amount || 0)}</b><span class="mono">${esc(x.trx || x.id)}</span><span>${res(x)}</span></div>`).join('')}</div>`;
  host.innerHTML = `<div class="card-h"><h3>${a('sms_h')}</h3>${st}</div>
    <p class="muted small">${a('sms_p')}</p>
    <div class="sms-url"><small>${a('sms_url')}</small><code>${esc(location.origin)}/api/sms?key=<i>${a('sms_secret')}</i></code></div>
    <h4 class="sms-sub">${a('sms_recent')}</h4>${rows}`;
}

/* ---------- setup check: which owner step is still missing (server: /api/pay/config?check=1) ---------- */
function runSetup() {
  if (setupBusy) return; setupBusy = true; setup = null; renderSetup();
  fetch('/api/pay/config?check=1', { cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null)
    .then(j => { setup = j && j.check ? j.check : { error: 'net' }; setupBusy = false; renderSetup(); });
}
function renderSetup() {
  const host = $('#setupCard'); if (!host) return;
  const c = setup;
  const row = (label, ok, fix) => `<div class="ck ${ok === true ? 'ok' : ok === false ? 'bad' : 'wait'}"><i>${ok === true ? '✓' : ok === false ? '✕' : '…'}</i><div><b>${label}</b>${ok === true ? (fix ? `<small>${fix}</small>` : '') : fix ? `<small>${fix}</small>` : ''}</div></div>`;
  let body;
  if (!c) body = `<p class="muted small">${a('ck_running')}</p>`;
  else if (c.error) body = `<p class="muted small">${a('ck_net')}</p>`;
  else body = [
    row(a('ck_fb'), c.firebase === 'ok', c.firebase === 'ok' ? '' : c.firebase === 'missing' ? a('fix_fb_missing') : c.firebase === 'bad_json' ? a('fix_fb_bad') : a('fix_fb_err') + ' (' + esc(c.firebase) + ')'),
    row(a('ck_rules'), c.rules === 'current' ? true : /^unknown/.test(c.rules) ? null : false, c.rules === 'current' ? '' : /^unknown/.test(c.rules) ? a('fix_rules_unknown') : a('fix_rules')),
    row(a('ck_ssl'), c.sslcommerz === 'ok' ? true : c.sslcommerz === 'not_set' ? null : false, c.sslcommerz === 'ok' ? a(c.mode === 'live' ? 'ck_live' : 'ck_sandbox') : c.sslcommerz === 'not_set' ? a('fix_ssl_not') : a('fix_ssl_err') + ' — ' + esc(c.sslcommerz.replace(/^error:\s*/, ''))),
    row(a('ck_mail'), c.mail === 'ok' || c.mail === 'set' ? true : c.mail === 'not_set' ? null : false,
      c.mail === 'ok' || c.mail === 'set' ? '' : a({ not_set: 'fix_mail', old_script: 'fix_mail_old', secret_mismatch: 'fix_mail_secret' }[c.mail] || 'fix_mail_net')),
    row(a('ck_sms'), c.sms === 'on' ? true : null, c.sms === 'on' ? '' : a('fix_sms'))
  ].join('');
  host.innerHTML = `<div class="card-h"><h3>${a('setup_h')}</h3><button class="a-btn small" type="button" id="setupRe" ${setupBusy ? 'disabled' : ''}>${a('setup_re')}</button></div><div class="cks">${body}</div>
    <div class="mailtest"><button class="a-btn small gold" type="button" id="mailTest">✉ ${a('mt_btn')}</button><p class="muted small" id="mailTestRes">${esc(mailTestMsg)}</p></div>`;
  $('#setupRe').onclick = runSetup;
  $('#mailTest').onclick = mailTest;
}
let mailTestMsg = '';
async function mailTest() {
  const b = $('#mailTest'); b.disabled = true; mailTestMsg = a('mt_sending'); $('#mailTestRes').textContent = mailTestMsg;
  try {
    const tk = await fb.idToken();
    const r = await fetch('/api/notify', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ test: true, idToken: tk }) });
    const j = await r.json().catch(() => ({}));
    mailTestMsg = j.mailed ? a('mt_ok', { e: (user && user.email) || 'Gmail' }) : j.why === 'not_sent' ? a('mt_not_sent') : j.why === 'no_secret' ? a('fix_mail') : r.status === 403 ? a('mt_forbidden') : a('mt_fail') + ' (' + (j.why || j.error || r.status) + ')';
  } catch (e) { mailTestMsg = a('ck_net'); }
  renderSetup();
}

/* ---------- settings ---------- */
let setDirty = false;
function renderSettings() {
  if (!$('#setForm') || setDirty) return;
  const C = MJ.CONFIG;
  $('#sMaking').value = settings.making != null ? settings.making : C.making;
  $('#sLock').value = settings.lockMinutes || C.lockMinutes;
  $('#sBkash').value = settings.bkash || C.bkash; $('#sNagad').value = settings.nagad || C.nagad;
  $('#sFee').value = settings.deliveryFee != null ? settings.deliveryFee : C.deliveryFee;
  $('#sAdv').value = settings.advancePct != null ? settings.advancePct : C.advancePct;
  $('#sCod').checked = settings.codOn != null ? !!settings.codOn : C.codOn;
  $('#sNoticeOn').checked = !!settings.noticeOn; $('#sNoticeBn').value = settings.notice_bn || ''; $('#sNoticeEn').value = settings.notice_en || '';
}
$('#setForm').addEventListener('input', () => { setDirty = true; });
$('#setForm').addEventListener('submit', async e => {
  e.preventDefault();
  const st = { making: +toNum($('#sMaking').value), lockMinutes: Math.round(toNum($('#sLock').value)) || 15, bkash: $('#sBkash').value.trim(), nagad: $('#sNagad').value.trim(),
    deliveryFee: Math.max(0, Math.round(toNum($('#sFee').value))), advancePct: Math.min(100, Math.max(5, Math.round(toNum($('#sAdv').value)) || 30)), codOn: $('#sCod').checked,
    noticeOn: $('#sNoticeOn').checked, notice_bn: $('#sNoticeBn').value.trim(), notice_en: $('#sNoticeEn').value.trim() };
  try { await fb.saveSettings(st); setDirty = false; MJ.toast(a('saved')); } catch (err) { fail(err); }
});
