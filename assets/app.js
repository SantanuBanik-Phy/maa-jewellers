/* =====================================================================
   MAA JEWELLERS — shared site logic
   ---------------------------------------------------------------------
   EDIT HERE:
   · CONFIG   — phone, WhatsApp, default making charge
   · BUILTIN  — fallback BAJUS rates (rates.json overrides when hosted)
   · PRODUCTS — your catalogue (names, carat, weight in bhori)
   ===================================================================== */
(() => {
'use strict';
const SCRIPT_URL = (document.currentScript && document.currentScript.src) || location.href;

const CONFIG = {
  whatsapp: '8801817533313',          // international format, no +
  whatsappShow: '01817-533313',
  phone: '01819508127',
  phoneShow: '01819-508127',
  mapQuery: 'Kazi Shopping Complex, Parashuram Bazar, Parashuram, Feni, Bangladesh',
  bkash: '01819508127',               // bKash number
  nagad: '01758178880',               // Nagad number
  qrMerchant: 'MAA JEWELLERS',        // Bangla QR (Islami Bank) merchant name
  qrTid: 'T5761571',
  qrImg: 'assets/img/bangla-qr.png',
  qrPlain: 'assets/img/bangla-qr-plain.png',     // black & white, used on the invoice
  qrPoster: 'assets/img/bangla-qr-poster.jpg',
  /* Google Sheet backend — paste your Apps Script Web App URL (ends with /exec).
     Leave '' to switch it off. Setup: SETUP-GOOGLE-SHEET.md */
  sheetUrl: 'https://script.google.com/macros/s/AKfycbx57QPz_0xrFiQNwMC4FF7WiljoTLHs-5Yz63TXuqIsN-C5WB1jj1YMlReDC2vroNjeRg/exec',
  making: 6,                          // default making charge, % (admin can change in the panel)
  lockMinutes: 15,                    // checkout price lock
  deliveryFee: 150,                   // home delivery charge (admin can change)
  advancePct: 30,                     // advance % for custom-design orders (admin can change)
  mfsMax: 50000,                      // bKash / Nagad Send Money: most a customer can send in one day (Bangladesh Bank limit)
  codOn: true,                        // allow cash on delivery (admin can change)
  liveEverySec: 60,                   // international price refresh
  fxEveryMin: 30
};

/* BAJUS rates per bhori (VAT included). Effective 20 Nov 2026. */
const BUILTIN = { date: '2026-11-20', k22: 201146, k21: 192106, k18: 164987, trad: 135886 };

/* Catalogue — w = weight in bhori (1 bhori = 16 ana). gem: ruby | emerald | sapphire | diamond */
/* img = Unsplash photo id (free Unsplash License) — replace with your own photos from the admin panel. */
const PRODUCTS = [
  { id: 'p01', cat: 'necklace', kt: 'k22', w: 4,      gem: 'ruby',     badge: 'bridal', img: '1709295208567-ce817387e977', credit: 'Aslı Yaren Peker Kaya', name: { bn: 'ব্রাইডাল গোল্ড কালেকশন', en: 'Bridal Gold Collection' } },
  { id: 'p02', cat: 'necklace', kt: 'k22', w: 2.5,    gem: 'emerald',  badge: 'best',   name: { bn: 'পদ্ম চোকার', en: 'Lotus Choker' } },
  { id: 'p03', cat: 'earrings', kt: 'k21', w: 0.25,   gem: 'diamond',  badge: 'new',    img: '1704445010872-2faefdd733aa', credit: 'Anastasia Anastasia', name: { bn: 'লাভ-নট টপ', en: 'Love-Knot Studs' } },
  { id: 'p04', cat: 'earrings', kt: 'k22', w: 0.625,  gem: 'ruby',     badge: 'best',   name: { bn: 'ঐতিহ্যবাহী ঝুমকা', en: 'Classic Jhumka' } },
  { id: 'p05', cat: 'bangles',  kt: 'k22', w: 3,      gem: 'ruby',     badge: 'bridal', img: '1611107683227-e9060eccd846', credit: 'Syed F Hashemi', name: { bn: 'নকশি চুড়ি সেট', en: 'Nakshi Bangle Set' } },
  { id: 'p06', cat: 'bangles',  kt: 'k21', w: 1.5,    gem: 'diamond',  badge: '',       img: '1586878340506-af074f2ee999', credit: 'LUM3N', name: { bn: 'কাফ বালা', en: 'Cuff Bangle' } },
  { id: 'p07', cat: 'ring',     kt: 'k21', w: 0.25,   gem: 'ruby',     badge: 'new',    img: '1608042314453-ae338d80c427', credit: 'Luisana Galicia', name: { bn: 'পাথরের আংটি', en: 'Gemstone Ring' } },
  { id: 'p08', cat: 'ring',     kt: 'k22', w: 0.375,  gem: 'diamond',  badge: '',       img: '1644872276691-6f7288c6061a', credit: 'Oscar Ivan Esquivel Arteaga', name: { bn: 'বিয়ের আংটি (জোড়া)', en: 'Wedding Bands (pair)' } },
  { id: 'p09', cat: 'chain',    kt: 'k21', w: 0.75,   gem: 'diamond',  badge: '',       img: '1640183297213-863406155597', credit: 'Shruti Singh', name: { bn: 'গলার চেইন', en: 'Neck Chain' } },
  { id: 'p10', cat: 'chain',    kt: 'k22', w: 1,      gem: 'diamond',  badge: 'best',   img: '1602527418456-8b5cd2c7a4c2', credit: 'Paolo Cifuentes', name: { bn: 'রোপ চেইন', en: 'Rope Chain' } },
  { id: 'p11', cat: 'pendant',  kt: 'k21', w: 0.25,   gem: 'diamond',  badge: 'new',    img: '1761211115639-54394f139142', credit: 'John Marfe Bitoon', name: { bn: 'হার্ট লকেট', en: 'Heart Locket' } },
  { id: 'p12', cat: 'pendant',  kt: 'k21', w: 0.3125, gem: 'emerald',  badge: '',       img: '1761211106346-939cb32005d7', credit: 'John Marfe Bitoon', name: { bn: 'হার্ট চার্ম নেকলেস', en: 'Heart Charm Necklace' } },
  { id: 'p13', cat: 'nosepin',  kt: 'k18', w: 0.0625, gem: 'diamond',  badge: '',       name: { bn: 'ফুল নাকফুল', en: 'Flower Nose Pin' } },
  { id: 'p14', cat: 'nosepin',  kt: 'k21', w: 0.25,   gem: 'ruby',     badge: 'bridal', name: { bn: 'বিয়ের নথ', en: 'Bridal Nath' } },
  { id: 'p15', cat: 'bracelet', kt: 'k18', w: 0.375,  gem: 'sapphire', badge: 'new',    name: { bn: 'চার্ম ব্রেসলেট', en: 'Charm Bracelet' } },
  { id: 'p16', cat: 'bracelet', kt: 'k22', w: 1,      gem: 'ruby',     badge: '',       name: { bn: 'কাঁকন ব্রেসলেট', en: 'Kankan Bracelet' } },
  { id: 'p17', cat: 'ring',     kt: 'k18', w: 0.3125, gem: 'diamond',  badge: 'new',    img: '1611955167811-4711904bb9f8', credit: 'Gary Yost', name: { bn: 'টোপাজ আংটি', en: 'Topaz Cocktail Ring' } },
  { id: 'p18', cat: 'ring',     kt: 'k18', w: 0.1875, gem: 'diamond',  badge: '',       img: '1634390756696-505390283f61', credit: 'Sama Hosseini', name: { bn: 'সলিটেয়ার আংটি', en: 'Solitaire Ring' } }
];
const FEATURED = ['p01', 'p05', 'p11', 'p17'];
const CATS = ['necklace', 'earrings', 'bangles', 'ring', 'chain', 'pendant', 'nosepin', 'bracelet'];
const CARATS = ['k22', 'k21', 'k18', 'trad'];
const GRAM = 11.664, OZ = 31.1035;
const NAV = [['home', 'index.html'], ['shop', 'shop.html'], ['calc', 'calculator.html'], ['track', 'track.html'], ['about', 'about.html'], ['contact', 'contact.html']];

/* =====================================================================
   TRANSLATIONS
   ===================================================================== */
const I18N = {
bn: {
  brand: 'মা জুয়েলার্স', owner: 'বাদল চন্দ্র বণিক', proprietor: 'প্রোপ্রাইটর',
  address: '১ কাজী শপিং কমপ্লেক্স, পরশুরাম বাজার, পরশুরাম, ফেনী', address_l: 'ঠিকানা',
  nav_home: 'হোম', nav_shop: 'শপ', nav_calc: 'হিসাব', nav_invoice: 'চালান', nav_about: 'আমাদের কথা', nav_contact: 'যোগাযোগ',
  nav_home_en: 'Home', nav_shop_en: 'Shop', nav_calc_en: 'Calculator', nav_invoice_en: 'Invoice', nav_about_en: 'About', nav_contact_en: 'Contact',
  menu: 'মেনু', close: 'বন্ধ করুন', lang_aria: 'Switch to English', theme_aria: 'থিম পরিবর্তন', cart: 'কার্ট', cart_aria: 'কার্ট ও হিসাব',
  wa_tip: 'হোয়াটসঅ্যাপে কথা বলুন', call: 'কল করুন', whatsapp: 'হোয়াটসঅ্যাপ', phone: 'ফোন',
  /* ticker */
  tk_live: 'লাইভ', tk_spot: 'আন্তর্জাতিক স্বর্ণ', tk_fx: 'ডলার', tk_24: '২৪K আন্তর্জাতিক/ভরি', tk_22i: '২২K আন্তর্জাতিক/ভরি',
  tk_b: 'বাজুস', tk_today: 'আজ', tk_upd: '{s} আগে হালনাগাদ', tk_wait: 'লাইভ দর আনা হচ্ছে…', tk_off: 'অফলাইন — শেষ জানা দর',
  sec: 'সেকেন্ড', min: 'মিনিট', just: 'এইমাত্র',
  /* rates */
  k22: '২২ ক্যারেট', k21: '২১ ক্যারেট', k18: '১৮ ক্যারেট', trad: 'সনাতন পদ্ধতি',
  k22_s: 'হলমার্ক', k21_s: 'গহনা', k18_s: 'গহনা', trad_s: 'ঐতিহ্যবাহী', kt_short_trad: 'সনাতন',
  per_bhori: 'প্রতি ভরি', per_gram: 'প্রতি গ্রাম', official: 'বাজুস', custom: 'নিজস্ব দর',
  rate_meta: 'বাজুস দর কার্যকর: {d}', rate_meta_file: 'rates.json থেকে হালনাগাদ · কার্যকর: {d}', rate_meta_custom: ' · কিছু দর দোকানের নিজস্ব',
  edit_rates: 'দর পরিবর্তন',
  intl_title: 'আন্তর্জাতিক বাজার · লাইভ', intl_sub: 'প্রতি {n} সেকেন্ডে স্বয়ংক্রিয় হালনাগাদ',
  m_spot: 'স্পট গোল্ড / আউন্স', m_fx: '১ মার্কিন ডলার', m_24: '২৪K / ভরি', m_22: '২২K / ভরি', m_day: 'আজ', m_vs: 'বাজুস ২২K থেকে পার্থক্য',
  spark_lbl: 'এই ডিভাইসে লাইভ চার্ট', spark_wait: 'লাইভ ডেটা জমা হচ্ছে… কিছুক্ষণ পর চার্ট দেখা যাবে',
  intl_note: 'আন্তর্জাতিক মূল্য শুধু ধারণার জন্য; বিক্রয় হয় বাজুস দরে।',
  dlg_title: 'আজকের দর পরিবর্তন', dlg_sub: 'দোকানের নিজস্ব দর দিন। নতুন বাজুস দর এলে এটি বাতিল হবে।',
  use_bajus: 'বাজুস দর ব্যবহার', cancel: 'বাতিল', save: 'সংরক্ষণ', t_rates: 'দর সংরক্ষিত হয়েছে', t_bajus: 'বাজুস দরে ফেরত',
  /* home */
  hero_pill: 'আজকের ২২ ক্যারেট দর {r}', hero_tag: 'আধুনিক ও রুচিসম্মত স্বর্ণালংকার — প্রস্তুত, সরবরাহ ও অর্ডার অনুযায়ী তৈরি।',
  cta_shop: 'গহনা দেখুন', cta_wa: 'হোয়াটসঅ্যাপে অর্ডার', cta_calc: 'দাম হিসাব করুন',
  hs1: 'হলমার্ক স্বর্ণ', hs2b: 'বাজুস দর', hs2: 'স্বচ্ছ মূল্য', hs3b: 'অর্ডারে', hs3: 'নিজস্ব ডিজাইন',
  rb_lbl: '২২ ক্যারেট · বাজুস', ib_lbl: 'আন্তর্জাতিক · লাইভ',
  strip1: 'খাঁটি স্বর্ণ', strip2: 'বিয়ের গহনা', strip3: 'অর্ডারে তৈরি', strip4: 'বাজুস দরে বিক্রি', strip5: 'হলমার্ক ২২ ক্যারেট', strip6: 'প্রতিটি কেনায় চালান',
  k_rates: 'Live gold rate', rates_title: 'আজকের স্বর্ণের দর', rates_sub: 'বাজুস নির্ধারিত দর — প্রতি ভরি (১১.৬৬৪ গ্রাম), ভ্যাটসহ',
  k_feat: 'Featured', feat_title: 'জনপ্রিয় গহনা', feat_sub: 'আজকের দরে আনুমানিক মূল্যসহ — পছন্দ হলে কার্টে যোগ করুন।', view_all: 'সব গহনা দেখুন',
  k_why: 'Why Maa Jewellers', why_title: 'কেন মা জুয়েলার্স',
  why1_t: 'খাঁটি স্বর্ণ', why1_d: '২২, ২১, ১৮ ক্যারেট ও সনাতন — প্রতিটি গহনার ক্যারেট পরিষ্কারভাবে লেখা।',
  why2_t: 'বাজুস দরে স্বচ্ছ মূল্য', why2_d: 'ওজন × আজকের বাজুস দর + মজুরি — হিসাব আপনার চোখের সামনে।',
  why3_t: 'অর্ডারে তৈরি', why3_d: 'আপনার পছন্দের ডিজাইন বা ছবি দেখিয়ে অর্ডার দিন।',
  why4_t: 'প্রতিটি কেনায় চালান', why4_d: 'সুন্দর প্রিন্টেড চালান বা PDF — হোয়াটসঅ্যাপেও পাঠানো যায়।',
  k_how: 'How it works', how_title: 'কেনাকাটা খুব সহজ',
  how1_t: 'গহনা বাছাই', how1_d: 'শপ থেকে পছন্দের গহনা কার্টে যোগ করুন।',
  how2_t: 'দাম হিসাব', how2_d: 'ক্যারেট ও ওজন দিন — আজকের দরে দাম সাথে সাথে।',
  how3_t: 'চালান তৈরি', how3_d: 'এক ক্লিকে সুন্দর চালান, প্রিন্ট বা PDF।',
  how4_t: 'হোয়াটসঅ্যাপে অর্ডার', how4_d: 'অর্ডার বা চালান সরাসরি আমাদের পাঠান।',
  cta_t: 'আপনার স্বপ্নের গহনা, আমাদের কারিগরি', cta_d: 'ডিজাইন, দাম বা অর্ডার — যেকোনো প্রশ্ন হোয়াটসঅ্যাপে করুন।',
  /* shop */
  shop_title: 'আমাদের শপ', shop_sub: 'সব গহনা এক জায়গায় — আজকের বাজুস দরে আনুমানিক মূল্যসহ।',
  search_ph: 'গহনা খুঁজুন…', sort_feat: 'বাছাইকৃত', sort_low: 'দাম: কম থেকে বেশি', sort_high: 'দাম: বেশি থেকে কম', sort_light: 'ওজন: হালকা আগে',
  all: 'সব', est: 'আনুমানিক', add_cart: 'কার্টে যোগ', added: '✦ কার্টে যোগ হয়েছে', enquire: 'হোয়াটসঅ্যাপে জিজ্ঞাসা', quick: 'বিস্তারিত দেখুন',
  no_results: 'কোনো গহনা পাওয়া যায়নি', price_note: 'আনুমানিক মূল্য = ওজন × আজকের বাজুস দর + {m}% মজুরি। চূড়ান্ত মূল্য দোকানে ওজন অনুযায়ী।',
  b_bridal: 'বিয়ের', b_best: 'জনপ্রিয়', b_new: 'নতুন',
  cat_necklace: 'নেকলেস', cat_earrings: 'কানের দুল', cat_bangles: 'চুড়ি ও বালা', cat_ring: 'আংটি', cat_chain: 'চেইন', cat_pendant: 'লকেট', cat_nosepin: 'নাকফুল', cat_bracelet: 'ব্রেসলেট', cat_custom: 'অন্যান্য গহনা',
  qv_weight: 'ওজন', qv_kt: 'ক্যারেট বেছে নিন', qv_gold: 'স্বর্ণের মূল্য', qv_mk: 'মজুরি ({m}%)', qv_total: 'আনুমানিক মূল্য',
  /* calculator */
  calc_title: 'দাম হিসাব', calc_sub: 'যেকোনো ওজন ও ক্যারেটে আজকের বাজুস দরে আনুমানিক দাম জানুন।',
  step1: 'বাছাই', step2: 'হিসাব', step3: 'চালান', today_rate: 'আজকের দর',
  cart_empty: 'কার্ট খালি', cart_empty2: 'শপ থেকে গহনা যোগ করুন, অথবা দাম হিসাব পাতা থেকে নিজস্ব ওজনে অর্ডার দিন',
  go_shop: 'শপে যান', add_custom: 'নিজস্ব গহনা যোগ করুন', item_name: 'গহনার নাম', carat: 'ক্যারেট', weight: 'ওজন',
  by_bhori: 'ভরি', by_gram: 'গ্রাম', bhori: 'ভরি', ana: 'আনা', rati: 'রতি', point: 'পয়েন্ট', gram: 'গ্রাম',
  making: 'মজুরি', mc_pct: '% হারে', mc_tk: '৳ / ভরি', gold_value: 'স্বর্ণ', remove: 'মুছুন', need_w: 'ওজন দিন', removed: 'গহনাটি সরানো হয়েছে',
  conv_note: '✦ ১ ভরি = ১৬ আনা = ৯৬ রতি · ১ রতি = ১০ পয়েন্ট · ১ ভরি = ১১.৬৬৪ গ্রাম',
  buyer_h: 'ক্রেতার তথ্য', buyer_name: 'ক্রেতার নাম', buyer_phone: 'মোবাইল', buyer_addr: 'ঠিকানা',
  sum_h: 'হিসাবের সারাংশ', discount: 'ছাড়', vat: 'অতিরিক্ত ভ্যাট', advance: 'অগ্রিম / পুরাতন স্বর্ণ বাবদ',
  vat_note: 'বাজুস দরে ৫% ভ্যাট আগেই যুক্ত — প্রয়োজন হলেই অতিরিক্ত ভ্যাট দিন।',
  items: '{n}টি গহনা', subtotal: 'উপমোট', gold_total: 'স্বর্ণের মূল্য', making_total: 'মোট মজুরি',
  less_disc: 'ছাড় ({p})', plus_vat: 'ভ্যাট ({p})', less_adv: 'অগ্রিম / পুরাতন স্বর্ণ', grand: 'সর্বমোট',
  make_inv: 'চালান তৈরি করুন', order_wa: 'হোয়াটসঅ্যাপে অর্ডার পাঠান', more_items: 'আরও গহনা যোগ করুন',
  t_noweight: 'সব গহনার ওজন দিন', t_empty: 'কার্ট খালি — আগে গহনা যোগ করুন', t_inv: '✦ চালান তৈরি হয়েছে',
  /* invoice */
  inv_title: 'চালান', inv_sub: 'সোনালি ফ্রেম ও ওয়াটারমার্কসহ চালান — প্রিন্ট, PDF বা হোয়াটসঅ্যাপে পাঠান।',
  inv_none: 'এখনো কোনো চালান নেই', inv_none2: 'কার্ট থেকে অর্ডার দিন — পেমেন্টের পরই চালান এখানে দেখাবে।', go_calc: 'হিসাব পাতায় যান',
  print: 'প্রিন্ট / PDF', share_wa: 'হোয়াটসঅ্যাপে পাঠান', edit_cart: 'হিসাব সম্পাদনা', new_sale: 'নতুন বিক্রয়',
  inv_word: 'চালান', inv_no: 'চালান নং', inv_date: 'তারিখ', inv_time: 'সময়', bill_to: 'ক্রেতা', mobile: 'মোবাইল', rate_date: 'দরের তারিখ',
  th_sl: 'ক্রম', th_item: 'গহনা', th_kt: 'ক্যারেট', th_w: 'ওজন', th_rate: 'দর / ভরি', th_mc: 'মজুরি', th_amt: 'মূল্য',
  in_words: 'কথায়', taka_only: 'টাকা মাত্র',
  inv_note: 'দর: বাজুস নির্ধারিত, কার্যকর {d} (৫% ভ্যাটসহ)। ওজন দোকানের ডিজিটাল পাল্লায় মাপা।',
  sign_buyer: 'ক্রেতার স্বাক্ষর', sign_seller: 'বিক্রেতার স্বাক্ষর', thanks: 'মা জুয়েলার্স-এ কেনাকাটার জন্য আন্তরিক ধন্যবাদ',
  confirm_new: 'নতুন বিক্রয় শুরু করবেন? কার্ট ও চালান মুছে যাবে।', t_new: 'নতুন বিক্রয় শুরু',
  /* about */
  about_title: 'আমাদের কথা', about_lead: 'পরশুরাম বাজারের বিশ্বস্ত স্বর্ণালংকারের দোকান — যেখানে প্রতিটি গহনা যত্নে তৈরি।',
  k_story: 'Our story', story_t: 'স্বর্ণে গাঁথা বিশ্বাস',
  about_p1: '<b>মা জুয়েলার্স</b> ফেনীর পরশুরাম বাজারের কাজী শপিং কমপ্লেক্সে অবস্থিত একটি স্বর্ণালংকারের দোকান। এখানে আধুনিক ও রুচিসম্মত স্বর্ণালংকার প্রস্তুত ও সরবরাহ করা হয়।',
  about_p2: 'আমরা অর্ডার অনুযায়ী গহনা তৈরি করি — আপনার পছন্দের ডিজাইন, ছবি বা পুরনো গহনার আদলে।',
  about_p3: 'প্রতিটি বিক্রয়ে আমরা বাজুস নির্ধারিত দর অনুসরণ করি এবং ওজন, দর ও মজুরি আলাদা করে চালানে দেখাই — যাতে আপনি জানেন ঠিক কিসের জন্য মূল্য দিচ্ছেন।',
  k_promise: 'Our promise', promise_t: 'আমাদের প্রতিশ্রুতি',
  pr1_t: 'সঠিক ক্যারেট', pr1_d: 'যে ক্যারেট বলা হয়, সেই ক্যারেটই — চালানে লেখা থাকে।',
  pr2_t: 'সঠিক ওজন', pr2_d: 'ভরি, আনা, রতি ও গ্রামে — আপনার সামনে মাপা।',
  pr3_t: 'বাজুস দর', pr3_d: 'আজকের বাজুস দর অনুযায়ী স্বচ্ছ মূল্য নির্ধারণ।',
  pr4_t: 'যত্নশীল সেবা', pr4_d: 'অর্ডার, ডিজাইন বা প্রশ্ন — কল বা হোয়াটসঅ্যাপে সহজ যোগাযোগ।',
  k_process: 'Our craft', process_t: 'একটি গহনার যাত্রা',
  pc1_t: 'ডিজাইন', pc1_d: 'আপনার পছন্দ শুনে নকশা ঠিক করা',
  pc2_t: 'স্বর্ণ নির্বাচন', pc2_d: 'সঠিক ক্যারেটের স্বর্ণ ওজন করে নেওয়া',
  pc3_t: 'কারিগরি', pc3_d: 'দক্ষ হাতে গহনা গড়া',
  pc4_t: 'পালিশ', pc4_d: 'ঝকঝকে ফিনিশিং',
  pc5_t: 'চালানসহ হস্তান্তর', pc5_d: 'ওজন, দর ও মজুরি লেখা চালান',
  k_logo: 'Our signature', logo_t: 'আমাদের লোগোর গল্প', logo_d: 'মা জুয়েলার্স-এর প্রতীক — প্রতিটি অংশের একটি অর্থ আছে।',
  lm1_t: 'মুকুট আকৃতির “M”', lm1_d: '“মা” — মায়ের আশীর্বাদ ও দোকানের নাম, রাজকীয় মুকুটের রূপে।',
  lm2_t: 'হীরা', lm2_d: 'খাঁটিত্ব ও স্বচ্ছতার প্রতীক।',
  lm3_t: 'পদ্ম ও পুঁতির মালা', lm3_d: 'ঐতিহ্য, শুভ সূচনা ও কারিগরির সূক্ষ্মতা।',
  /* contact */
  contact_title: 'যোগাযোগ', contact_sub: 'কল, হোয়াটসঅ্যাপ বা সরাসরি দোকানে আসুন — আমরা আপনার অপেক্ষায়।',
  cc_call: 'ফোন করুন', cc_wa: 'হোয়াটসঅ্যাপ', cc_visit: 'দোকানে আসুন', call_now: 'এখনই কল', chat_now: 'চ্যাট শুরু', open_map: 'ম্যাপে দেখুন',
  form_t: 'বার্তা পাঠান', form_d: 'ফর্ম পূরণ করে “হোয়াটসঅ্যাপে পাঠান” চাপুন — বার্তা সরাসরি আমাদের হোয়াটসঅ্যাপে যাবে।',
  f_name: 'আপনার নাম', f_phone: 'মোবাইল নম্বর', f_interest: 'বিষয়', f_msg: 'বার্তা', f_msg_ph: 'যেমন: ২ ভরির নেকলেসের ডিজাইন দেখতে চাই',
  int_buy: 'গহনা কিনতে চাই', int_order: 'অর্ডারে গহনা তৈরি', int_bridal: 'বিয়ের গহনা', int_rate: 'আজকের দর জানতে চাই', int_other: 'অন্যান্য',
  send_wa: 'হোয়াটসঅ্যাপে পাঠান', t_fill: 'নাম ও বার্তা লিখুন', map_t: 'আমাদের অবস্থান',
  k_faq: 'FAQ', faq_t: 'সাধারণ প্রশ্ন',
  q1: 'গহনার দাম কীভাবে হিসাব হয়?', a1: 'দাম = ওজন (ভরি) × আজকের বাজুস দর + মজুরি। বাজুস দরে ৫% ভ্যাট আগেই যুক্ত থাকে। হিসাব পাতায় নিজেই দেখে নিতে পারেন।',
  q2: 'অর্ডারে গহনা বানানো যায়?', a2: 'হ্যাঁ। ডিজাইন বা ছবি হোয়াটসঅ্যাপে পাঠান অথবা দোকানে আসুন।',
  q3: 'কোন কোন ক্যারেটের গহনা আছে?', a3: '২২ ক্যারেট (হলমার্ক), ২১ ক্যারেট, ১৮ ক্যারেট ও সনাতন পদ্ধতির স্বর্ণ।',
  q4: 'চালান পাওয়া যাবে?', a4: 'হ্যাঁ, প্রতিটি কেনায় ওজন, দর ও মজুরি লেখা চালান দেওয়া হয় — প্রিন্ট বা PDF।',
  /* footer */
  foot_about: 'আধুনিক ও রুচিসম্মত স্বর্ণালংকার — বাজুস দরে, স্বচ্ছ চালানসহ।', foot_pages: 'পাতা', foot_contact: 'যোগাযোগ', foot_rates: 'আজকের দর',
  rights: 'সর্বস্বত্ব সংরক্ষিত',
  /* whatsapp */
  nav_pay: 'পেমেন্ট', nav_pay_en: 'Payment',
  pay_title: 'পেমেন্ট', pay_sub: 'কার্ড ও অনলাইন পেমেন্ট, বিকাশ, নগদ, বাংলা কিউআর, ক্যাশ অন ডেলিভারি বা দোকানে — আপনার সুবিধামতো।',
  step_pay: 'পেমেন্ট', step_inv: 'চালান',
  m_h: 'পেমেন্ট মাধ্যম বেছে নিন', m_bkash: 'বিকাশ', m_nagad: 'নগদ', m_qr: 'বাংলা কিউআর', m_cash: 'দোকানে নগদ',
  m_bkash_d: 'বিকাশ অ্যাপ বা *247# থেকে', m_nagad_d: 'নগদ অ্যাপ বা *167# থেকে', m_qr_d: 'যেকোনো ব্যাংক / MFS অ্যাপে স্ক্যান', m_cash_d: 'দোকানে এসে পরিশোধ',
  amt_h: 'কত টাকা পরিশোধ করবেন?', pay_full: 'সম্পূর্ণ মূল্য', pay_part: 'অগ্রিম / আংশিক', amt_to_pay: 'পরিশোধের পরিমাণ',
  send_to: 'এই নম্বরে পাঠান', amount: 'পরিমাণ', copy: 'কপি', copied: 'কপি হয়েছে ✓',
  mfs_s1: '{app} অ্যাপ খুলুন (অথবা {ussd} ডায়াল করুন)', mfs_s2: '“Send Money” বেছে নিন', mfs_s3: 'নম্বর দিন: {n}', mfs_s4: 'পরিমাণ দিন: {a}', mfs_s5: 'রেফারেন্সে লিখুন: {r}', mfs_s6: 'PIN দিয়ে নিশ্চিত করুন, তারপর SMS-এর TrxID নিচে লিখুন',
  qr_s1: 'যেকোনো ব্যাংক বা MFS অ্যাপ খুলুন', qr_s2: '“Scan QR” / “বাংলা কিউআর” চাপুন', qr_s3: 'কোডটি স্ক্যান করুন — নাম দেখাবে MAA JEWELLERS', qr_s4: 'পরিমাণ দিন: {a}', qr_s5: 'পেমেন্ট শেষে রেফারেন্স / TrxID নিচে লিখুন',
  qr_merchant: 'মার্চেন্ট', qr_bank: 'ইসলামী ব্যাংক বাংলাদেশ পিএলসি', qr_accept: 'যেসব অ্যাপে স্ক্যান করা যায়', dl_qr: 'কিউআর ডাউনলোড',
  trx: 'ট্রানজেকশন আইডি (TrxID)', trx_ph: 'যেমন: 9KD4A7XB2C', sender: 'যে নম্বর থেকে পাঠিয়েছেন', sender_ph: '01XXXXXXXXX',
  cash_note: 'দোকানে এসে নগদ পরিশোধ করুন। চালানে “দোকানে নগদ” লেখা থাকবে।',
  confirm_pay: 'পেমেন্ট নিশ্চিত করে চালান তৈরি', send_proof: 'হোয়াটসঅ্যাপে পেমেন্ট প্রমাণ পাঠান',
  verify_note: 'আপনার TrxID দোকান থেকে যাচাই করার পর অর্ডার চূড়ান্ত হবে। প্রমাণ হোয়াটসঅ্যাপে পাঠালে দ্রুত যাচাই হয়।',
  order_sum: 'অর্ডারের সারাংশ', pay_now: 'এখন পরিশোধ', due: 'বাকি', paid: 'পরিশোধিত',
  pay_empty: 'পেমেন্টের জন্য কার্টে গহনা নেই', pay_empty2: 'শপ থেকে গহনা কার্টে যোগ করুন, তারপর পেমেন্ট করুন।',
  pay_noweight: 'হিসাব পাতায় সব গহনার ওজন দিন', go_pay: 'পেমেন্ট করুন', inv_nopay: 'পেমেন্ট ছাড়া চালান',
  t_trx: 'সঠিক TrxID লিখুন (অন্তত ৬ অক্ষর)', t_amt: 'পরিশোধের সঠিক পরিমাণ লিখুন', secure: 'নিরাপদ পেমেন্ট',
  st_paid: 'PAID · পরিশোধিত', st_part: 'PARTIAL · আংশিক', pay_method: 'পেমেন্ট মাধ্যম', pay_ref: 'রেফারেন্স', pay_from: 'প্রেরক',
  scan_due: 'বাকি পরিশোধে স্ক্যান করুন', we_accept: 'আমরা গ্রহণ করি', pay_cash_m: 'দোকানে নগদ',
  k_pay: 'Easy payment', pay_h: 'সহজ ও নিরাপদ পেমেন্ট', pay_hd: 'বিকাশ, নগদ অথবা যেকোনো ব্যাংক অ্যাপে বাংলা কিউআর স্ক্যান করে পরিশোধ করুন।',
  pay_send_money: 'Send Money', pay_any_app: 'সেলফিন, NPSB, ভিসা, মাস্টারকার্ড সহ যেকোনো অ্যাপ', pay_go: 'পেমেন্ট পাতায় যান',
  mfs_max: 'সর্বোচ্চ {m}', mfs_limit: 'বিকাশ ও নগদে দিনে সর্বোচ্চ {m} পাঠানো যায় — এই অঙ্কের জন্য বাংলা কিউআর (যেকোনো ব্যাংক অ্যাপ) বেছে নিন, অথবা দোকানে এসে পরিশোধ করুন।',
  verify_auto: 'টাকা দোকানের নম্বরে পৌঁছালেই আপনার TrxID মিলিয়ে স্বয়ংক্রিয়ভাবে যাচাই হবে — সাধারণত ১–২ মিনিটে চালান খুলে যায়।',
  tr1: 'বাজুস দরে বিক্রি', tr2: 'বিকাশ · নগদ · বাংলা কিউআর', tr3: 'হোয়াটসঅ্যাপ সাপোর্ট', tr4: 'প্রতিটি কেনায় চালান',
  q5: 'কীভাবে পেমেন্ট করব?', a5: 'বিকাশ (০১৮১৯-৫০৮১২৭), নগদ (০১৭৫৮-১৭৮৮৮০), ইসলামী ব্যাংকের বাংলা কিউআর — যেকোনো ব্যাংক বা MFS অ্যাপে স্ক্যান করে, অথবা দোকানে নগদ। পেমেন্ট পাতায় ধাপে ধাপে নির্দেশনা আছে।',
  wa_pay: 'পেমেন্ট সম্পন্ন',
  ver_h: 'পেমেন্ট যাচাই', ver_check: 'এখনই যাচাই করুন', checking: 'যাচাই হচ্ছে…',
  sync_saved: 'অর্ডার রেকর্ডে সংরক্ষিত ✓', sync_pending: 'অর্ডার রেকর্ডে পাঠানো হচ্ছে…', sync_failed: 'ইন্টারনেট নেই — সংযোগ পেলে স্বয়ংক্রিয়ভাবে আবার পাঠানো হবে', sync_off: 'অনলাইন রেকর্ড চালু করা হয়নি',
  st_pending: 'যাচাইয়ের অপেক্ষায়', st_verified: 'যাচাইকৃত ✓', st_mismatch: 'পরিমাণ মেলেনি', st_dup: 'TrxID আগে ব্যবহৃত', st_cash: 'দোকানে নগদ', st_notpaid: 'পেমেন্ট ছাড়া', st_rejected: 'বাতিল', st_delivered: 'হস্তান্তরিত',
  ver_note: 'বিকাশ / নগদ / ব্যাংকের SMS মিলে গেলে স্বয়ংক্রিয়ভাবে যাচাই হয় — দোকান থেকেও যাচাই করা হয়। পাতাটি খোলা থাকলে নিজে থেকেই হালনাগাদ হবে।',
  t_dup: 'এই TrxID আগেই অন্য অর্ডারে ব্যবহার হয়েছে — সঠিক TrxID দিন', st_vstamp: 'PAID · VERIFIED ✓', last_check: 'সর্বশেষ যাচাই {t}',
  nav_account: 'আমার অ্যাকাউন্ট', nav_account_en: 'My account',
  acc_title: 'আমার অ্যাকাউন্ট', acc_sub: 'অর্ডার, পছন্দের তালিকা ও ঠিকানা — সব এক জায়গায়।',
  acc_login: 'লগইন', acc_register: 'নতুন অ্যাকাউন্ট', acc_google: 'Google দিয়ে চালিয়ে যান', acc_or: 'অথবা ইমেইল দিয়ে',
  acc_email: 'ইমেইল', acc_pass: 'পাসওয়ার্ড', acc_pass_hint: 'কমপক্ষে ৬ অক্ষর', acc_name: 'আপনার নাম', acc_show: 'পাসওয়ার্ড দেখান',
  acc_forgot: 'পাসওয়ার্ড ভুলে গেছেন?', acc_reset_sent: 'পাসওয়ার্ড রিসেট লিংক ইমেইলে পাঠানো হয়েছে', acc_need_email: 'আগে ইমেইল লিখুন',
  acc_do_login: 'লগইন করুন', acc_do_register: 'অ্যাকাউন্ট খুলুন', acc_welcome: 'স্বাগতম, {n}!', acc_member: '{d} থেকে সদস্য', acc_logout: 'লগ আউট', acc_out: 'লগ আউট হয়েছে',
  acc_off: 'অ্যাকাউন্ট সুবিধা শীঘ্রই চালু হবে। এখন চালান নম্বর দিয়ে অর্ডার ট্র্যাক করুন।', acc_loading: 'লোড হচ্ছে…',
  acc_side_h: 'মা জুয়েলার্স পরিবারে স্বাগতম', acc_side_p: 'একটি অ্যাকাউন্টে আপনার সব কেনাকাটা।',
  acc_p1: 'প্রতিটি অর্ডারের লাইভ অবস্থা', acc_p2: 'সংরক্ষিত ঠিকানায় দ্রুত চেকআউট', acc_p3: 'পছন্দের গহনার তালিকা', acc_p4: 'সব চালান এক জায়গায়',
  acc_t_orders: 'আমার অর্ডার', acc_t_wish: 'পছন্দের তালিকা', acc_t_profile: 'প্রোফাইল',
  acc_s_orders: 'মোট অর্ডার', acc_s_spent: 'মোট পরিশোধ', acc_s_active: 'চলমান অর্ডার', acc_s_wish: 'পছন্দের গহনা',
  acc_no_orders: 'এই অ্যাকাউন্টে এখনো কোনো অর্ডার নেই — শপ থেকে পছন্দের গহনা বেছে নিন।', acc_device: 'এই ডিভাইস থেকে আগের অর্ডার দেখুন ({n}টি)',
  acc_no_wish: 'পছন্দের তালিকা খালি — যেকোনো গহনার ♡ চাপলেই এখানে জমা হবে।', acc_saved: 'প্রোফাইল সেভ হয়েছে ✓', acc_save: 'সেভ করুন',
  acc_change_pw: 'পাসওয়ার্ড বদলানোর লিংক পাঠান', acc_admin: 'অ্যাডমিন প্যানেল', acc_verify: 'আপনার ইমেইল যাচাই করুন — ইনবক্সে লিংক পাঠানো হয়েছে', acc_resend: 'আবার পাঠান',
  acc_invoice: 'চালান', acc_track: 'ট্র্যাক', acc_signed: '{e} হিসেবে লগইন', acc_hint_co: 'লগইন করলে অর্ডার আপনার অ্যাকাউন্টে জমা থাকবে ও ঠিকানা মনে রাখবে', acc_signin_btn: 'লগইন / রেজিস্টার',
  acc_profile_h: 'ডেলিভারির তথ্য', acc_more: 'আরও {n}টি', acc_hello: 'শুভেচ্ছা',
  wish_add: 'পছন্দের তালিকায় যোগ হয়েছে ♥', wish_rm: 'পছন্দের তালিকা থেকে সরানো হয়েছে', wish_aria: 'পছন্দের তালিকা',
  ae_exists: 'এই ইমেইলে আগেই অ্যাকাউন্ট আছে — লগইন করুন', ae_email: 'সঠিক ইমেইল দিন', ae_weak: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের দিন', ae_cred: 'ইমেইল বা পাসওয়ার্ড ভুল',
  ae_popup: 'Google উইন্ডো বন্ধ হয়ে গেছে — আবার চেষ্টা করুন', ae_domain: 'এই ঠিকানা থেকে Google লগইন এখনো চালু হয়নি', ae_off: 'এই লগইন পদ্ধতি এখনো চালু হয়নি',
  ae_many: 'অনেকবার চেষ্টা হয়েছে — কিছুক্ষণ পরে চেষ্টা করুন', ae_net: 'ইন্টারনেট সংযোগ দেখুন', ae_other: 'লগইন হয়নি — আবার চেষ্টা করুন', ae_name: 'আপনার নাম লিখুন',
  k_cat: 'কালেকশন', cat_title: 'ধরন অনুযায়ী বেছে নিন', cat_sub: 'নেকলেস থেকে নাকফুল — প্রতিটি ডিজাইন আজকের বাজুস দরে।', cat_items: '{n}টি ডিজাইন',
  cd_k: 'নিজের ডিজাইন', cd_t: 'আপনার স্বপ্নের গহনা, আমাদের কারিগরের হাতে', cd_d: 'পছন্দের ছবি দিন, ওজন ও ক্যারেট বেছে নিন — আজকের দরে দাম দেখে মাত্র {p} অগ্রিমে অর্ডার করুন।',
  cd_btn: 'ডিজাইন অর্ডার করুন', cd_s1: 'ছবি দিন', cd_s2: 'ওজন বাছুন', cd_s3: 'অগ্রিম দিন', cd_s4: 'হাতে পান',
  tb1: 'বাজুস দরে স্বচ্ছ দাম', tb2: 'SSLCommerz নিরাপদ পেমেন্ট', tb3: 'ক্যাশ অন ডেলিভারি', tb4: 'হোম ডেলিভারি', tb5: 'কাস্টম ডিজাইন', tb6: 'প্রতিটি কেনায় চালান', tb7: 'লাইভ অর্ডার ট্র্যাকিং',
  buyer_email: 'ইমেইল', email_hint: 'অর্ডার সফল হলে (পেমেন্ট যাচাইয়ের পর) চালান PDF সহ এই ইমেইলে পাবেন', bad_email: 'সঠিক ইমেইল দিন',
  co_s1: 'আপনার তথ্য', co_s2: 'ডেলিভারি', co_s3: 'কীভাবে পরিশোধ করবেন', co_s4: 'পেমেন্ট মাধ্যম',
  dl_pickup: 'দোকান থেকে নেবেন', dl_pickup_d: 'পরশুরাম বাজার · কোনো চার্জ নেই', dl_home: 'হোম ডেলিভারি', dl_home_d: 'নিরাপদ কুরিয়ারে বাসায় · {f}',
  need_addr: 'হোম ডেলিভারির জন্য পূর্ণ ঠিকানা দিন', delivery: 'ডেলিভারি চার্জ', delivery_l: 'ডেলিভারি', free: 'ফ্রি',
  plan_full: 'পুরো টাকা এখন', plan_full_d: 'অনলাইনে সম্পূর্ণ পরিশোধ — দ্রুত প্রস্তুত', plan_adv: 'অগ্রিম {p}', plan_adv_d: 'কাস্টম ডিজাইনের অর্ডার — বাকি টাকা ডেলিভারিতে',
  plan_cod: 'ক্যাশ অন ডেলিভারি', plan_cod_d: 'গহনা হাতে পেয়ে নগদ পরিশোধ', plan_shop: 'দোকানে পরিশোধ', plan_shop_d: 'নেওয়ার সময় দোকানে পরিশোধ',
  m_ssl: 'অনলাইন পেমেন্ট', m_ssl_d: 'কার্ড · বিকাশ · নগদ · রকেট · ব্যাংক', m_cod: 'ক্যাশ অন ডেলিভারি',
  ssl_h: 'SSLCommerz — নিরাপদ অনলাইন পেমেন্ট', ssl_p: 'বোতাম চাপলে SSLCommerz-এর সুরক্ষিত পাতায় যাবেন। ভিসা, মাস্টারকার্ড, অ্যামেক্স, বিকাশ, নগদ, রকেট, উপায় বা ইন্টারনেট ব্যাংকিং দিয়ে পরিশোধ করুন। সফল হলেই অর্ডার নিজে থেকে নিশ্চিত হবে — TrxID লিখতে হবে না।',
  ssl_secure: 'ব্যাংক-মানের এনক্রিপশন · বাংলাদেশ ব্যাংক অনুমোদিত গেটওয়ে', ssl_off: 'অনলাইন পেমেন্ট শীঘ্রই চালু হবে',
  pay_ssl_btn: 'নিরাপদে পরিশোধ করুন · {a}', place_cod: 'অর্ডার দিন — ক্যাশ অন ডেলিভারি', place_shop: 'অর্ডার দিন — দোকানে পরিশোধ',
  redirecting: 'পেমেন্ট পাতায় নেওয়া হচ্ছে…', ssl_fail: 'অনলাইন পেমেন্ট শুরু করা যায়নি — চালান পাতা থেকে আবার চেষ্টা করুন',
  pay_ok: 'পেমেন্ট সফল হয়েছে ✓ অর্ডার নিশ্চিত', pay_failed: 'পেমেন্ট সম্পন্ন হয়নি — আবার চেষ্টা করুন', pay_cancel: 'পেমেন্ট বাতিল করা হয়েছে', pay_now_btn: 'এখনই পরিশোধ করুন · {a}',
  cod_note: 'ডেলিভারিম্যান গহনা হাতে দিলে নগদ পরিশোধ করুন। পাঠানোর আগে দোকান ফোন করে অর্ডার নিশ্চিত করবে।', cod_off: 'এই অর্ডারে ক্যাশ অন ডেলিভারি নেই',
  st_await: 'অনলাইন পেমেন্টের অপেক্ষায়', st_cod: 'ক্যাশ অন ডেলিভারি', st_adv: 'অগ্রিম পরিশোধিত ✓',
  qty: 'পরিমাণ', qty_max: 'একসাথে সর্বোচ্চ ২০টি',
  ref_h: 'রেফারেন্স ছবি', ref_add: 'ছবি যোগ করুন', ref_note: 'পছন্দের ডিজাইনের ছবি দিন (সর্বোচ্চ ৩টি) — কারিগর সেই অনুযায়ী বানাবেন', ref_max: 'আর ছবি যোগ করা যাবে না', ref_bad: 'ছবিটি খোলা যায়নি',
  placed_h: 'ধন্যবাদ! অর্ডার সম্পন্ন হয়েছে', placed_mail: 'অর্ডার সফল হলে (পেমেন্ট যাচাইয়ের পর) চালান PDF সহ পাঠানো হবে: {m}', placed_nomail: 'দোকান শীঘ্রই ফোনে যোগাযোগ করবে', placed_next: 'পরবর্তী ধাপ',
  adv_hint: 'কাস্টম ডিজাইনের অর্ডারে {p} অগ্রিম দিয়ে অর্ডার নিশ্চিত করুন', items_n: '{n}টি গহনা',
  inv_lock_h: 'চালান লক করা আছে', inv_lock_p: 'দোকান আপনার পেমেন্ট যাচাই করলেই চালান খুলে যাবে — তখন প্রিন্ট ও PDF করতে পারবেন। এই পাতা খোলা রাখুন, যাচাই হলে নিজে থেকেই খুলবে।',
  inv_lock_cash: 'দোকানে টাকা পরিশোধের পর দোকান যাচাই করলে চালান খুলবে।', inv_lock_t: 'যাচাইয়ের আগে প্রিন্ট বা শেয়ার করা যাবে না', inv_lock_print: 'এই চালান এখনো দোকান যাচাই করেনি — প্রিন্ট করা যাবে না।', inv_unlocked: 'পেমেন্ট যাচাই হয়েছে — চালান খুলে গেছে ✓',
  est_design_h: 'আপনার পছন্দের ডিজাইন', est_name: 'গহনার নাম', est_name_ph: 'যেমন: ময়ূর নকশার নেকলেস', est_desc: 'বিবরণ / ডিজাইনের তথ্য', est_desc_ph: 'নকশা, মাপ, পাথর, রং, ছবি থাকলে হোয়াটসঅ্যাপে পাঠান…', est_cat: 'গহনার ধরন', est_need_name: 'গহনার নাম লিখুন',
  nav_cart: 'কার্ট', nav_cart_en: 'Cart', nav_track: 'আমার অর্ডার', nav_track_en: 'My orders', step_cart: 'কার্ট',
  crt_title: 'আপনার কার্ট', crt_sub: 'গহনা, ওজন ও দাম — আজকের বাজুস দরে। পরের ধাপে পেমেন্ট।', crt_empty2: 'শপ থেকে পছন্দের গহনা যোগ করুন।',
  checkout_btn: 'চেকআউট — পেমেন্ট করুন', need_contact: 'নাম ও মোবাইল নম্বর দিন', ro_note: 'দাম বাজুস দর ও দোকানের মজুরি অনুযায়ী স্বয়ংক্রিয় — গ্রাহক পরিবর্তন করতে পারেন না।',
  est_title: 'দাম হিসাব', est_sub: 'যেকোনো ওজন ও ক্যারেটে আজকের বাজুস দরে আনুমানিক দাম জানুন।', est_result: 'আনুমানিক দাম', est_add: 'এই ওজনে অর্ডার করুন', est_wa: 'হোয়াটসঅ্যাপে জিজ্ঞাসা',
  est_making: 'মজুরি (দোকান নির্ধারিত)', est_note: 'দর ও মজুরি দোকান নির্ধারিত — শুধু অ্যাডমিন পরিবর্তন করতে পারেন।', custom_order: 'নিজস্ব অর্ডার', est_need: 'ওজন দিন', est_h1: 'ক্যারেট বেছে নিন', est_h2: 'ওজন',
  lock_h: 'দাম লক করা হয়েছে', lock_d: '{m} মিনিট এই দাম নিশ্চিত — দর বদলালেও আপনার দাম বদলাবে না।', lock_left: 'বাকি', lock_exp: 'লকের সময় শেষ — আজকের দরে আবার লক করা হয়েছে',
  tr_h: 'অর্ডার ট্র্যাকিং', tr_s1: 'অর্ডার গৃহীত', tr_s2: 'পেমেন্ট যাচাই', tr_s3: 'পেমেন্ট নিশ্চিত', tr_s4: 'হস্তান্তর', tr_live: 'লাইভ — দোকান যাচাই করলেই সাথে সাথে এখানে দেখাবে', tr_problem: 'সমস্যা হয়েছে — দোকানে যোগাযোগ করুন',
  track_title: 'আমার অর্ডার', track_sub: 'এই ডিভাইস থেকে দেওয়া সব অর্ডার ও পেমেন্টের অবস্থা লাইভ দেখুন, অথবা চালান নম্বর দিয়ে খুঁজুন।', track_ph: 'যেমন: MJ-261121-104512-K7Q4', track_btn: 'ট্র্যাক করুন',
  my_orders: 'এই ডিভাইসের অর্ডার', no_orders: 'এই ডিভাইসে এখনো কোনো অর্ডার নেই', not_found: 'এই নম্বরে কোনো অর্ডার পাওয়া যায়নি', track_off: 'অনলাইন ট্র্যাকিং এখনো চালু হয়নি — হোয়াটসঅ্যাপে যোগাযোগ করুন।', searching: 'খোঁজা হচ্ছে…',
  order_placed: '✦ অর্ডার সম্পন্ন — চালান তৈরি হয়েছে', order_saved_local: 'ইন্টারনেট সমস্যা — অর্ডার ডিভাইসে সংরক্ষিত, সংযোগ পেলে পাঠানো হবে', order_denied: 'অর্ডারটি এখন দোকানের সার্ভারে সেভ করা গেল না — চালান পাতা থেকে হোয়াটসঅ্যাপে অর্ডারটি পাঠান, দোকান নিশ্চিত করবে।', placing: 'অর্ডার পাঠানো হচ্ছে…',
  sold_out: 'স্টক শেষ', photo_note: 'ছবি প্রতীকী — আসল গহনা দোকানে বা হোয়াটসঅ্যাপে দেখে নিন।', photo_by: 'ছবি',
  rate_meta_live: 'বাজুস দর · দোকান থেকে লাইভ হালনাগাদ · কার্যকর: {d}', order_id: 'অর্ডার নং', view: 'দেখুন', cloud_ok: 'দোকানের সিস্টেমে জমা হয়েছে ✓',
  wa_hi: 'আসসালামু আলাইকুম / নমস্কার, মা জুয়েলার্স। আমি গহনা সম্পর্কে জানতে চাই।',
  wa_enq: 'এই গহনাটি সম্পর্কে জানতে চাই', wa_order: 'নতুন অর্ডার', wa_inv: 'চালান', wa_from: 'ওয়েবসাইট থেকে পাঠানো', wa_est: 'আনুমানিক মূল্য'
},
en: {
  brand: 'Maa Jewellers', owner: 'Badal Chandra Bonik', proprietor: 'Proprietor',
  address: '1 Kazi Shopping Complex, Parashuram Bazar, Parashuram, Feni', address_l: 'Address',
  nav_home: 'Home', nav_shop: 'Shop', nav_calc: 'Calculator', nav_invoice: 'Invoice', nav_about: 'About', nav_contact: 'Contact',
  nav_home_en: 'হোম', nav_shop_en: 'শপ', nav_calc_en: 'হিসাব', nav_invoice_en: 'চালান', nav_about_en: 'আমাদের কথা', nav_contact_en: 'যোগাযোগ',
  menu: 'Menu', close: 'Close', lang_aria: 'বাংলায় দেখুন', theme_aria: 'Switch theme', cart: 'Cart', cart_aria: 'Cart & calculation',
  wa_tip: 'Chat on WhatsApp', call: 'Call', whatsapp: 'WhatsApp', phone: 'Phone',
  tk_live: 'LIVE', tk_spot: 'Intl. gold', tk_fx: 'USD', tk_24: 'Intl. 24K/bhori', tk_22i: 'Intl. 22K/bhori',
  tk_b: 'BAJUS', tk_today: 'today', tk_upd: 'updated {s} ago', tk_wait: 'Fetching live price…', tk_off: 'Offline — last known price',
  sec: 's', min: 'min', just: 'just now',
  k22: '22 Carat', k21: '21 Carat', k18: '18 Carat', trad: 'Traditional',
  k22_s: 'Hallmark', k21_s: 'Jewellery', k18_s: 'Jewellery', trad_s: 'Old method', kt_short_trad: 'TRD',
  per_bhori: 'per bhori', per_gram: 'per gram', official: 'BAJUS', custom: 'Shop rate',
  rate_meta: 'BAJUS rate effective {d}', rate_meta_file: 'Updated from rates.json · effective {d}', rate_meta_custom: ' · some rates set by the shop',
  edit_rates: 'Edit rates',
  intl_title: 'International market · live', intl_sub: 'Auto-refreshes every {n} seconds',
  m_spot: 'Spot gold / oz', m_fx: '1 US dollar', m_24: '24K / bhori', m_22: '22K / bhori', m_day: 'today', m_vs: 'vs BAJUS 22K',
  spark_lbl: 'Live chart on this device', spark_wait: 'Collecting live data… the chart appears after a few updates',
  intl_note: 'International price is for reference; sales use the BAJUS rate.',
  dlg_title: "Edit today's rates", dlg_sub: "Enter your shop's own rate. It's replaced when a newer BAJUS rate arrives.",
  use_bajus: 'Use BAJUS rate', cancel: 'Cancel', save: 'Save', t_rates: 'Rates saved', t_bajus: 'Back to BAJUS rates',
  hero_pill: "Today's 22 Carat rate {r}", hero_tag: 'Modern, tasteful gold jewellery — crafted, supplied and made to order.',
  cta_shop: 'Shop jewellery', cta_wa: 'Order on WhatsApp', cta_calc: 'Calculate price',
  hs1: 'Hallmark gold', hs2b: 'BAJUS rate', hs2: 'Transparent price', hs3b: 'Made to order', hs3: 'Your own design',
  rb_lbl: '22 Carat · BAJUS', ib_lbl: 'International · live',
  strip1: 'Pure gold', strip2: 'Bridal jewellery', strip3: 'Made to order', strip4: 'Sold at BAJUS rate', strip5: '22K hallmark', strip6: 'An invoice with every purchase',
  k_rates: 'Live gold rate', rates_title: "Today's gold rate", rates_sub: 'BAJUS rate per bhori (11.664 g), VAT included',
  k_feat: 'Featured', feat_title: 'Popular pieces', feat_sub: "With an estimated price at today's rate — add your favourites to the cart.", view_all: 'View all jewellery',
  k_why: 'Why Maa Jewellers', why_title: 'Why Maa Jewellers',
  why1_t: 'Pure gold', why1_d: '22, 21, 18 carat and traditional — the carat of every piece is clearly stated.',
  why2_t: 'Transparent BAJUS pricing', why2_d: "Weight × today's BAJUS rate + making — the maths in front of you.",
  why3_t: 'Made to order', why3_d: 'Show us a design or photo and we will make it for you.',
  why4_t: 'An invoice every time', why4_d: 'A beautiful printed invoice or PDF — also sent on WhatsApp.',
  k_how: 'How it works', how_title: 'Shopping made simple',
  how1_t: 'Choose', how1_d: 'Add your favourite pieces from the shop to the cart.',
  how2_t: 'Calculate', how2_d: "Set carat and weight — today's price instantly.",
  how3_t: 'Invoice', how3_d: 'A beautiful invoice in one click, print or PDF.',
  how4_t: 'Order on WhatsApp', how4_d: 'Send your order or invoice straight to us.',
  cta_t: 'Your dream jewellery, our craft', cta_d: 'Design, price or order — ask us anything on WhatsApp.',
  shop_title: 'Our shop', shop_sub: "All our jewellery in one place — with an estimated price at today's BAJUS rate.",
  search_ph: 'Search jewellery…', sort_feat: 'Featured', sort_low: 'Price: low to high', sort_high: 'Price: high to low', sort_light: 'Weight: lightest first',
  all: 'All', est: 'Est.', add_cart: 'Add to cart', added: '✦ Added to cart', enquire: 'Ask on WhatsApp', quick: 'Quick view',
  no_results: 'No jewellery found', price_note: "Estimated price = weight × today's BAJUS rate + {m}% making. Final price by actual weight in store.",
  b_bridal: 'Bridal', b_best: 'Popular', b_new: 'New',
  cat_necklace: 'Necklace', cat_earrings: 'Earrings', cat_bangles: 'Bangles', cat_ring: 'Ring', cat_chain: 'Chain', cat_pendant: 'Pendant', cat_nosepin: 'Nose pin', cat_bracelet: 'Bracelet', cat_custom: 'Other jewellery',
  qv_weight: 'Weight', qv_kt: 'Choose carat', qv_gold: 'Gold value', qv_mk: 'Making ({m}%)', qv_total: 'Estimated price',
  calc_title: 'Price calculator', calc_sub: "Estimate the price of any weight and carat at today's BAJUS rate.",
  step1: 'Choose', step2: 'Calculate', step3: 'Invoice', today_rate: "Today's rate",
  cart_empty: 'Your cart is empty', cart_empty2: 'Add jewellery from the shop, or order a custom weight from the price calculator',
  go_shop: 'Go to shop', add_custom: 'Add your own item', item_name: 'Item name', carat: 'Carat', weight: 'Weight',
  by_bhori: 'Bhori', by_gram: 'Gram', bhori: 'bhori', ana: 'ana', rati: 'rati', point: 'point', gram: 'g',
  making: 'Making charge', mc_pct: '% rate', mc_tk: '৳ / bhori', gold_value: 'Gold', remove: 'Remove', need_w: 'Enter weight', removed: 'Item removed',
  conv_note: '✦ 1 bhori = 16 ana = 96 rati · 1 rati = 10 points · 1 bhori = 11.664 g',
  buyer_h: 'Customer details', buyer_name: 'Customer name', buyer_phone: 'Mobile', buyer_addr: 'Address',
  sum_h: 'Summary', discount: 'Discount', vat: 'Extra VAT', advance: 'Advance / old gold credit',
  vat_note: 'BAJUS rates already include 5% VAT — add extra VAT only if needed.',
  items: '{n} items', subtotal: 'Subtotal', gold_total: 'Gold value', making_total: 'Total making',
  less_disc: 'Discount ({p})', plus_vat: 'VAT ({p})', less_adv: 'Advance / old gold', grand: 'Grand total',
  make_inv: 'Create invoice', order_wa: 'Send order on WhatsApp', more_items: 'Add more jewellery',
  t_noweight: 'Enter the weight for every item', t_empty: 'The cart is empty — add jewellery first', t_inv: '✦ Invoice created',
  inv_title: 'Invoice', inv_sub: 'A gold-framed invoice with watermark — print, save as PDF or send on WhatsApp.',
  inv_none: 'No invoice yet', inv_none2: 'Place an order from your cart — the invoice appears here right after payment.', go_calc: 'Go to calculator',
  print: 'Print / PDF', share_wa: 'Send on WhatsApp', edit_cart: 'Edit calculation', new_sale: 'New sale',
  inv_word: 'Invoice', inv_no: 'Invoice no.', inv_date: 'Date', inv_time: 'Time', bill_to: 'Bill to', mobile: 'Mobile', rate_date: 'Rate date',
  th_sl: '#', th_item: 'Item', th_kt: 'Carat', th_w: 'Weight', th_rate: 'Rate / bhori', th_mc: 'Making', th_amt: 'Amount',
  in_words: 'In words', taka_only: 'Taka only',
  inv_note: 'Rates: set by BAJUS, effective {d} (5% VAT included). Weighed on the shop’s digital scale.',
  sign_buyer: 'Customer signature', sign_seller: 'Authorised signature', thanks: 'Thank you for shopping at Maa Jewellers',
  confirm_new: 'Start a new sale? The cart and invoice will be cleared.', t_new: 'New sale started',
  about_title: 'About us', about_lead: 'A trusted gold jewellery shop in Parashuram Bazar — where every piece is made with care.',
  k_story: 'Our story', story_t: 'Trust, set in gold',
  about_p1: '<b>Maa Jewellers</b> is a gold jewellery shop in Kazi Shopping Complex, Parashuram Bazar, Feni. We craft and supply modern, tasteful gold jewellery.',
  about_p2: 'We make jewellery to order — from your favourite design, a photo, or the shape of an old piece.',
  about_p3: 'Every sale follows the BAJUS rate, and the invoice shows weight, rate and making charge separately — so you know exactly what you pay for.',
  k_promise: 'Our promise', promise_t: 'Our promise',
  pr1_t: 'The right carat', pr1_d: 'The carat we state is the carat you get — written on the invoice.',
  pr2_t: 'The right weight', pr2_d: 'In bhori, ana, rati and grams — weighed in front of you.',
  pr3_t: 'BAJUS rate', pr3_d: "Transparent pricing at today's BAJUS rate.",
  pr4_t: 'Caring service', pr4_d: 'Orders, designs or questions — easy to reach by phone or WhatsApp.',
  k_process: 'Our craft', process_t: 'The journey of a piece',
  pc1_t: 'Design', pc1_d: 'Listening to you and settling the design',
  pc2_t: 'Gold', pc2_d: 'Weighing gold of the right carat',
  pc3_t: 'Craft', pc3_d: 'Shaped by skilled hands',
  pc4_t: 'Polish', pc4_d: 'A brilliant finish',
  pc5_t: 'Handover', pc5_d: 'With an invoice of weight, rate and making',
  k_logo: 'Our signature', logo_t: 'The story of our logo', logo_d: 'The Maa Jewellers emblem — every part has a meaning.',
  lm1_t: 'The crowned “M”', lm1_d: '“Maa” — a mother’s blessing and the shop’s name, shaped as a royal crown.',
  lm2_t: 'The diamond', lm2_d: 'A symbol of purity and transparency.',
  lm3_t: 'Lotus & bead ring', lm3_d: 'Tradition, auspicious beginnings and fine craftsmanship.',
  contact_title: 'Contact us', contact_sub: 'Call, WhatsApp or visit the shop — we look forward to seeing you.',
  cc_call: 'Call us', cc_wa: 'WhatsApp', cc_visit: 'Visit the shop', call_now: 'Call now', chat_now: 'Start chat', open_map: 'Open in Maps',
  form_t: 'Send a message', form_d: 'Fill in the form and press “Send on WhatsApp” — the message goes straight to our WhatsApp.',
  f_name: 'Your name', f_phone: 'Mobile number', f_interest: 'Topic', f_msg: 'Message', f_msg_ph: 'e.g. I would like to see 2-bhori necklace designs',
  int_buy: 'I want to buy jewellery', int_order: 'Custom order', int_bridal: 'Bridal jewellery', int_rate: "Today's rate", int_other: 'Other',
  send_wa: 'Send on WhatsApp', t_fill: 'Please enter your name and message', map_t: 'Find us',
  k_faq: 'FAQ', faq_t: 'Common questions',
  q1: 'How is the price calculated?', a1: "Price = weight (bhori) × today's BAJUS rate + making charge. BAJUS rates already include 5% VAT. You can check it yourself on the calculator page.",
  q2: 'Do you make jewellery to order?', a2: 'Yes. Send a design or photo on WhatsApp, or visit the shop.',
  q3: 'Which carats do you have?', a3: '22 carat (hallmark), 21 carat, 18 carat and traditional-method gold.',
  q4: 'Do I get an invoice?', a4: 'Yes — every purchase comes with an invoice showing weight, rate and making, printed or as a PDF.',
  foot_about: 'Modern, tasteful gold jewellery — at BAJUS rates, with a clear invoice.', foot_pages: 'Pages', foot_contact: 'Contact', foot_rates: "Today's rate",
  rights: 'All rights reserved',
  nav_pay: 'Payment', nav_pay_en: 'পেমেন্ট',
  pay_title: 'Payment', pay_sub: 'Card & online payment, bKash, Nagad, Bangla QR, cash on delivery or at the shop — whatever suits you.',
  step_pay: 'Pay', step_inv: 'Invoice',
  m_h: 'Choose a payment method', m_bkash: 'bKash', m_nagad: 'Nagad', m_qr: 'Bangla QR', m_cash: 'Cash at shop',
  m_bkash_d: 'From the bKash app or *247#', m_nagad_d: 'From the Nagad app or *167#', m_qr_d: 'Scan with any bank / MFS app', m_cash_d: 'Pay at the shop',
  amt_h: 'How much will you pay?', pay_full: 'Full amount', pay_part: 'Advance / partial', amt_to_pay: 'Amount to pay',
  send_to: 'Send to this number', amount: 'Amount', copy: 'Copy', copied: 'Copied ✓',
  mfs_s1: 'Open the {app} app (or dial {ussd})', mfs_s2: 'Choose “Send Money”', mfs_s3: 'Enter number: {n}', mfs_s4: 'Enter amount: {a}', mfs_s5: 'Reference: {r}', mfs_s6: 'Confirm with your PIN, then enter the TrxID from the SMS below',
  qr_s1: 'Open any bank or MFS app', qr_s2: 'Tap “Scan QR” / “Bangla QR”', qr_s3: 'Scan the code — it shows MAA JEWELLERS', qr_s4: 'Enter amount: {a}', qr_s5: 'After paying, enter the reference / TrxID below',
  qr_merchant: 'Merchant', qr_bank: 'Islami Bank Bangladesh PLC', qr_accept: 'Apps that can scan it', dl_qr: 'Download QR',
  trx: 'Transaction ID (TrxID)', trx_ph: 'e.g. 9KD4A7XB2C', sender: 'Number you paid from', sender_ph: '01XXXXXXXXX',
  cash_note: 'Pay in cash at the shop. The invoice will say “Cash at shop”.',
  confirm_pay: 'Confirm payment & create invoice', send_proof: 'Send payment proof on WhatsApp',
  verify_note: 'Your order is final once the shop verifies the TrxID. Sending the proof on WhatsApp speeds this up.',
  order_sum: 'Order summary', pay_now: 'Paying now', due: 'Due', paid: 'Paid',
  pay_empty: 'Nothing in the cart to pay for', pay_empty2: 'Add jewellery to your cart from the shop, then pay.',
  pay_noweight: 'Enter every item’s weight on the calculator page', go_pay: 'Proceed to payment', inv_nopay: 'Invoice without payment',
  t_trx: 'Enter a valid TrxID (at least 6 characters)', t_amt: 'Enter a valid amount', secure: 'Secure payment',
  st_paid: 'PAID', st_part: 'PARTIALLY PAID', pay_method: 'Payment method', pay_ref: 'Reference', pay_from: 'Paid from',
  scan_due: 'Scan to pay the balance', we_accept: 'We accept', pay_cash_m: 'Cash at shop',
  k_pay: 'Easy payment', pay_h: 'Easy, secure payment', pay_hd: 'Pay with bKash, Nagad, or scan our Bangla QR with any bank app.',
  pay_send_money: 'Send Money', pay_any_app: 'Cellfin, NPSB, Visa, Mastercard and any Bangla QR app', pay_go: 'Go to payment',
  mfs_max: 'Up to {m}', mfs_limit: 'bKash and Nagad allow at most {m} a day — for this amount choose Bangla QR (any bank app), or pay at the shop.',
  verify_auto: 'As soon as the money reaches the shop, your TrxID is matched automatically — the invoice usually unlocks within 1–2 minutes.',
  tr1: 'Sold at BAJUS rate', tr2: 'bKash · Nagad · Bangla QR', tr3: 'WhatsApp support', tr4: 'Invoice with every purchase',
  q5: 'How can I pay?', a5: 'bKash (01819-508127), Nagad (01758-178880), Islami Bank Bangla QR — scan with any bank or MFS app — or cash at the shop. The payment page has step-by-step instructions.',
  wa_pay: 'Payment made',
  ver_h: 'Payment verification', ver_check: 'Check now', checking: 'Checking…',
  sync_saved: 'Order saved to records ✓', sync_pending: 'Saving order to records…', sync_failed: 'No internet — it will be sent again automatically', sync_off: 'Online records are not switched on',
  st_pending: 'Waiting for verification', st_verified: 'Verified ✓', st_mismatch: 'Amount does not match', st_dup: 'TrxID already used', st_cash: 'Cash at shop', st_notpaid: 'No payment', st_rejected: 'Rejected', st_delivered: 'Delivered',
  ver_note: 'Verified automatically when the bKash / Nagad / bank SMS matches — the shop can also verify it. This page updates itself while open.',
  t_dup: 'This TrxID was already used on another order — enter the correct TrxID', st_vstamp: 'PAID · VERIFIED ✓', last_check: 'Last checked {t}',
  nav_account: 'My account', nav_account_en: 'আমার অ্যাকাউন্ট',
  acc_title: 'My account', acc_sub: 'Your orders, wishlist and address — all in one place.',
  acc_login: 'Sign in', acc_register: 'Create account', acc_google: 'Continue with Google', acc_or: 'or with email',
  acc_email: 'Email', acc_pass: 'Password', acc_pass_hint: 'At least 6 characters', acc_name: 'Your name', acc_show: 'Show password',
  acc_forgot: 'Forgot password?', acc_reset_sent: 'Password reset link sent to your email', acc_need_email: 'Enter your email first',
  acc_do_login: 'Sign in', acc_do_register: 'Create account', acc_welcome: 'Welcome, {n}!', acc_member: 'Member since {d}', acc_logout: 'Sign out', acc_out: 'Signed out',
  acc_off: 'Customer accounts are coming soon. Meanwhile, track orders with your invoice number.', acc_loading: 'Loading…',
  acc_side_h: 'Welcome to the Maa Jewellers family', acc_side_p: 'All your purchases in one account.',
  acc_p1: 'Live status of every order', acc_p2: 'Faster checkout with your saved address', acc_p3: 'Your wishlist of favourite pieces', acc_p4: 'Every invoice in one place',
  acc_t_orders: 'My orders', acc_t_wish: 'Wishlist', acc_t_profile: 'Profile',
  acc_s_orders: 'Orders', acc_s_spent: 'Total paid', acc_s_active: 'Active orders', acc_s_wish: 'Wishlist',
  acc_no_orders: 'No orders in this account yet — pick your favourite pieces from the shop.', acc_device: 'See earlier orders from this device ({n})',
  acc_no_wish: 'Your wishlist is empty — tap ♡ on any piece to save it here.', acc_saved: 'Profile saved ✓', acc_save: 'Save',
  acc_change_pw: 'Send a password-change link', acc_admin: 'Admin panel', acc_verify: 'Please verify your email — we sent you a link', acc_resend: 'Send again',
  acc_invoice: 'Invoice', acc_track: 'Track', acc_signed: 'Signed in as {e}', acc_hint_co: 'Sign in to keep your orders in your account and remember your address', acc_signin_btn: 'Sign in / Register',
  acc_profile_h: 'Delivery details', acc_more: '+{n} more', acc_hello: 'Hello',
  wish_add: 'Added to your wishlist ♥', wish_rm: 'Removed from your wishlist', wish_aria: 'Wishlist',
  ae_exists: 'An account with this email already exists — please sign in', ae_email: 'Please enter a valid email', ae_weak: 'Use a password of at least 6 characters', ae_cred: 'Wrong email or password',
  ae_popup: 'The Google window was closed — please try again', ae_domain: 'Google sign-in is not enabled for this address yet', ae_off: 'This sign-in method is not enabled yet',
  ae_many: 'Too many attempts — please try again later', ae_net: 'Check your internet connection', ae_other: 'Could not sign in — please try again', ae_name: 'Please enter your name',
  k_cat: 'Collections', cat_title: 'Shop by category', cat_sub: 'From necklaces to nose pins — every design at today’s BAJUS rate.', cat_items: '{n} designs',
  cd_k: 'Your own design', cd_t: 'Your dream piece, crafted by our artisans', cd_d: 'Share a photo, choose weight and carat — see the price at today’s rate and order with just {p} advance.',
  cd_btn: 'Order a design', cd_s1: 'Share a photo', cd_s2: 'Pick the weight', cd_s3: 'Pay an advance', cd_s4: 'Receive it',
  tb1: 'Transparent BAJUS-rate pricing', tb2: 'SSLCommerz secure payment', tb3: 'Cash on delivery', tb4: 'Home delivery', tb5: 'Custom designs', tb6: 'Invoice with every purchase', tb7: 'Live order tracking',
  buyer_email: 'Email', email_hint: 'When your order succeeds (payment verified) the invoice PDF is emailed here', bad_email: 'Please enter a valid email',
  co_s1: 'Your details', co_s2: 'Delivery', co_s3: 'How would you like to pay?', co_s4: 'Payment method',
  dl_pickup: 'Pick up at the shop', dl_pickup_d: 'Parashuram Bazar · no charge', dl_home: 'Home delivery', dl_home_d: 'Insured courier to your door · {f}',
  need_addr: 'Please enter your full address for home delivery', delivery: 'Delivery charge', delivery_l: 'Delivery', free: 'Free',
  plan_full: 'Pay in full now', plan_full_d: 'Pay everything online — fastest to prepare', plan_adv: 'Advance {p}', plan_adv_d: 'For custom-design orders — rest on delivery',
  plan_cod: 'Cash on delivery', plan_cod_d: 'Pay cash when the jewellery reaches you', plan_shop: 'Pay at the shop', plan_shop_d: 'Pay when you pick it up',
  m_ssl: 'Online payment', m_ssl_d: 'Card · bKash · Nagad · Rocket · bank', m_cod: 'Cash on delivery',
  ssl_h: 'SSLCommerz — secure online payment', ssl_p: 'You will go to the secure SSLCommerz page. Pay with Visa, Mastercard, Amex, bKash, Nagad, Rocket, Upay or internet banking. Your order is confirmed automatically — no TrxID needed.',
  ssl_secure: 'Bank-grade encryption · Bangladesh Bank approved gateway', ssl_off: 'Online card payment is coming soon',
  pay_ssl_btn: 'Pay securely · {a}', place_cod: 'Place order — cash on delivery', place_shop: 'Place order — pay at shop',
  redirecting: 'Taking you to the payment page…', ssl_fail: 'Could not start online payment — try again from the invoice page',
  pay_ok: 'Payment successful ✓ Order confirmed', pay_failed: 'Payment was not completed — please try again', pay_cancel: 'Payment cancelled', pay_now_btn: 'Pay now · {a}',
  cod_note: 'Pay cash when the courier hands over your jewellery. The shop will call you to confirm before sending.', cod_off: 'Cash on delivery is not available for this order',
  st_await: 'Waiting for online payment', st_cod: 'Cash on delivery', st_adv: 'Advance paid ✓',
  qty: 'Qty', qty_max: 'Up to 20 at a time',
  ref_h: 'Reference photos', ref_add: 'Add photos', ref_note: 'Add photos of the design you like (up to 3) — our craftsmen will follow them', ref_max: 'No more photos can be added', ref_bad: 'Could not open that image',
  placed_h: 'Thank you! Your order is placed', placed_mail: 'Your invoice PDF will be emailed once the order succeeds (payment verified): {m}', placed_nomail: 'The shop will call you shortly', placed_next: 'What happens next',
  adv_hint: 'Custom-design orders: confirm with a {p} advance', items_n: 'Qty {n}',
  inv_lock_h: 'Invoice locked', inv_lock_p: 'Your invoice opens as soon as the shop verifies your payment — then you can print or save it as PDF. Keep this page open; it unlocks by itself.',
  inv_lock_cash: 'Pay at the shop — the invoice unlocks once the shop verifies the payment.', inv_lock_t: 'Printing and sharing are available after verification', inv_lock_print: 'This invoice has not been verified by the shop yet — it cannot be printed.', inv_unlocked: 'Payment verified — your invoice is unlocked ✓',
  est_design_h: 'Your own design', est_name: 'Jewellery name', est_name_ph: 'e.g. Peacock-design necklace', est_desc: 'Description / design details', est_desc_ph: 'Design, size, stones, colour… send photos on WhatsApp if you have them', est_cat: 'Type', est_need_name: 'Please enter the jewellery name',
  nav_cart: 'Cart', nav_cart_en: 'কার্ট', nav_track: 'My orders', nav_track_en: 'আমার অর্ডার', step_cart: 'Cart',
  crt_title: 'Your cart', crt_sub: "Jewellery, weight and price at today's BAJUS rate. Payment is the next step.", crt_empty2: 'Add your favourite pieces from the shop.',
  checkout_btn: 'Checkout — pay now', need_contact: 'Please enter your name and mobile number', ro_note: 'Prices follow the BAJUS rate and the shop’s making charge — they cannot be changed by customers.',
  est_title: 'Price calculator', est_sub: "Estimate the price of any weight and carat at today's BAJUS rate.", est_result: 'Estimated price', est_add: 'Order this weight', est_wa: 'Ask on WhatsApp',
  est_making: 'Making charge (set by shop)', est_note: 'Rates and making charge are set by the shop — only the admin can change them.', custom_order: 'Custom order', est_need: 'Enter a weight', est_h1: 'Choose carat', est_h2: 'Weight',
  lock_h: 'Price locked', lock_d: 'This price is guaranteed for {m} minutes — even if the rate changes.', lock_left: 'left', lock_exp: "Lock expired — re-locked at today's rate",
  tr_h: 'Order tracking', tr_s1: 'Order placed', tr_s2: 'Payment check', tr_s3: 'Payment confirmed', tr_s4: 'Handed over', tr_live: 'Live — updates here the moment the shop verifies', tr_problem: 'There is a problem — please contact the shop',
  track_title: 'My orders', track_sub: 'See every order placed from this device with its live payment status, or search by invoice number.', track_ph: 'e.g. MJ-261121-104512-K7Q4', track_btn: 'Track',
  my_orders: 'Orders on this device', no_orders: 'No orders on this device yet', not_found: 'No order found with this number', track_off: 'Online tracking is not switched on yet — please contact us on WhatsApp.', searching: 'Searching…',
  order_placed: '✦ Order placed — invoice created', order_saved_local: 'Connection problem — order saved on this device and will be sent when online', order_denied: 'The order could not be saved on the shop server right now — send it on WhatsApp from the invoice page and the shop will confirm.', placing: 'Placing order…',
  sold_out: 'Sold out', photo_note: 'Photos are for illustration — see the actual piece in store or on WhatsApp.', photo_by: 'Photo',
  rate_meta_live: 'BAJUS rate · updated live by the shop · effective {d}', order_id: 'Order no.', view: 'View', cloud_ok: 'Received by the shop system ✓',
  wa_hi: 'Hello Maa Jewellers, I would like to know about your jewellery.',
  wa_enq: 'I would like to know about this piece', wa_order: 'New order', wa_inv: 'Invoice', wa_from: 'Sent from the website', wa_est: 'Estimated price'
}};

/* =====================================================================
   HELPERS
   ===================================================================== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const BN = '০১২৩৪৫৬৭৮৯';
const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage blocked */ } }
};
let lang = LS.get('mj_lang', 'bn') === 'en' ? 'en' : 'bn';
const t = (k, vars) => {
  let s = (I18N[lang] && I18N[lang][k]) ?? I18N.en[k] ?? k;
  if (vars) for (const v in vars) s = s.split('{' + v + '}').join(vars[v]);
  return s;
};
const loc = () => (lang === 'bn' ? 'bn-BD' : 'en-IN');
const dg = (s) => (lang === 'bn' ? String(s).replace(/\d/g, d => BN[d]) : String(s));
const toNum = (v) => {
  const n = parseFloat(String(v ?? '').trim().replace(/[০-৯]/g, d => BN.indexOf(d)).replace(/,/g, ''));
  return isFinite(n) && n > 0 ? n : 0;
};
function num(n, d = 0) {
  try { return new Intl.NumberFormat(loc(), { minimumFractionDigits: d, maximumFractionDigits: d }).format(n); }
  catch (e) { return dg(Number(n).toFixed(d)); }
}
const money = (n) => '৳ ' + num(Math.round(n));
const pct = (n, d = 2) => dg(String(Math.round(n * Math.pow(10, d)) / Math.pow(10, d))) + '%';
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const todayKey = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
function fdate(x) {
  const d = typeof x === 'string' ? new Date(x + 'T12:00:00') : new Date(x);
  try { return d.toLocaleDateString(loc(), { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return dg(d.toDateString()); }
}
function ftime(x) {
  const d = new Date(x);
  try { return d.toLocaleTimeString(loc(), { hour: 'numeric', minute: '2-digit' }); } catch (e) { return dg(d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0')); }
}
function weightText(tb) {
  if (!tb) return '—';
  let pts = Math.round(tb * 960);
  const b = Math.floor(pts / 960); pts -= b * 960;
  const a = Math.floor(pts / 60); pts -= a * 60;
  const r = Math.floor(pts / 10); const p = pts - r * 10;
  const out = [];
  if (b) out.push(dg(b) + ' ' + t('bhori'));
  if (a) out.push(dg(a) + ' ' + t('ana'));
  if (r) out.push(dg(r) + ' ' + t('rati'));
  if (p) out.push(dg(p) + ' ' + t('point'));
  return out.length ? out.join(' ') : '—';
}
const ktLabel = (k) => k === 'trad' ? t('kt_short_trad') : ({ k22: '22K', k21: '21K', k18: '18K' })[k];
const prod = (id) => catalog.find(p => p.id === id) || PRODUCTS.find(p => p.id === id);
const pName = (p) => (p ? ((p.name && (p.name[lang] || p.name.en)) || '') : '');
const imgSrc = (p, w = 600) => !p || !p.img ? '' : /^(https?:|data:)/.test(p.img) ? p.img : `https://images.unsplash.com/photo-${p.img}?w=${w}&h=${w}&fit=crop&q=72&auto=format`;
const photo = (p, w, cls = 'ph') => p && p.img ? `<img class="${cls}" src="${imgSrc(p, w)}" alt="${esc(pName(p))}" loading="lazy" decoding="async" onload="this.classList.add('ok')" onerror="this.remove()">` : '';
const lineThumb = (l) => { const p = l.pid ? prod(l.pid) : null; return `<div class="thumb">${art(l.cat || 'custom', l.gem)}${photo(p, 160)}</div>`; };
const waLink = (text) => 'https://wa.me/' + CONFIG.whatsapp + (text ? '?text=' + encodeURIComponent(text) : '');
const openWA = (text) => { window.open(waLink(text), '_blank', 'noopener'); };

/* amount in words (Indian / Bangladeshi system) */
const BN_W = 'শূন্য এক দুই তিন চার পাঁচ ছয় সাত আট নয় দশ এগারো বারো তেরো চৌদ্দ পনেরো ষোলো সতেরো আঠারো উনিশ বিশ একুশ বাইশ তেইশ চব্বিশ পঁচিশ ছাব্বিশ সাতাশ আঠাশ উনত্রিশ ত্রিশ একত্রিশ বত্রিশ তেত্রিশ চৌত্রিশ পঁয়ত্রিশ ছত্রিশ সাঁইত্রিশ আটত্রিশ উনচল্লিশ চল্লিশ একচল্লিশ বিয়াল্লিশ তেতাল্লিশ চুয়াল্লিশ পঁয়তাল্লিশ ছেচল্লিশ সাতচল্লিশ আটচল্লিশ উনপঞ্চাশ পঞ্চাশ একান্ন বাহান্ন তিপ্পান্ন চুয়ান্ন পঞ্চান্ন ছাপ্পান্ন সাতান্ন আটান্ন উনষাট ষাট একষট্টি বাষট্টি তেষট্টি চৌষট্টি পঁয়ষট্টি ছেষট্টি সাতষট্টি আটষট্টি উনসত্তর সত্তর একাত্তর বাহাত্তর তিয়াত্তর চুয়াত্তর পঁচাত্তর ছিয়াত্তর সাতাত্তর আটাত্তর উনআশি আশি একাশি বিরাশি তিরাশি চুরাশি পঁচাশি ছিয়াশি সাতাশি আটাশি উননব্বই নব্বই একানব্বই বিরানব্বই তিরানব্বই চুরানব্বই পঁচানব্বই ছিয়ানব্বই সাতানব্বই আটানব্বই নিরানব্বই'.split(' ');
const EN_1 = 'Zero One Two Three Four Five Six Seven Eight Nine Ten Eleven Twelve Thirteen Fourteen Fifteen Sixteen Seventeen Eighteen Nineteen'.split(' ');
const EN_10 = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
function two(n) {
  if (lang === 'bn') return BN_W[n];
  if (n < 20) return EN_1[n];
  return EN_10[Math.floor(n / 10)] + (n % 10 ? '-' + EN_1[n % 10] : '');
}
function words(n) {
  n = Math.floor(n);
  if (!n) return two(0);
  const bn = lang === 'bn', out = [];
  const cr = Math.floor(n / 1e7); n %= 1e7;
  const lk = Math.floor(n / 1e5); n %= 1e5;
  const th = Math.floor(n / 1e3); n %= 1e3;
  const h = Math.floor(n / 100); const r = n % 100;
  if (cr) out.push(words(cr) + (bn ? ' কোটি' : ' Crore'));
  if (lk) out.push(two(lk) + (bn ? ' লক্ষ' : ' Lakh'));
  if (th) out.push(two(th) + (bn ? ' হাজার' : ' Thousand'));
  if (h) out.push(bn ? two(h) + 'শত' : two(h) + ' Hundred');
  if (r) out.push(two(r));
  return out.join(' ');
}

/* =====================================================================
   STATE
   ===================================================================== */
const PAGE = document.body.dataset.page || 'home';
let official = Object.assign({ from: 'builtin' }, BUILTIN);
let override = null;                       // prices are set only by the admin (Firebase)
const CART_KEY = PAGE === 'admin' ? 'mj_pos_cart' : 'mj_cart', BUYER_KEY = PAGE === 'admin' ? 'mj_pos_buyer' : 'mj_buyer';
let cart = LS.get(CART_KEY, []); if (!Array.isArray(cart)) cart = [];
let buyer = Object.assign({ name: '', phone: '', email: '', addr: '', disc: '', vat: '', adv: '' }, LS.get(BUYER_KEY, {}));
if (PAGE !== 'admin') { buyer.disc = ''; buyer.vat = ''; buyer.adv = ''; }
let catalog = PRODUCTS.slice();
let fbMod = null;                           // Firebase layer (assets/fb.js), loaded when configured
let lockState = LS.get('mj_lock', null);
const lockValid = () => !!(lockState && lockState.rates && Date.now() < lockState.until);
const cachedRates = LS.get('mj_rates_cache', null);
if (cachedRates && cachedRates.date >= official.date) official = Object.assign({ from: 'firebase' }, cachedRates);
const cachedSettings = LS.get('mj_settings_cache', null);
if (cachedSettings) applySettings(cachedSettings, true);
const cachedCatalog = LS.get('mj_catalog_cache', null);
if (Array.isArray(cachedCatalog) && cachedCatalog.length) catalog = cachedCatalog;
function applySettings(st, quiet) {
  if (!st) return;
  if (toNum(st.making) || st.making === 0) CONFIG.making = Number(st.making);
  if (toNum(st.lockMinutes)) CONFIG.lockMinutes = Number(st.lockMinutes);
  if (/^01[3-9]\d{8}$/.test(st.bkash || '')) CONFIG.bkash = st.bkash;
  if (/^01[3-9]\d{8}$/.test(st.nagad || '')) CONFIG.nagad = st.nagad;
  if (st.deliveryFee != null && isFinite(+st.deliveryFee)) CONFIG.deliveryFee = Math.max(0, +st.deliveryFee);
  if (toNum(st.advancePct)) CONFIG.advancePct = Math.min(100, Math.max(5, +st.advancePct));
  if (st.codOn != null) CONFIG.codOn = !!st.codOn;
  CONFIG.notice = st.noticeOn ? { bn: st.notice_bn || '', en: st.notice_en || '' } : null;
  if (!quiet) LS.set('mj_settings_cache', st);
}
let invoice = LS.get('mj_invoice', null);
let live = { state: 'wait', spot: 0, prev: 0, at: 0 };
let fx = LS.get('mj_fx', { v: 0, at: 0 });
let hist = LS.get('mj_hist', []); if (!Array.isArray(hist)) hist = [];
const lastSpot = hist.length ? hist[hist.length - 1] : null;
if (lastSpot) live = { state: 'stale', spot: lastSpot[1], prev: lastSpot[1], at: lastSpot[0] };

const saveCart = () => LS.set(CART_KEY, cart);
const saveBuyer = () => LS.set(BUYER_KEY, buyer);
function rateOf(k) {
  if (PAGE === 'pay' && lockValid() && lockState.rates[k]) return lockState.rates[k];
  return official[k] || 0;
}
function ensureLock(force) {
  if (!force && lockValid()) return false;
  lockState = { at: Date.now(), until: Date.now() + CONFIG.lockMinutes * 60000, date: official.date, rates: { k22: official.k22, k21: official.k21, k18: official.k18, trad: official.trad } };
  LS.set('mj_lock', lockState);
  return true;
}
const estimate = (p, kt) => { const g = p.w * rateOf(kt || p.kt); return { gold: g, making: g * CONFIG.making / 100, total: g * (1 + CONFIG.making / 100) }; };
function intlBhori(k = 24) { return live.spot && fx.v ? live.spot / OZ * GRAM * fx.v * k / 24 : 0; }
function dayChange() {
  const o = LS.get('mj_open', null);
  if (!o || o.day !== todayKey() || !live.spot) return null;
  return (live.spot - o.spot) / o.spot * 100;
}

const qtyOf = (l) => Math.min(20, Math.max(1, Math.round(toNum(l.qty) || 1)));
function calc(l) {
  const piece = l.mode === 'gram' ? toNum(l.g) / GRAM : toNum(l.b) + toNum(l.a) / 16 + toNum(l.r) / 96 + toNum(l.p) / 960;
  const q = qtyOf(l), tb = piece * q;
  const rate = rateOf(l.carat), gold = tb * rate;
  const mc = PAGE === 'admin' ? toNum(l.mc) : CONFIG.making, mcu = PAGE === 'admin' ? l.mcu : 'pct';
  const making = mcu === 'tk' ? tb * mc : gold * mc / 100;
  return { tb, piece, q, rate, gold, making, total: gold + making };
}
function totals() {
  const lines = cart.map(calc);
  const gold = lines.reduce((s, x) => s + x.gold, 0), making = lines.reduce((s, x) => s + x.making, 0);
  const sub = gold + making, d = Math.min(toNum(buyer.disc), 100), discAmt = sub * d / 100, after = sub - discAmt;
  const v = toNum(buyer.vat), vatAmt = after * v / 100, adv = toNum(buyer.adv);
  const ship = PAGE === 'pay' && typeof payState !== 'undefined' && payState.delivery === 'home' ? CONFIG.deliveryFee : 0;
  return { lines, gold, making, sub, d, discAmt, v, vatAmt, adv, ship, grand: Math.max(after + vatAmt - adv, 0) + ship };
}
const lineName = (l) => l.name || (l.pid ? pName(prod(l.pid)) : t('cat_' + (l.cat || 'custom')));
const qtyTag = (q) => q > 1 ? ` × ${dg(q)}` : '';
const hasCustom = () => cart.some(l => l.custom || !l.pid);
function bhoriParts(w) {
  let pts = Math.round(w * 960);
  const b = Math.floor(pts / 960); pts %= 960; const a = Math.floor(pts / 60); pts %= 60; const r = Math.floor(pts / 10);
  return { b: b ? String(b) : '', a: a ? String(a) : '', r: r ? String(r) : '', p: pts % 10 ? String(pts % 10) : '' };
}

/* =====================================================================
   ARTWORK (SVG)
   ===================================================================== */
const GEM = { ruby: 'url(#ruby)', emerald: 'url(#emerald)', sapphire: 'url(#sapphire)', diamond: 'url(#gem)' };
const SPARK = (x, y, s = 18, d = 0) => `<use class="twinkle" style="animation-delay:${d}s" href="#spark" x="${x}" y="${y}" width="${s}" height="${s}"/>`;
function jhumka(x, g) {
  return `<g transform="translate(${x} 10)"><path d="M100 26 Q86 26 86 40 Q86 52 100 52" fill="none" stroke="url(#gold)" stroke-width="2.5"/>
  <circle cx="100" cy="64" r="12" fill="url(#gold)"/><circle cx="100" cy="64" r="5" fill="${g}"/><path d="M100 76 L100 96" stroke="url(#gold)" stroke-width="2.5"/>
  <path d="M66 162 Q68 98 100 96 Q132 98 134 162 Z" fill="url(#gold)"/><path d="M78 150 Q80 112 100 108" fill="none" stroke="#fff3c4" stroke-opacity=".55" stroke-width="1.2"/>
  <ellipse cx="100" cy="162" rx="34" ry="7" fill="#9c6e1e"/><path d="M70 168 V174 M82 169 V178 M94 170 V180 M106 170 V180 M118 169 V178 M130 168 V174" stroke="#c9a227" stroke-width="1"/>
  ${[70, 82, 94, 106, 118, 130].map((cx, i) => `<circle cx="${cx}" cy="${[178, 182, 184, 184, 182, 178][i]}" r="4" fill="url(#gold)"/>`).join('')}</g>`;
}
function art(cat, gem) {
  const g = GEM[gem] || GEM.ruby;
  const A = {
    necklace: `<path d="M30 20 Q150 210 270 20" fill="none" stroke="#c9a227" stroke-width="1.5"/><path d="M30 20 Q150 210 270 20" fill="none" stroke="url(#gold)" stroke-width="8" stroke-linecap="round" stroke-dasharray="0 11"/><circle cx="150" cy="120" r="5" fill="none" stroke="url(#gold)" stroke-width="2.5"/><path d="M150 127 C176 158 180 196 150 222 C120 196 124 158 150 127 Z" fill="url(#gold)"/><ellipse cx="150" cy="178" rx="10" ry="16" fill="${g}"/>${SPARK(186, 140)}`,
    earrings: jhumka(0, g) + jhumka(100, g) + SPARK(140, 118, 18, 1),
    bangles: `<ellipse cx="166" cy="146" rx="104" ry="62" fill="none" stroke="url(#gold)" stroke-width="18" opacity=".55"/><ellipse cx="140" cy="126" rx="104" ry="62" fill="none" stroke="url(#gold)" stroke-width="24"/><ellipse cx="140" cy="126" rx="104" ry="62" fill="none" stroke="#5a3f12" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="0.5 13"/><ellipse cx="140" cy="126" rx="91" ry="50" fill="none" stroke="#fff3c4" stroke-opacity=".4" stroke-width="1.2"/><circle cx="140" cy="64" r="6" fill="${g}" stroke="#f3d98c" stroke-width="2"/><circle cx="140" cy="188" r="6" fill="${g}" stroke="#f3d98c" stroke-width="2"/>${SPARK(222, 78, 18, 2)}`,
    ring: `<circle cx="150" cy="150" r="70" fill="none" stroke="url(#gold)" stroke-width="16"/><circle cx="150" cy="150" r="61" fill="none" stroke="#fff3c4" stroke-opacity=".4" stroke-width="1.2"/><path d="M126 82 Q150 70 174 82 L168 92 Q150 84 132 92 Z" fill="url(#gold)"/>` +
      (gem === 'diamond'
        ? `<polygon points="132,44 168,44 182,62 118,62" fill="url(#gem)"/><polygon points="118,62 182,62 150,90" fill="url(#gem)" opacity=".9"/><polygon points="132,44 168,44 182,62 150,90 118,62" fill="none" stroke="url(#gold)" stroke-width="3"/>`
        : `<rect x="128" y="44" width="44" height="40" rx="10" fill="${g}" stroke="url(#gold)" stroke-width="4"/><circle cx="122" cy="64" r="4" fill="url(#gold)"/><circle cx="178" cy="64" r="4" fill="url(#gold)"/>`) + SPARK(186, 36, 18, .5),
    chain: `<path d="M30 40 Q150 230 270 40" fill="none" stroke="url(#gold)" stroke-width="10" stroke-dasharray="14 5" stroke-linecap="round"/><path d="M30 40 Q150 230 270 40" fill="none" stroke="#3a2a08" stroke-opacity=".45" stroke-width="2.5" stroke-dasharray="8 11" stroke-dashoffset="-3"/><circle cx="150" cy="135" r="8" fill="none" stroke="url(#gold)" stroke-width="3.5"/><circle cx="30" cy="40" r="6" fill="url(#gold)"/><circle cx="270" cy="40" r="6" fill="url(#gold)"/>${SPARK(196, 100, 18, 1.6)}`,
    pendant: `<path d="M90 20 L150 95 L210 20" fill="none" stroke="url(#gold)" stroke-width="3" stroke-dasharray="5 3"/><circle cx="150" cy="101" r="6" fill="none" stroke="url(#gold)" stroke-width="3"/><path d="M150 214 C100 178 92 142 115 124 C132 111 147 119 150 134 C153 119 168 111 185 124 C208 142 200 178 150 214 Z" fill="url(#gold)"/><path d="M150 196 C116 170 112 146 126 136" fill="none" stroke="#fff3c4" stroke-opacity=".5" stroke-width="1.4"/><circle cx="150" cy="160" r="12" fill="${g}" stroke="#9c6e1e" stroke-width="1.5"/>${SPARK(176, 130, 18, .8)}`,
    nosepin: `<g transform="translate(0 -6)">${[[176, 110], [163, 132.5], [137, 132.5], [124, 110], [137, 87.5], [163, 87.5]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="16" fill="url(#gold)"/>`).join('')}<circle cx="150" cy="110" r="15" fill="${g}" stroke="#9c6e1e" stroke-width="1.5"/><circle cx="145" cy="105" r="4" fill="#fff" opacity=".8"/><path d="M150 150 L150 214" stroke="url(#gold)" stroke-width="4" stroke-linecap="round"/><circle cx="150" cy="218" r="5" fill="url(#gold)"/></g>${SPARK(186, 60, 18, 1.3)}`,
    bracelet: `<path d="M40 130 Q150 70 260 130" fill="none" stroke="url(#gold)" stroke-width="14" stroke-dasharray="18 4" stroke-linecap="round"/><path d="M40 130 Q150 70 260 130" fill="none" stroke="#fff3c4" stroke-opacity=".35" stroke-width="2"/><path d="M95 114 V142 M150 106 V142 M205 114 V142" stroke="url(#gold)" stroke-width="2"/><circle cx="95" cy="150" r="8" fill="${g}" stroke="#f3d98c" stroke-width="2"/><polygon points="150,142 162,156 150,172 138,156" fill="url(#gem)" stroke="#9c6e1e" stroke-width="1.5"/><circle cx="205" cy="150" r="8" fill="url(#gold)"/>${SPARK(236, 84, 18, .3)}`,
    custom: `<polygon points="112,70 188,70 222,108 78,108" fill="url(#gem)"/><polygon points="78,108 222,108 150,196" fill="url(#gem)" opacity=".92"/><path d="M112 70 L130 108 M188 70 L170 108 M150 70 L130 108 M150 70 L170 108 M130 108 L150 196 M170 108 L150 196" stroke="#8c6a23" stroke-opacity=".3" fill="none"/><polygon points="112,70 188,70 222,108 150,196 78,108" fill="none" stroke="url(#gold)" stroke-width="4" stroke-linejoin="round"/>${SPARK(210, 50, 22)}${SPARK(64, 150, 16, 1.4)}`
  };
  return `<svg viewBox="0 0 300 250" aria-hidden="true">${A[cat] || A.custom}</svg>`;
}

/* Brand emblem — the signature logo */
function emblem(opts = {}) {
  const id = opts.id ? ` id="${opts.id}"` : '';
  const role = opts.label ? `role="img" aria-label="${esc(opts.label)}"` : 'aria-hidden="true"';
  return `<svg${id} viewBox="0 0 120 120" ${role} class="${opts.cls || ''}">
  <circle cx="60" cy="60" r="57" fill="url(#enamel)"/>
  <circle cx="60" cy="60" r="56" fill="none" stroke="url(#gold)" stroke-width="2.5"/>
  <circle cx="60" cy="60" r="51" fill="none" stroke="url(#gold)" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="0 6.41"${opts.spin ? ' class="spin"' : ''}/>
  <circle cx="60" cy="60" r="46" fill="none" stroke="url(#gold)" stroke-width=".8" opacity=".75"/>
  <polyline${opts.draw ? ' class="draw"' : ''} points="34,77 34,45 47,61 60,37 73,61 86,45 86,77" fill="none" stroke="url(#gold)" stroke-width="5.2" stroke-linejoin="round" stroke-linecap="round"/>
  <rect x="29" y="76" width="62" height="8" rx="2.5" fill="url(#gold)"/>
  <circle cx="44" cy="80" r="1.5" fill="#2a1f12"/><circle cx="76" cy="80" r="1.5" fill="#2a1f12"/><circle cx="60" cy="80" r="2.6" fill="${opts.mono ? 'url(#gold)' : 'url(#ruby)'}"/>
  <circle cx="34" cy="40.5" r="3.8" fill="url(#pearl)" stroke="#9c6e1e" stroke-width=".6"/><circle cx="86" cy="40.5" r="3.8" fill="url(#pearl)" stroke="#9c6e1e" stroke-width=".6"/>
  <polygon points="60,19 67,26.5 60,34 53,26.5" fill="url(#gem)" stroke="url(#gold)" stroke-width="1.2"/>
  <path d="M53 26.5 H67 M60 19 L57 26.5 L60 34 L63 26.5 Z" fill="none" stroke="#8c6a23" stroke-opacity=".35" stroke-width=".6"/>
  <path d="M60 87 C55.5 91.5 55.5 96.5 60 100 C64.5 96.5 64.5 91.5 60 87 Z" fill="url(#gold)"/>
  <path d="M59 99.5 C52 99 47.5 95 45.5 90 C51.5 90 56.5 93.5 59 99.5 Z" fill="url(#gold)"/>
  <path d="M61 99.5 C68 99 72.5 95 74.5 90 C68.5 90 63.5 93.5 61 99.5 Z" fill="url(#gold)"/>
  ${opts.sparkle ? '<use class="twinkle" href="#spark" x="68" y="12" width="12" height="12"/>' : ''}
  </svg>`;
}

const ICON = {
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>',
  heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-9.2-9.4C1.6 7.6 3.9 4.5 7.2 4.5c2 0 3.6 1.1 4.8 2.8 1.2-1.7 2.8-2.8 4.8-2.8 3.3 0 5.6 3.1 4.4 6.6-1.7 4.8-9.2 9.4-9.2 9.4z"/></svg>',
  google: '<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>',
  logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11"/></svg>',
  box: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z"/><path d="M3 7.5 12 12l9-4.5M12 12v9"/></svg>',
  eyeoff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M3 3l18 18M10.6 6.1A9.8 9.8 0 0 1 12 6c5 0 8.5 4.5 9.5 6-.5.8-1.6 2.3-3.2 3.6M6.4 7.6C4.6 8.9 3.2 10.7 2.5 12c1 1.5 4.5 6 9.5 6 1.5 0 2.9-.4 4.1-1M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>',
  card: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19M6 15h4"/></svg>',
  truck: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M2 6h11v10H2zM13 9h4.5L21 12.5V16h-8"/><circle cx="6" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/></svg>',
  store: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M3 9l1.5-5h15L21 9M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0zM5 13v7h14v-7M10 20v-4h4v4"/></svg>',
  camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M3 8h4l2-3h6l2 3h4v11H3z"/><circle cx="12" cy="13" r="3.5"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6 8.5 7 8.5-7"/></svg>',
  coins: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><ellipse cx="9" cy="7" rx="6" ry="3"/><path d="M3 7v4c0 1.7 2.7 3 6 3s6-1.3 6-3V7"/><path d="M9 14v3c0 1.7 2.7 3 6 3s6-1.3 6-3v-4c0-1.6-2.4-2.9-5.5-3"/></svg>',
  wa: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24zm4.52-6.17c-.25-.12-1.46-.72-1.69-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.46-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28z"/></svg>',
  cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M5 8h14l-1.2 12H6.2z"/><path d="M9 8a3 3 0 0 1 6 0"/></svg>',
  cartAdd: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M5 8h14l-1.2 12H6.2z"/><path d="M9 8a3 3 0 0 1 6 0M12 12v5M9.5 14.5h5"/></svg>',
  eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 20h4L20 8l-4-4L4 16z"/></svg>',
  cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M8 2v4M16 2v4M3 9h18"/><rect x="3" y="4" width="18" height="17" rx="2"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M5 7h14M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
  doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M6 2h9l5 5v15H6z"/><path d="M14 2v6h6M9 13h8M9 17h5"/></svg>',
  print: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M6 9V3h12v6M6 18H4v-7h16v7h-2"/><path d="M6 14h12v7H6z"/></svg>',
  reset: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  search: '<svg class="lead" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
  globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.8 3 2.8 15 0 18M12 3c-2.8 3-2.8 15 0 18"/></svg>',
  moon: '<svg class="moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg>',
  sun: '<svg class="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h10"/></svg>',
  qr: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3"/></svg>',
  copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>',
  download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z"/><path d="M8.5 12l2.5 2.5 4.5-5"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
  gem: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M6 3h12l3 6-9 12L3 9z"/><path d="M3 9h18M9 3l3 18M15 3l-3 18"/></svg>'
};
function corner() {
  return `<svg class="corner {c}" viewBox="0 0 64 64" aria-hidden="true"><path d="M3 62 V16 Q3 3 16 3 H62" fill="none" stroke="#a9781f" stroke-width="1.6"/><path d="M9 62 V20 Q9 9 20 9 H62" fill="none" stroke="#a9781f" stroke-width=".7"/><path d="M16 16 C22 16 26 20 26 26 C20 26 16 22 16 16 Z" fill="#c9a227"/><polygon points="3,3 7,7 3,11 -1,7" fill="#c9a227" transform="translate(3 3)"/><circle cx="32" cy="9" r="1.6" fill="#c9a227"/><circle cx="9" cy="32" r="1.6" fill="#c9a227"/></svg>`;
}

/* =====================================================================
   CHROME — sprite, background, masthead, footer, floating, dialogs
   ===================================================================== */
function spriteHTML() {
  return `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff3c4"/><stop offset=".25" stop-color="#e7c34c"/><stop offset=".5" stop-color="#9c6e1e"/><stop offset=".72" stop-color="#f3d98c"/><stop offset="1" stop-color="#7e5a1e"/></linearGradient>
    <radialGradient id="enamel" cx=".5" cy=".38" r=".7"><stop offset="0" stop-color="#2a1f12"/><stop offset="1" stop-color="#0d0905"/></radialGradient>
    <linearGradient id="gem" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#e9eef3"/><stop offset="1" stop-color="#b9c4d1"/></linearGradient>
    <radialGradient id="pearl" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e6d6b0"/></radialGradient>
    <radialGradient id="ruby" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#ff9aaa"/><stop offset=".45" stop-color="#b3213a"/><stop offset="1" stop-color="#5a0d1b"/></radialGradient>
    <radialGradient id="emerald" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#9ff5c8"/><stop offset=".45" stop-color="#1f9d62"/><stop offset="1" stop-color="#0b4a2c"/></radialGradient>
    <radialGradient id="sapphire" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#a9c8ff"/><stop offset=".45" stop-color="#2a55c4"/><stop offset="1" stop-color="#0f235e"/></radialGradient>
    <linearGradient id="sparkfill" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e2a400"/><stop offset="1" stop-color="#e2a400"/></linearGradient>
    <symbol id="spark" viewBox="-12 -12 24 24"><path d="M0 -12 L2.2 -2.2 L12 0 L2.2 2.2 L0 12 L-2.2 2.2 L-12 0 L-2.2 -2.2 Z" fill="#fff3c4"/></symbol>
  </defs></svg>`;
}
function injectChrome() {
  const sprite = spriteHTML();
  const bg = `<div class="bg" aria-hidden="true"><div class="blob b1"></div><div class="blob b2"></div><div class="blob b3"></div></div>
    <div class="grain" aria-hidden="true"></div><canvas id="gems" aria-hidden="true"></canvas><div class="spotlight" id="spot" aria-hidden="true"></div>`;
  const head = `<header class="masthead" id="masthead">
    <div class="progress" id="progress"></div>
    <div class="ticker" role="region" id="ticker">
      <div class="tk-live" id="tkLive"><i></i><span id="tkLiveTxt"></span></div>
      <div class="tk-view"><div class="tk-track" id="tkTrack"></div></div>
      <div class="tk-upd">${ICON.clock}<span id="tkUpd"></span></div>
    </div>
    <div class="navwrap"><div class="nav-pill glass">
      <a class="lockup" href="index.html" id="lockup">${emblem({ sparkle: true })}<span><span class="w1" data-i18n="brand"></span><span class="w2">MAA JEWELLERS</span></span></a>
      <nav class="navlinks" id="navlinks"></nav>
      <div class="tools">
        <button class="tbtn" type="button" data-lang-toggle>${ICON.globe}<span class="lbl-txt" id="langLbl"></span></button>
        <button class="tbtn" type="button" data-theme-toggle>${ICON.moon}${ICON.sun}</button>
        <a class="tbtn acc-btn" href="account.html" id="accBtn">${ICON.user}<span class="av" id="accAv" hidden></span></a>
        <a class="tbtn" href="cart.html" id="cartBtn">${ICON.cart}<span class="cnt" id="cartCnt"></span></a>
        <button class="tbtn menu-btn" type="button" data-menu>${ICON.menu}</button>
      </div>
    </div></div>
    <div class="notice" id="notice" hidden></div>
  </header>
  <div class="drawer" id="drawer"><div class="scrim" data-close-menu></div>
    <div class="panel glass" role="dialog" aria-modal="true">
      <div class="dhead"><a class="lockup" href="index.html">${emblem()}<span><span class="w1" data-i18n="brand"></span><span class="w2">MAA JEWELLERS</span></span></a>
      <button class="tbtn" type="button" data-close-menu>${ICON.x}</button></div>
      <div id="drawerLinks"></div>
      <div style="display:flex;gap:8px;margin-top:14px"><button class="tbtn" type="button" data-lang-toggle style="flex:1">${ICON.globe}<span id="langLbl2"></span></button><button class="tbtn" type="button" data-theme-toggle style="flex:1">${ICON.moon}${ICON.sun}</button></div>
      <a class="btn btn-wa" style="margin-top:14px" data-wa href="${waLink()}" target="_blank" rel="noopener">${ICON.wa}<span>${CONFIG.whatsappShow}</span></a>
    </div></div>`;
  document.body.insertAdjacentHTML('afterbegin', sprite + bg + head);

  const foot = `<footer class="site-foot"><div class="wrap">
    <div class="foot-grid glass">
      <div><a class="lockup" href="index.html">${emblem()}<span><span class="w1" data-i18n="brand"></span><span class="w2">MAA JEWELLERS</span></span></a>
        <p data-i18n="foot_about"></p><p><span data-i18n="proprietor"></span>: <b style="color:var(--ink)" data-i18n="owner"></b></p></div>
      <div><h4 data-i18n="foot_pages"></h4><div id="footLinks"></div></div>
      <div><h4 data-i18n="foot_rates"></h4><div id="footRates"></div></div>
      <div><h4 data-i18n="foot_contact"></h4>
        <a href="tel:${CONFIG.phone}">${ICON.phone.replace('<svg', '<svg style="display:inline;width:15px;height:15px;vertical-align:-2px;margin-right:6px"')}<span data-digits="${CONFIG.phoneShow}"></span></a>
        <a href="${waLink()}" target="_blank" rel="noopener" data-wa>${ICON.wa.replace('<svg', '<svg style="display:inline;width:15px;height:15px;vertical-align:-2px;margin-right:6px"')}<span data-digits="${CONFIG.whatsappShow}"></span></a>
        <p data-i18n="address"></p></div>
    </div>
    <div class="accept glass" id="footAccept"></div>
    <div class="foot-bottom"><span>© <span id="year"></span> <span data-i18n="brand"></span> · <span data-i18n="rights"></span></span><span>MAA JEWELLERS · PARASHURAM · FENI</span></div>
  </div></footer>
  <a class="wa-fab" href="${waLink()}" target="_blank" rel="noopener" data-wa id="waFab"><span class="c">${ICON.wa}</span><span class="tip glass" data-i18n="wa_tip"></span></a>
  <a class="fab glass ${['cart', 'invoice', 'pay', 'track'].includes(PAGE) ? 'hide' : ''}" href="cart.html" id="fab"><span class="bag">${ICON.cart}<span class="badge2" id="fabCount">0</span></span><span><small data-i18n="cart"></small><b id="fabTotal">৳ 0</b></span></a>
  <div class="toast glass" id="toast" role="status" aria-live="polite"></div>
  <dialog class="dlg wide" id="qvDlg"><div class="dlg-in glass" id="qvBody"></div></dialog>
  <div class="cursor" id="cursor"></div><div class="cursor-dot" id="cursorDot"></div>`;
  document.body.insertAdjacentHTML('beforeend', foot);
}

function renderChrome() {
  $('#navlinks').innerHTML = NAV.map(([k, h]) => `<a href="${h}" class="${PAGE === k ? 'active' : ''}" ${PAGE === k ? 'aria-current="page"' : ''}>${t('nav_' + k)}</a>`).join('');
  $('#drawerLinks').innerHTML = NAV.map(([k, h]) => `<a class="dl ${PAGE === k ? 'active' : ''}" href="${h}">${t('nav_' + k)}<span>${t('nav_' + k + '_en')}</span></a>`).join('');
  $('#footLinks').innerHTML = NAV.map(([k, h]) => `<a href="${h}">${t('nav_' + k)}</a>`).join('');
  $('#footRates').innerHTML = CARATS.map(k => `<a href="index.html#rates">${t(k)} · <b style="color:var(--hi)">${money(rateOf(k))}</b></a>`).join('');
  $('#langLbl').textContent = lang === 'bn' ? 'EN' : 'বাং';
  $('#langLbl2').textContent = lang === 'bn' ? 'English' : 'বাংলা';
  $$('[data-lang-toggle]').forEach(b => b.setAttribute('aria-label', t('lang_aria')));
  $$('[data-theme-toggle]').forEach(b => b.setAttribute('aria-label', t('theme_aria')));
  $('[data-menu]').setAttribute('aria-label', t('menu'));
  $$('[data-close-menu]').forEach(b => b.setAttribute('aria-label', t('close')));
  $('#cartBtn').setAttribute('aria-label', t('cart_aria'));
  $('#accBtn').setAttribute('aria-label', t('nav_account')); $('#accBtn').classList.toggle('active', PAGE === 'account');
  const av = $('#accAv');
  if (av) { av.hidden = !user; av.innerHTML = user ? (user.photoURL ? `<img src="${esc(user.photoURL)}" alt="" referrerpolicy="no-referrer">` : esc(initialOf(user))) : ''; }
  $('#drawerLinks').insertAdjacentHTML('beforeend', `<a class="dl ${PAGE === 'account' ? 'active' : ''}" href="account.html">${t('nav_account')}<span>${t('nav_account_en')}</span></a>`);
  $('#fab').setAttribute('aria-label', t('cart_aria'));
  $('#waFab').setAttribute('aria-label', t('wa_tip'));
  $('#ticker').setAttribute('aria-label', t('intl_title'));
  $('#lockup').setAttribute('aria-label', t('brand'));
  $('#year').textContent = dg(new Date().getFullYear());
  $('#footAccept').innerHTML = payBadges();
  const nt = $('#notice');
  if (nt) { const msg = CONFIG.notice && (CONFIG.notice[lang] || CONFIG.notice.bn || CONFIG.notice.en); nt.hidden = !msg; nt.innerHTML = msg ? `<span>✦</span><b>${esc(msg)}</b><span>✦</span>` : ''; }
  $$('[data-wa]').forEach(a => { if (a.tagName === 'A') a.href = waLink(t('wa_hi')); });
  updateCartBadges();
}

function applyStatic() {
  document.documentElement.lang = lang;
  $$('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  $$('[data-i18n-html]').forEach(el => { el.innerHTML = t(el.dataset.i18nHtml); });
  $$('[data-i18n-ph]').forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
  $$('[data-i18n-aria]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
  $$('[data-digits]').forEach(el => { el.textContent = dg(el.dataset.digits); });
  const base = document.body.dataset.title;
  document.title = t('brand') + (base ? ' · ' + t(base) : ' · MAA JEWELLERS');
}

function updateCartBadges() {
  const n = cart.length, g = totals().grand;
  const c = $('#cartCnt'); if (c) { c.textContent = n ? dg(n) : ''; c.dataset.n = n; }
  const f = $('#fabCount'); if (f) f.textContent = dg(n);
  const ft = $('#fabTotal'); if (ft) ft.textContent = money(g);
}

/* =====================================================================
   LIVE TICKER + INTERNATIONAL PANEL
   ===================================================================== */
function tkItem(key, label, val, ch) {
  const chHtml = ch == null ? '' : `<span class="ch ${ch >= 0 ? 'tk-up' : 'tk-down'}">${ch >= 0 ? '▲' : '▼'} ${pct(Math.abs(ch))}</span>`;
  return `<span class="tk-item" data-tk="${key}"><span class="l">${label}</span><b>${val}</b>${chHtml}</span>`;
}
let lastFlash = 0;
function renderTicker(flashDir) {
  const ch = dayChange();
  const items = [
    tkItem('spot', t('tk_spot'), live.spot ? '$ ' + num(live.spot, 2) + ' /oz' : '—', ch),
    tkItem('i24', t('tk_24'), intlBhori(24) ? money(intlBhori(24)) : '—'),
    tkItem('i22', t('tk_22i'), intlBhori(22) ? money(intlBhori(22)) : '—'),
    tkItem('fx', t('tk_fx'), fx.v ? '৳ ' + num(fx.v, 2) : '—'),
    ...CARATS.map(k => tkItem('b' + k, t('tk_b') + ' ' + ktLabel(k), money(rateOf(k))))
  ].join('');
  $('#tkTrack').innerHTML = items + items;
  $('#tkLiveTxt').textContent = t('tk_live');
  $('#tkLive').classList.toggle('off', live.state !== 'ok');
  if (flashDir) $$('[data-tk="spot"],[data-tk="i24"],[data-tk="i22"]').forEach(el => el.classList.add(flashDir > 0 ? 'flash-up' : 'flash-down'));
  updateAgo();
}
function updateAgo() {
  const el = $('#tkUpd'); if (!el) return;
  if (!live.at) { el.textContent = t('tk_wait'); return; }
  if (live.state === 'off') { el.textContent = t('tk_off'); return; }
  const s = Math.max(0, Math.round((Date.now() - live.at) / 1000));
  const span = s < 5 ? t('just') : s < 90 ? dg(s) + ' ' + t('sec') : dg(Math.round(s / 60)) + ' ' + t('min');
  const txt = s < 5 ? span : t('tk_upd', { s: span });
  if (el.textContent === txt) return;
  el.textContent = txt;
  $$('.ago-inline').forEach(x => { x.textContent = txt; });
}

async function getJSON(url, ms = 9000) {
  const ctl = 'AbortController' in window ? new AbortController() : null;
  const tm = ctl ? setTimeout(() => ctl.abort(), ms) : 0;
  try {
    const r = await fetch(url, { cache: 'no-store', signal: ctl ? ctl.signal : undefined });
    if (!r.ok) throw new Error(r.status);
    return await r.json();
  } finally { clearTimeout(tm); }
}
async function loadFx(force) {
  if (!force && fx.v && Date.now() - fx.at < CONFIG.fxEveryMin * 60000) return;
  try { const j = await getJSON('https://open.er-api.com/v6/latest/USD'); const v = +(j.rates && j.rates.BDT); if (v) { fx = { v, at: Date.now() }; LS.set('mj_fx', fx); } } catch (e) { /* keep last */ }
}
async function loadSpot() {
  let spot = 0;
  try { const j = await getJSON('https://xaus.com/api/v1/spot'); spot = +(j.spot_usd_oz || (j.xau && j.xau.price)) || 0; } catch (e) { /* next source */ }
  if (!spot) { try { const j = await getJSON('https://api.gold-api.com/price/XAU'); spot = +j.price || 0; } catch (e) { /* offline */ } }
  if (spot) {
    const prev = live.spot;
    live = { state: 'ok', spot, prev, at: Date.now() };
    const o = LS.get('mj_open', null);
    if (!o || o.day !== todayKey()) LS.set('mj_open', { day: todayKey(), spot });
    const last = hist[hist.length - 1];
    if (!last || last[1] !== spot || Date.now() - last[0] > 5 * 60000) { hist.push([Date.now(), spot]); hist = hist.slice(-360); LS.set('mj_hist', hist); }
    return prev && spot !== prev ? Math.sign(spot - prev) : 0;
  }
  live.state = 'off';
  return 0;
}
async function liveTick() {
  await loadFx(false);
  const dir = await loadSpot();
  renderTicker(dir);
  renderIntlPanel(dir);
  renderHeroLive(dir);
}

function sparkSVG() {
  const pts = hist.slice(-120);
  if (pts.length < 3) return `<span class="sp-lbl">${t('spark_wait')}</span>`;
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const W = 600, H = 150, pad = 26;
  const X = (x) => x1 === x0 ? W / 2 : (x - x0) / (x1 - x0) * W;
  const Y = (y) => y1 === y0 ? H / 2 : H - pad / 2 - (y - y0) / (y1 - y0) * (H - pad * 1.6);
  const d = pts.map((p, i) => (i ? 'L' : 'M') + X(p[0]).toFixed(1) + ' ' + Y(p[1]).toFixed(1)).join(' ');
  const lp = pts[pts.length - 1];
  return `<span class="sp-lbl">${t('spark_lbl')}</span><span class="sp-rng">$ ${num(y0, 2)} – $ ${num(y1, 2)}</span>
  <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
    <defs><linearGradient id="spf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e7c34c" stop-opacity=".45"/><stop offset="1" stop-color="#e7c34c" stop-opacity="0"/></linearGradient></defs>
    <path d="${d} L${W} ${H} L0 ${H} Z" fill="url(#spf)"/>
    <path d="${d}" fill="none" stroke="#e7c34c" stroke-width="2.2" vector-effect="non-scaling-stroke"/>
    <circle cx="${X(lp[0])}" cy="${Y(lp[1])}" r="4" fill="#fff3c4"><animate attributeName="r" values="3;6;3" dur="2s" repeatCount="indefinite"/></circle>
  </svg>`;
}
function renderIntlPanel(flashDir) {
  const el = $('#intlPanel'); if (!el) return;
  const ch = dayChange(), i22 = intlBhori(22), b22 = rateOf('k22');
  const vs = i22 ? (b22 - i22) / i22 * 100 : null;
  el.innerHTML = `
    <div>
      <div class="intl-head"><span class="dot ${live.state === 'ok' ? '' : 'off'}"></span><div><b>${t('intl_title')}</b><small>${t('intl_sub', { n: dg(CONFIG.liveEverySec) })} · <span class="ago-inline">${$('#tkUpd') ? $('#tkUpd').textContent : ''}</span></small></div></div>
      <div class="metrics">
        <div class="metric"><small>${t('m_spot')}</small><span data-fl>${live.spot ? '$ ' + num(live.spot, 2) : '—'}</span>${ch == null ? '' : `<em class="${ch >= 0 ? 'tk-up' : 'tk-down'}" style="color:${ch >= 0 ? 'var(--ok)' : 'var(--bad)'}">${ch >= 0 ? '▲' : '▼'} ${pct(Math.abs(ch))} ${t('m_day')}</em>`}</div>
        <div class="metric"><small>${t('m_fx')}</small><span>${fx.v ? '৳ ' + num(fx.v, 2) : '—'}</span></div>
        <div class="metric"><small>${t('m_24')}</small><span data-fl>${intlBhori(24) ? money(intlBhori(24)) : '—'}</span></div>
        <div class="metric"><small>${t('m_22')}</small><span data-fl>${i22 ? money(i22) : '—'}</span></div>
        <div class="metric" style="grid-column:span 2"><small>${t('m_vs')}</small><span>${vs == null ? '—' : (vs >= 0 ? '+' : '−') + pct(Math.abs(vs), 1)}</span></div>
      </div>
    </div>
    <div class="spark">${sparkSVG()}</div>
    <div class="attr">${t('intl_note')} · <a href="https://www.exchangerate-api.com" target="_blank" rel="noopener">Rates by Exchange Rate API</a> · Gold: xaus.com</div>`;
  if (flashDir) $$('[data-fl]', el).forEach(s => s.classList.add(flashDir > 0 ? 'flash-up' : 'flash-down'));
}

/* rates.json next to the pages (works when hosted, e.g. Vercel) */
async function loadRatesFile() {
  if (!/^https?:/.test(location.protocol)) return;
  try {
    const j = await getJSON('rates.json?v=' + Date.now(), 6000);
    if (fbMod || (official.from === 'firebase' && j && j.date <= official.date)) return;
    if (j && /^\d{4}-\d{2}-\d{2}$/.test(j.date) && CARATS.every(k => toNum(j[k])) && j.date >= official.date) {
      official = { from: 'file', date: j.date }; CARATS.forEach(k => { official[k] = toNum(j[k]); });
      rerenderRates();
    }
  } catch (e) { /* keep built-in */ }
}
function rerenderRates() {
  renderChrome(); renderTicker(); renderIntlPanel();
  if (PAGE === 'home') { renderRateBoard(); renderHeroLive(); renderFeatured(); }
  if (PAGE === 'shop') renderShop();
  if (PAGE === 'calc') { renderRateChips(); renderEstimator(); }
  if (PAGE === 'cart' || PAGE === 'admin') { renderRateChips(); renderCart(); }
  if (PAGE === 'pay') renderCheckout();
}

/* =====================================================================
   RATE BOARD (home) + EDIT DIALOG
   ===================================================================== */
let countedOnce = false;
function renderRateBoard() {
  const el = $('#rateBoard'); if (!el) return;
  const meta = t(official.from === 'firebase' ? 'rate_meta_live' : official.from === 'file' ? 'rate_meta_file' : 'rate_meta', { d: fdate(official.date) });
  el.innerHTML = `<div class="rate-grid">${CARATS.map((k, i) => `
      <article class="rate glass tilt reveal in" style="animation-delay:${i * .08}s">
        <div class="rate-top"><span class="kt">${ktLabel(k)}</span><span class="tag">${t('official')}</span></div>
        <h3>${t(k)} · ${t(k + '_s')}</h3>
        <div class="big" data-count="${Math.round(rateOf(k))}">${money(rateOf(k))}</div>
        <div class="per">${t('per_bhori')} · ${money(rateOf(k) / GRAM)} ${t('per_gram')}</div>
      </article>`).join('')}</div>
    <div class="rate-foot glass"><div class="meta"><span class="ic">${ICON.cal}</span><span>${meta}</span></div>
      <span class="lockpill">${ICON.lock}<span>${t('est_note')}</span></span></div>
    <div class="intl-panel glass" id="intlPanel" aria-live="polite"></div>`;
  renderIntlPanel();
  bindTilt(el);
  if (!countedOnce) { countedOnce = true; countUp(el); }
}
function countUp(root) {
  if (reduce) return;
  $$('[data-count]', root).forEach(el => {
    const target = +el.dataset.count, dur = 1400;
    const io = new IntersectionObserver(es => {
      if (!es[0].isIntersecting) return; io.disconnect();
      const start = performance.now();
      const step = (now) => {
        const p = Math.min(1, Math.max(0, (now - start) / dur)), e = 1 - Math.pow(1 - p, 3);
        if (el.isConnected) el.textContent = money(target * e);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
    io.observe(el);
  });
}
/* =====================================================================
   HOME
   ===================================================================== */
function renderHero() {
  const emb = $('#heroEmb'); if (emb) emb.innerHTML = emblem({ draw: true, spin: true, sparkle: true, label: t('brand') + ' logo' });
  const sats = $('#heroOrbit');
  if (sats) sats.innerHTML = [['necklace', 'ruby'], ['earrings', 'emerald'], ['ring', 'diamond'], ['bangles', 'sapphire']]
    .map(([c, g], i) => `<div class="sat s${i + 1}">${art(c, g)}</div>`).join('');
  const strip = $('#strip');
  if (strip) { const s = ['strip1', 'strip2', 'strip3', 'strip4', 'strip5', 'strip6'].map(k => `<span>✦ ${t(k)}</span>`).join(''); strip.innerHTML = s + s; }
  renderHeroLive();
}
function renderHeroLive(dir) {
  const pill = $('#heroPill'); if (pill) pill.textContent = t('hero_pill', { r: money(rateOf('k22')) });
  const rb = $('#rbVal'); if (rb) rb.textContent = money(rateOf('k22'));
  const ib = $('#ibVal');
  if (ib) {
    const ch = dayChange();
    ib.innerHTML = live.spot ? `$ ${num(live.spot, 2)} ${ch == null ? '' : `<span style="font-size:13px;color:${ch >= 0 ? 'var(--ok)' : 'var(--bad)'}">${ch >= 0 ? '▲' : '▼'} ${pct(Math.abs(ch))}</span>`}` : '—';
    if (dir) { ib.classList.remove('flash-up', 'flash-down'); void ib.offsetWidth; ib.classList.add(dir > 0 ? 'flash-up' : 'flash-down'); }
  }
}
function productCard(p, i = 0) {
  const e = estimate(p);
  return `<article class="prod glass tilt" style="animation-delay:${Math.min(i, 12) * .05}s">
    <div class="art" data-qv="${p.id}" role="button" tabindex="0" aria-label="${esc(t('quick'))}: ${esc(pName(p))}">
      ${p.badge ? `<span class="badge">${t('b_' + p.badge)}</span>` : ''}<span class="ktag">${t(p.kt)}</span>
      ${art(p.cat, p.gem)}${photo(p, 600)}
      ${p.img && p.credit ? `<span class="credit">${t('photo_by')}: ${esc(p.credit)}</span>` : ''}
      ${p.soldOut ? `<span class="soldout">${t('sold_out')}</span>` : ''}
      <button class="qv" type="button" data-qv="${p.id}" aria-label="${esc(t('quick'))}">${ICON.eye}</button>
      <button class="wish ${wish.has(p.id) ? 'on' : ''}" type="button" data-wish="${p.id}" aria-label="${esc(t('wish_aria'))}" aria-pressed="${wish.has(p.id)}">${ICON.heart}</button>
    </div>
    <h3>${esc(pName(p))}</h3>
    <div class="meta">${t('cat_' + p.cat)} · ${weightText(p.w)}</div>
    <div class="price"><small>${t('est')}</small><b>${money(e.total)}</b></div>
    <div class="acts">
      <button class="btn btn-gold btn-sm" type="button" data-add="${p.id}" ${p.soldOut ? 'disabled' : ''}>${ICON.cartAdd}<span>${t('add_cart')}</span></button>
      <a class="btn btn-wa btn-sm btn-icon" href="${waLink(productMsg(p))}" target="_blank" rel="noopener" aria-label="${esc(t('enquire'))}">${ICON.wa}</a>
    </div>
  </article>`;
}
function renderFeatured() {
  const el = $('#featured'); if (!el) return;
  const vis = catalog.filter(p => !p.hidden);
  let list = vis.filter(p => p.featured);
  if (!list.length) list = FEATURED.map(id => vis.find(p => p.id === id)).filter(Boolean);
  if (!list.length) list = vis.slice(0, 4);
  el.innerHTML = list.slice(0, 4).map(productCard).join('');
  bindTilt(el);
}

/* =====================================================================
   SHOP
   ===================================================================== */
const shopState = { cat: 'all', q: '', sort: 'feat' };
function renderShop() {
  const grid = $('#shopGrid'); if (!grid) return;
  const vis = catalog.filter(p => !p.hidden);
  const counts = { all: vis.length }; CATS.forEach(c => { counts[c] = vis.filter(p => p.cat === c).length; });
  $('#cats').innerHTML = ['all', ...CATS].map(c => `<button class="cat" type="button" data-cat="${c}" aria-pressed="${shopState.cat === c}">${c === 'all' ? t('all') : t('cat_' + c)} <span class="n">${dg(counts[c])}</span></button>`).join('');
  const sortSel = $('#sort');
  sortSel.innerHTML = ['feat', 'low', 'high', 'light'].map(s => `<option value="${s}" ${shopState.sort === s ? 'selected' : ''}>${t('sort_' + s)}</option>`).join('');
  const q = shopState.q.trim().toLowerCase();
  let list = vis.filter(p => (shopState.cat === 'all' || p.cat === shopState.cat) &&
    (!q || [p.name.bn, p.name.en, I18N.bn['cat_' + p.cat], I18N.en['cat_' + p.cat]].some(s => String(s || '').toLowerCase().includes(q))));
  if (shopState.sort === 'low') list.sort((a, b) => estimate(a).total - estimate(b).total);
  if (shopState.sort === 'high') list.sort((a, b) => estimate(b).total - estimate(a).total);
  if (shopState.sort === 'light') list.sort((a, b) => a.w - b.w);
  grid.innerHTML = list.length ? list.map(productCard).join('')
    : `<div class="empty glass" style="grid-column:1/-1">${ICON.gem.replace('<svg', '<svg style="width:70px;height:70px;margin:0 auto 12px"')}<h3>${t('no_results')}</h3></div>`;
  $('#priceNote').textContent = t('price_note', { m: dg(CONFIG.making) }) + ' ' + t('photo_note');
  bindTilt(grid);
}
function bindShop() {
  if (!$('#shopGrid')) return;
  const hashCat = (location.hash || '').replace('#', '');
  if (CATS.includes(hashCat)) shopState.cat = hashCat;
  $('#cats').addEventListener('click', e => { const b = e.target.closest('[data-cat]'); if (b) { shopState.cat = b.dataset.cat; renderShop(); } });
  $('#search').addEventListener('input', e => { shopState.q = e.target.value; renderShop(); });
  $('#sort').addEventListener('change', e => { shopState.sort = e.target.value; renderShop(); });
}

/* quick view */
let qvState = { id: null, kt: null };
function openQV(id) {
  const p = prod(id); if (!p) return;
  qvState = { id, kt: qvState.id === id && qvState.kt ? qvState.kt : p.kt };
  renderQV();
  const d = $('#qvDlg'); d.showModal ? d.showModal() : d.setAttribute('open', '');
}
function renderQV() {
  const p = prod(qvState.id); if (!p) return;
  const e = estimate(p, qvState.kt);
  $('#qvBody').innerHTML = `<button class="tbtn dlg-x" type="button" data-close-dlg aria-label="${t('close')}">${ICON.x}</button>
    <div class="qv-grid">
      <div class="qv-art">${art(p.cat, p.gem)}${photo(p, 900)}<button class="wish ${wish.has(p.id) ? 'on' : ''}" type="button" data-wish="${p.id}" aria-label="${esc(t('wish_aria'))}" aria-pressed="${wish.has(p.id)}">${ICON.heart}</button>${p.img && p.credit ? `<span class="credit">${t('photo_by')}: ${esc(p.credit)}</span>` : ''}</div>
      <div>
        ${p.badge ? `<span class="tag custom">${t('b_' + p.badge)}</span>` : ''}
        <h3 style="margin-top:10px">${esc(pName(p))}</h3>
        <p>${t('cat_' + p.cat)}</p>
        <div class="lbl">${t('qv_kt')}</div>
        <div class="ktsel">${CARATS.map(k => `<button class="cat" type="button" data-qkt="${k}" aria-pressed="${qvState.kt === k}">${t(k)}</button>`).join('')}</div>
        <div class="qv-rows">
          <div class="r"><span>${t('qv_weight')}</span><span>${weightText(p.w)} · ${num(p.w * GRAM, 3)} ${t('gram')}</span></div>
          <div class="r"><span>${t('today_rate')}</span><span>${money(rateOf(qvState.kt))} / ${t('bhori')}</span></div>
          <div class="r"><span>${t('qv_gold')}</span><span>${money(e.gold)}</span></div>
          <div class="r"><span>${t('qv_mk', { m: dg(CONFIG.making) })}</span><span>${money(e.making)}</span></div>
        </div>
        <div class="qv-total"><span>${t('qv_total')}</span><b>${money(e.total)}</b></div>
        <div class="stack">
          <button class="btn btn-gold" type="button" data-add="${p.id}" data-kt="${qvState.kt}" ${p.soldOut ? 'disabled' : ''}>${ICON.cartAdd}<span>${t('add_cart')}</span></button>
          <a class="btn btn-wa" href="${waLink(productMsg(p, qvState.kt))}" target="_blank" rel="noopener">${ICON.wa}<span>${t('enquire')}</span></a>
        </div>
      </div>
    </div>`;
}

/* =====================================================================
   CART ACTIONS (shared)
   ===================================================================== */
function addProduct(pid, kt, fromEl) {
  const p = prod(pid);
  const base = { id: uid(), mode: 'bhori', g: '', mcu: 'pct', mc: String(CONFIG.making), name: '', qty: 1 };
  const same = p && PAGE !== 'admin' && cart.find(l => l.pid === pid && l.carat === (kt || p.kt));
  if (same) same.qty = Math.min(20, qtyOf(same) + 1);
  else if (p) cart.push(Object.assign(base, { pid, cat: p.cat, gem: p.gem, carat: kt || p.kt }, bhoriParts(p.w)));
  else cart.push(Object.assign(base, { pid: null, cat: 'custom', gem: 'diamond', carat: 'k22', b: '', a: '', r: '', p: '' }));
  saveCart();
  if (invoice) { invoice = null; LS.set('mj_invoice', null); }
  updateCartBadges();
  fly(fromEl);
  toast(t('added'));
  if (PAGE === 'cart' || PAGE === 'admin') renderCart();
}

/* =====================================================================
   CALCULATOR
   ===================================================================== */
function renderRateChips() {
  const el = $('#rateChips'); if (!el) return;
  el.innerHTML = `<span class="lbl" style="margin:0">${t('today_rate')}</span>` +
    CARATS.map(k => `<span class="rc"><span class="kt">${ktLabel(k)}</span><b>${money(rateOf(k))}</b></span>`).join('') +
    `<span class="grow"></span><span class="lockpill">${ICON.lock}<span>${t(PAGE === 'admin' ? 'official' : 'est_note')}</span></span>`;
}
function lineHTML(l) {
  if (PAGE !== 'admin') return lineRO(l);
  const c = calc(l);
  const kopts = CARATS.map(k => `<option value="${k}" ${l.carat === k ? 'selected' : ''}>${t(k)}</option>`).join('');
  const W = ['bhori', 'ana', 'rati', 'point'];
  const wIn = l.mode === 'gram'
    ? `<div class="in pad-u"><input type="text" inputmode="decimal" data-f="g" value="${esc(l.g)}" placeholder="0" aria-label="${t('gram')}"><span class="u">${t('gram')}</span></div>`
    : `<div class="wgrid">${['b', 'a', 'r', 'p'].map((f, i) => `<div class="in"><input type="text" inputmode="numeric" data-f="${f}" value="${esc(l[f])}" placeholder="0" aria-label="${t(W[i])}"><small>${t(W[i])}</small></div>`).join('')}</div>`;
  return `<div class="line glass ${c.tb ? '' : 'warn'}" data-id="${l.id}">
    <div class="line-h">
      ${lineThumb(l)}
      <div class="in"><input type="text" data-f="name" value="${esc(l.name)}" placeholder="${esc(lineName(Object.assign({}, l, { name: '' })))}" aria-label="${t('item_name')}"></div>
      <div class="in carat"><select data-f="carat" aria-label="${t('carat')}">${kopts}</select></div>
      <button class="x" type="button" data-del aria-label="${t('remove')}">${ICON.trash}</button>
    </div>
    <div class="line-b">
      <div><div class="lbl"><span>${t('weight')}</span><span class="seg" role="group" aria-label="${t('weight')}">
        <button type="button" data-mode="bhori" aria-pressed="${l.mode !== 'gram'}">${t('by_bhori')}</button><button type="button" data-mode="gram" aria-pressed="${l.mode === 'gram'}">${t('by_gram')}</button></span></div>${wIn}</div>
      <div><div class="lbl"><span>${t('making')}</span></div><div class="mc">
        <div class="in"><input type="text" inputmode="decimal" data-f="mc" value="${esc(l.mc)}" placeholder="0" aria-label="${t('making')}"></div>
        <div class="in"><select data-f="mcu" aria-label="${t('making')}"><option value="pct" ${l.mcu !== 'tk' ? 'selected' : ''}>${t('mc_pct')}</option><option value="tk" ${l.mcu === 'tk' ? 'selected' : ''}>${t('mc_tk')}</option></select></div></div></div>
    </div>
    <div class="line-f"><div class="parts">
      <span>${t('weight')}: <b data-o="w">${wOut(c)}</b></span><span>${t('gold_value')}: <b data-o="gold">${money(c.gold)}</b></span><span>${t('making')}: <b data-o="mk">${money(c.making)}</b></span></div>
      <span class="tot" data-o="tot">${money(c.total)}</span></div>
  </div>`;
}
const refThumbs = (refs) => Array.isArray(refs) && refs.length ? `<div class="refs">${refs.map((r, i) => `<button type="button" class="ref" data-ref="${i}"><img src="${r}" alt="${t('ref_h')} ${dg(i + 1)}"></button>`).join('')}</div>` : '';
function lineRO(l) {
  const c = calc(l);
  return `<div class="line ro glass ${c.tb ? '' : 'warn'}" data-id="${l.id}">
    <div class="line-h">
      ${lineThumb(l)}
      <div class="ro-name"><b>${esc(lineName(l))}${qtyTag(c.q)}</b><small>${t(l.carat)} · ${l.pid ? t('cat_' + l.cat) : t('custom_order') + (l.cat && l.cat !== 'custom' ? ' · ' + t('cat_' + l.cat) : '')}</small>${l.desc ? `<p class="ro-desc">${esc(l.desc)}</p>` : ''}${refThumbs(l.refs)}</div>
      <button class="x" type="button" data-del aria-label="${t('remove')}">${ICON.trash}</button>
    </div>
    <div class="qty-row"><span class="lbl">${t('qty')}</span><div class="qty" role="group" aria-label="${t('qty')}">
      <button type="button" data-qty="-1" aria-label="−" ${c.q <= 1 ? 'disabled' : ''}>−</button><b data-o="q">${dg(c.q)}</b><button type="button" data-qty="1" aria-label="+" ${c.q >= 20 ? 'disabled' : ''}>+</button></div>
      ${c.q > 1 ? `<small>${weightText(c.piece)} × ${dg(c.q)}</small>` : ''}</div>
    <div class="line-f"><div class="parts">
      <span>${t('weight')}: <b data-o="w">${wOut(c)}</b></span><span>${t('today_rate')}: <b>${money(c.rate)}</b></span><span>${t('gold_value')}: <b data-o="gold">${money(c.gold)}</b></span><span>${t('making')} (${pct(CONFIG.making)}): <b data-o="mk">${money(c.making)}</b></span></div>
      <span class="tot" data-o="tot">${money(c.total)}</span></div>
  </div>`;
}
const wOut = (c) => c.tb ? weightText(c.tb) + ' · ' + num(c.tb * GRAM, 3) + ' ' + t('gram') : `<span class="need">${t('need_w')}</span>`;
function renderCart() {
  const box = $('#cartList'); if (!box) return;
  box.innerHTML = cart.length ? cart.map(lineHTML).join('') :
    `<div class="empty glass">${ICON.cart.replace('<svg', '<svg style="width:76px;height:76px;margin:0 auto 12px"')}<h3 style="margin:0">${t('cart_empty')}</h3><p style="margin:6px 0 18px">${t('cart_empty2')}</p>
      <a class="btn btn-gold btn-sm" href="shop.html">${t('go_shop')}</a></div>`;
  renderSummary();
  if (PAGE === 'admin') document.dispatchEvent(new CustomEvent('mj:cart'));
}
function updateLine(id) {
  const l = cart.find(x => x.id === id), el = $(`.line[data-id="${id}"]`); if (!l || !el) return;
  const c = calc(l);
  el.classList.toggle('warn', !c.tb);
  $('[data-o="w"]', el).innerHTML = wOut(c);
  $('[data-o="gold"]', el).textContent = money(c.gold);
  $('[data-o="mk"]', el).textContent = money(c.making);
  $('[data-o="tot"]', el).textContent = money(c.total);
}
let lastGrand = '';
function renderSummary() {
  updateCartBadges();
  const rowsEl = $('#sumRows'); if (!rowsEl) return;
  const T = totals();
  const rows = [[t('items', { n: dg(cart.length) }), ''], [t('gold_total'), money(T.gold)], [t('making_total'), money(T.making)], [t('subtotal'), money(T.sub)]];
  if (T.d) rows.push([t('less_disc', { p: pct(T.d) }), '− ' + money(T.discAmt)]);
  if (T.v) rows.push([t('plus_vat', { p: pct(T.v) }), '+ ' + money(T.vatAmt)]);
  if (T.adv) rows.push([t('less_adv'), '− ' + money(T.adv)]);
  rowsEl.innerHTML = rows.map(r => `<div class="r"><span>${r[0]}</span><span>${r[1]}</span></div>`).join('');
  const g = money(T.grand), gv = $('#grandVal'); gv.textContent = g;
  if (g !== lastGrand) { gv.classList.remove('bump'); void gv.offsetWidth; gv.classList.add('bump'); lastGrand = g; }
  const s = invoice ? 4 : cart.length ? 2 : 1;
  const ro = $('#roNote'); if (ro) ro.textContent = t('ro_note');
  $$('#steps li').forEach(li => { const n = +li.dataset.s; li.classList.toggle('done', n < s); li.classList.toggle('active', n === s); });
}
function bindCart() {
  const box = $('#cartList'); if (!box) return;
  $$('[data-b]').forEach(i => { i.value = buyer[i.dataset.b] || ''; i.addEventListener('input', () => { buyer[i.dataset.b] = i.value; saveBuyer(); renderSummary(); }); });
  box.addEventListener('input', e => {
    const f = e.target.dataset.f; if (!f) return;
    const id = e.target.closest('.line').dataset.id, l = cart.find(x => x.id === id); if (!l) return;
    l[f] = e.target.value; saveCart(); if (f !== 'name') { updateLine(id); renderSummary(); }
  });
  box.addEventListener('change', e => {
    const f = e.target.dataset.f; if (f !== 'carat' && f !== 'mcu') return;
    const id = e.target.closest('.line').dataset.id, l = cart.find(x => x.id === id); if (!l) return;
    l[f] = e.target.value; saveCart(); updateLine(id); renderSummary();
  });
  box.addEventListener('click', e => {
    const line = e.target.closest('.line'); if (!line) return;
    const id = line.dataset.id;
    const qb = e.target.closest('[data-qty]');
    if (qb) { const l = cart.find(x => x.id === id); if (!l) return; l.qty = Math.min(20, Math.max(1, qtyOf(l) + +qb.dataset.qty)); if (l.qty === 20 && +qb.dataset.qty > 0) toast(t('qty_max')); saveCart(); renderCart(); updateCartBadges(); return; }
    const rb = e.target.closest('[data-ref]');
    if (rb) { const l = cart.find(x => x.id === id); if (l && l.refs) viewImg(l.refs[+rb.dataset.ref]); return; }
    if (e.target.closest('[data-del]')) {
      line.style.transition = 'opacity .35s, transform .35s'; line.style.opacity = '0'; line.style.transform = 'translateX(30px) scale(.97)';
      setTimeout(() => { cart = cart.filter(x => x.id !== id); saveCart(); renderCart(); }, 320);
      toast(t('removed')); return;
    }
    const m = e.target.closest('[data-mode]');
    if (m) {
      const l = cart.find(x => x.id === id);
      if (l && l.mode !== m.dataset.mode) {
        const tb = calc(l).tb; l.mode = m.dataset.mode;
        if (tb) { if (l.mode === 'gram') l.g = String(+(tb * GRAM).toFixed(3)); else Object.assign(l, bhoriParts(tb)); }
        saveCart(); renderCart();
      }
    }
  });
  const on = (id, fn) => { const el = $('#' + id); if (el) el.addEventListener('click', fn); };
  on('addCustom', e => addProduct(null, null, e.currentTarget));
  on('makeInv', e => makeInvoice(e));
  on('goPay', () => {
    if (!cart.length) { toast(t('t_empty'), true); return; }
    const T = totals(), bad = T.lines.findIndex(x => !x.tb);
    if (bad >= 0) { toast(t('t_noweight'), true); const el = $$('.line')[bad]; if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
    go('checkout.html');
  });
  on('orderWa', () => {
    if (!cart.length) { toast(t('t_empty'), true); return; }
    openWA(orderMsg());
  });
}
function invoiceNo(d) {
  const p = (n) => String(n).padStart(2, '0');
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', rnd = new Uint8Array(4); (window.crypto || window.msCrypto).getRandomValues(rnd);
  return 'MJ-' + String(d.getFullYear()).slice(2) + p(d.getMonth() + 1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds()) + '-' + Array.from(rnd, x => A[x % A.length]).join('');
}
function buildInvoice(pay, status) {
  if (!cart.length) { toast(t('t_empty'), true); return null; }
  const T = totals();
  const bad = cart.findIndex((l, i) => !T.lines[i].tb);
  if (bad >= 0) {
    toast(t('t_noweight'), true);
    const el = $$('.line')[bad]; if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); const inp = $('input[data-f="b"],input[data-f="g"]', el); if (inp) setTimeout(() => inp.focus({ preventScroll: true }), 500); }
    return null;
  }
  const now = new Date();
  return {
    no: invoiceNo(now), ts: now.getTime(), rateDate: official.date,
    buyer: { name: buyer.name.trim(), phone: buyer.phone.trim(), email: String(buyer.email || '').trim(), addr: buyer.addr.trim() },
    delivery: PAGE === 'pay' ? { method: payState.delivery, fee: T.ship } : { method: 'pickup', fee: 0 },
    plan: PAGE === 'pay' ? payState.plan : (pay ? 'full' : 'shop'),
    lines: cart.map((l, i) => Object.assign({ pid: l.pid, cat: l.cat, gem: l.gem, name: (l.name || '').trim(), desc: (l.desc || '').trim(), custom: !!l.custom, refs: Array.isArray(l.refs) ? l.refs.slice(0, 3) : [], carat: l.carat, mcu: PAGE === 'admin' ? l.mcu : 'pct', mc: PAGE === 'admin' ? l.mc : String(CONFIG.making) }, T.lines[i])),
    totals: { gold: T.gold, making: T.making, sub: T.sub, d: T.d, discAmt: T.discAmt, v: T.v, vatAmt: T.vatAmt, adv: T.adv, ship: T.ship || 0, grand: T.grand },
    pay: pay ? Object.assign({}, pay, { due: Math.max(Math.round(T.grand) - pay.amount, 0) }) : null,
    status: status || (!pay ? 'Not paid' : pay.method === 'cash' ? 'Cash at shop' : pay.method === 'cod' ? 'Cash on delivery' : pay.method === 'ssl' ? 'Awaiting payment' : 'Pending'),
    sync: sheetOn() ? 'pending' : 'off'
  };
}
function nameIn(l, lg) { const keep = lang; lang = lg; const n = lineName(l); lang = keep; return n; }
const r2 = (v) => Math.round(v * 100) / 100;
function orderDoc(I, source) {
  const rates = {}; CARATS.forEach(k => { rates[k] = rateOf(k); });
  return JSON.parse(JSON.stringify({
    id: I.no, lang, rateDate: I.rateDate, rates, making: CONFIG.making,
    customer: I.buyer,
    items: I.lines.map(l => ({ pid: l.pid || '', cat: l.cat || 'custom', gem: l.gem || '', name: l.name || '', desc: l.desc || '', custom: !!l.custom, qty: l.q || 1, refs: l.refs || [], title_bn: nameIn(l, 'bn'), title_en: nameIn(l, 'en'), carat: l.carat, mcu: l.mcu, mc: String(l.mc), tb: Math.round(l.tb * 10000) / 10000, rate: l.rate, gold: r2(l.gold), making: r2(l.making), total: r2(l.total) })),
    totals: Object.fromEntries(Object.entries(I.totals).map(([k, v]) => [k, r2(v)])),
    grand: Math.round(I.totals.grand),
    pay: I.pay ? { method: I.pay.method, amount: I.pay.amount, trx: I.pay.trx || '', sender: I.pay.sender || '', due: I.pay.due } : null,
    delivery: I.delivery || { method: 'pickup', fee: 0 }, plan: I.plan || 'full',
    status: I.status, lockUntil: lockValid() ? lockState.until : 0, source: source || 'web',
    uid: user && PAGE !== 'admin' ? user.uid : undefined
  }));
}
function rememberOrder(I) {
  const mine = LS.get('mj_my_orders', []).filter(x => x.no !== I.no);
  mine.unshift({ no: I.no, ts: I.ts, grand: Math.round(I.totals.grand), method: I.pay ? I.pay.method : '' });
  LS.set('mj_my_orders', mine.slice(0, 20));
}
function commitInvoice(inv, e, opt) {
  invoice = Object.assign(inv, { justPlaced: PAGE !== 'admin' });
  LS.set('mj_invoice', invoice);
  if (PAGE !== 'admin') { rememberOrder(inv); cart = []; saveCart(); updateCartBadges(); }
  if (sheetOn()) { outbox.push(orderPayload(invoice)); LS.set('mj_outbox', outbox); flushOutbox(true); }
  if (inv.pay) { payState.trx = ''; payState.sender = ''; payState.amount = ''; savePay(); }
  if (PAGE === 'pay') { lockState = null; LS.set('mj_lock', null); }
  renderSummary(); toast(inv.cloud ? t('order_placed') : t('t_inv'));
  burst(e && e.currentTarget);
  if (PAGE === 'admin' || (opt && opt.noNav)) return;
  setTimeout(() => go('invoice.html'), 750);
}
function makeInvoice(e, pay) {
  const inv = buildInvoice(pay); if (!inv) return;
  commitInvoice(inv, e);
}

/* =====================================================================
   INVOICE
   ===================================================================== */
const OPEN_ST = ['Verified', 'Delivered', 'Advance paid'];
function invLocked(I) {
  if (!I) return true;
  if (I.adminView) return false;
  if (I.cloud) return !(liveStatus && OPEN_ST.includes(liveStatus.status));   // only the shop's live status unlocks
  return !OPEN_ST.includes(I.status);
}
function lockUI() {
  const L = invLocked(invoice);
  ['printBtn', 'shareWa'].forEach(id => { const b = $('#' + id); if (b) { b.classList.toggle('is-locked', L); b.setAttribute('aria-disabled', L); b.title = L ? t('inv_lock_t') : ''; } });
}
function renderInvoice() {
  const host = $('#paperHost'); if (!host) return;
  const acts = $('#invActs');
  if (!invoice) {
    if (acts) acts.style.display = 'none';
    host.innerHTML = `<div class="empty glass" style="max-width:640px;margin:0 auto">${ICON.doc.replace('<svg', '<svg style="width:76px;height:76px;margin:0 auto 12px"')}
      <h3 style="margin:0">${t('inv_none')}</h3><p style="margin:6px 0 18px">${t('inv_none2')}</p><a class="btn btn-gold btn-sm" href="shop.html">${t('go_shop')}</a></div>`;
    return;
  }
  if (acts) acts.style.display = '';
  const I = invoice, T = I.totals, P = I.pay;
  const nm = (l) => l.name || (l.pid ? pName(prod(l.pid)) : t('cat_' + (l.cat || 'custom')));
  const diamond = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 L20 12 L12 22 L4 12 Z" fill="#c9a227"/></svg>';
  const payBlock = P ? `
      <div class="ppay">
        <div class="kv">
          <div><small>${t('pay_method')}</small><b>${t('m_' + P.method)}</b></div>
          ${P.trx ? `<div><small>${t('pay_ref')} (TrxID)</small><b class="mono">${esc(P.trx)}</b></div>` : ''}
          ${P.sender ? `<div><small>${t('pay_from')}</small><b>${esc(dg(P.sender))}</b></div>` : ''}
        </div>
        ${P.due > 0 ? `<div class="pqr"><img src="${CONFIG.qrPlain}" alt="Bangla QR — ${CONFIG.qrMerchant}"><b>BANGLA QR</b><small>${CONFIG.qrMerchant} · ${t('scan_due')}</small></div>` : ''}
      </div>` : '';
  const locked = invLocked(I);
  host.classList.toggle('locked', locked);
  lockUI();
  const lockCard = locked ? `<div class="inv-lock glass"><span class="ic">${ICON.lock}</span><h3>${t('inv_lock_h')}</h3>
      <p>${I.pay && I.pay.method === 'cod' ? t('cod_note') : I.pay && I.pay.method !== 'cash' ? t('inv_lock_p') : t('inv_lock_cash')}</p>
      <span class="vstat ${ST_CLS[I.status] || 'wait'}">${t(ST_KEY[I.status] || 'st_pending')}</span>
      ${I.pay && I.pay.method === 'ssl' && I.status === 'Awaiting payment' && sslOn ? `<button class="btn btn-gold" type="button" data-paynow>${ICON.lock}<span>${t('pay_now_btn', { a: money(I.pay.amount) })}</span></button>` : ''}
      <a class="btn btn-glass btn-sm" href="track.html?id=${encodeURIComponent(I.no)}">${ICON.shield}<span>${t('nav_track')}</span></a></div>
    <div class="lock-print">${t('inv_lock_print')} · ${I.no}</div>` : '';
  const placed = I.justPlaced ? `<div class="placed glass"><div class="placed-ic">${emblem({ sparkle: true })}</div>
      <div><h3>${t('placed_h')}</h3><p><span class="mono">${esc(I.no)}</span> · ${money(T.grand)}</p>
      <p class="hint">${I.buyer.email ? ICON.mail.replace('<svg', '<svg style="width:15px;height:15px;vertical-align:-3px;margin-right:5px"') + t('placed_mail', { m: esc(I.buyer.email) }) : t('placed_nomail')}</p></div>
      <button class="placed-x" type="button" data-unplace aria-label="×">${ICON.x}</button></div>` : '';
  if (I.justPlaced && !I.celebrated) { I.celebrated = true; LS.set('mj_invoice', I); setTimeout(celebrate, 350); }
  host.innerHTML = placed + lockCard + `<article class="paper" id="paper" ${locked ? 'aria-hidden="true" inert' : ''}>
    <div class="goldbar top"></div><div class="goldbar bottom"></div>
    <div class="wm">${emblem({ mono: true })}</div>
    <div class="wm-text"><span>MAA JEWELLERS</span><span>মা জুয়েলার্স</span></div>
    <div class="frame"></div>
    ${['c1', 'c2', 'c3', 'c4'].map(c => corner().replace('{c}', c)).join('')}
    <header class="ph">
      <div class="pbrand">${emblem({ mono: true })}<div><h2>${t('brand')}</h2><div class="en">MAA JEWELLERS</div>
        <p>${t('proprietor')}: ${t('owner')}</p><p>${t('address')}</p></div></div>
      <div class="ptitle"><h3>INVOICE</h3><div class="bn">${lang === 'bn' ? 'চালান · ক্যাশ মেমো' : 'Cash memo · চালান'}</div><span class="no">${t('inv_no')}: ${I.no}</span></div>
    </header>
    <div class="pdiv">${diamond}</div>
    <div class="pparty">
      <div class="wide"><small>${t('bill_to')}</small>${esc(I.buyer.name || '—')}</div>
      <div><small>${t('inv_date')}</small>${fdate(I.ts)}</div>
      <div><small>${t('inv_time')}</small>${ftime(I.ts)}</div>
      <div class="wide"><small>${t('address_l')}</small>${esc(I.buyer.addr || '—')}</div>
      <div><small>${t('mobile')}</small>${esc(I.buyer.phone ? dg(I.buyer.phone) : '—')}</div>
      <div><small>${t('rate_date')}</small>${fdate(I.rateDate)}</div>
      ${I.delivery ? `<div class="wide"><small>${t('delivery_l')}</small>${t(I.delivery.method === 'home' ? 'dl_home' : 'dl_pickup')}${I.buyer.email ? ' · ' + esc(I.buyer.email) : ''}</div>` : ''}
    </div>
    <div class="ptw"><table class="pt">
      <thead><tr><th>${t('th_sl')}</th><th>${t('th_item')}</th><th>${t('th_kt')}</th><th>${t('th_w')}</th><th>${t('th_rate')}</th><th>${t('th_mc')}</th><th>${t('th_amt')}</th></tr></thead>
      <tbody>${I.lines.map((l, i) => `<tr><td>${dg(i + 1)}</td><td><b>${esc(nm(l))}${qtyTag(l.q || l.qty || 1)}</b>${l.desc ? `<br><small class="idesc">${esc(l.desc)}</small>` : ''}</td><td>${t(l.carat)}</td>
        <td>${weightText(l.tb)}<br><small>${num(l.tb * GRAM, 3)} ${t('gram')}</small></td><td>${money(l.rate)}</td>
        <td>${money(l.making)}<br><small>${l.mcu === 'tk' ? money(toNum(l.mc)) + ' / ' + t('bhori') : pct(toNum(l.mc))}</small></td><td>${money(l.total)}</td></tr>`).join('')}</tbody>
    </table></div>
    <div class="pbottom">
      <div>
        ${P && (P.amount > 0 || OPEN_ST.includes(I.status)) ? `<div class="stamp">${OPEN_ST.includes(I.status) ? (P.due > 0 ? t('st_part') + ' ✓' : t('st_vstamp')) : (P.due > 0 ? t('st_part') : t('st_paid'))}</div>` : ''}
        <div class="pwords"><small>${t('in_words')}</small>${words(Math.round(T.grand))} ${t('taka_only')}</div>
        ${payBlock}
        <div class="pnote">${t('inv_note', { d: fdate(I.rateDate) })}</div>
      </div>
      <div class="ptot">
        <div class="r"><span>${t('gold_total')}</span><span>${money(T.gold)}</span></div>
        <div class="r"><span>${t('making_total')}</span><span>${money(T.making)}</span></div>
        <div class="r"><span>${t('subtotal')}</span><span>${money(T.sub)}</span></div>
        ${T.d ? `<div class="r"><span>${t('less_disc', { p: pct(T.d) })}</span><span>− ${money(T.discAmt)}</span></div>` : ''}
        ${T.v ? `<div class="r"><span>${t('plus_vat', { p: pct(T.v) })}</span><span>+ ${money(T.vatAmt)}</span></div>` : ''}
        ${T.adv ? `<div class="r"><span>${t('less_adv')}</span><span>− ${money(T.adv)}</span></div>` : ''}
        ${T.ship ? `<div class="r"><span>${t('delivery')}</span><span>+ ${money(T.ship)}</span></div>` : ''}
        <div class="g"><span>${t('grand')}</span><span>${money(T.grand)}</span></div>
        ${P ? `<div class="r paid"><span>${t('paid')} · ${t('m_' + P.method)}</span><span>${money(P.amount)}</span></div>
               <div class="r due"><span>${t('due')}</span><span>${money(P.due)}</span></div>` : ''}
      </div>
    </div>
    <div class="psign"><div>${t('sign_buyer')}</div><div class="seal">${emblem({ mono: true })}</div><div>${t('sign_seller')}</div></div>
    <div class="pthanks">✦ ${t('thanks')} ✦</div>
    <footer class="pfoot">
      <span><b>${t('phone')}:</b> ${dg(CONFIG.phoneShow)}</span><span><b>${t('whatsapp')}:</b> ${dg(CONFIG.whatsappShow)}</span>
      <span><b>bKash:</b> ${dg(fmtPhone(CONFIG.bkash))}</span><span><b>Nagad:</b> ${dg(fmtPhone(CONFIG.nagad))}</span><span><b>Bangla QR:</b> ${CONFIG.qrMerchant}</span>
    </footer>
  </article>`;
}
function bindInvoice() {
  if (!$('#paperHost')) return;
  $('#paperHost').addEventListener('click', e => {
    if (e.target.closest('[data-paynow]') && invoice) { const b = e.target.closest('[data-paynow]'); b.disabled = true; startSsl(invoice.no).then(ok => { if (!ok) b.disabled = false; }); return; }
    if (e.target.closest('[data-unplace]') && invoice) { invoice.justPlaced = false; LS.set('mj_invoice', invoice); renderInvoice(); }
  });
  const q = new URLSearchParams(location.search).get('pay');
  if (q) { setTimeout(() => toast(t(q === 'success' ? 'pay_ok' : q === 'cancelled' ? 'pay_cancel' : 'pay_failed'), q !== 'success'), 600); history.replaceState(null, '', location.pathname); }
  $('#printBtn').addEventListener('click', () => { if (invLocked(invoice)) { toast(t('inv_lock_t'), true); return; } window.print(); });
  $('#shareWa').addEventListener('click', () => { if (!invoice) return; if (invLocked(invoice)) { toast(t('inv_lock_t'), true); return; } openWA(invoiceMsg()); });
  addEventListener('beforeprint', () => { if (invLocked(invoice)) toast(t('inv_lock_print'), true); });
  $('#newSale').addEventListener('click', () => {
    if (!confirm(t('confirm_new'))) return;
    cart = []; invoice = null; buyer = { name: buyer.name, phone: buyer.phone, email: buyer.email || '', addr: buyer.addr, disc: '', vat: '', adv: '' };
    saveCart(); saveBuyer(); LS.set('mj_invoice', null); toast(t('t_new'));
    setTimeout(() => go('shop.html'), 500);
  });
}

/* =====================================================================
   WHATSAPP MESSAGES
   ===================================================================== */
function productMsg(p, kt) {
  const k = kt || p.kt, e = estimate(p, k);
  return `${t('wa_hi')}\n\n*${t('wa_enq')}:*\n✦ ${pName(p)} (${t('cat_' + p.cat)})\n${t('carat')}: ${t(k)}\n${t('weight')}: ${weightText(p.w)}\n${t('wa_est')}: ${money(e.total)}\n\n— ${t('wa_from')}`;
}
function orderMsg() {
  const T = totals();
  const lines = cart.map((l, i) => `${dg(i + 1)}. ${lineName(l)} — ${t(l.carat)}, ${weightText(T.lines[i].tb)} → ${money(T.lines[i].total)}`).join('\n');
  const who = [buyer.name, buyer.phone, buyer.addr].filter(Boolean).join(', ');
  return `*${t('brand')} — ${t('wa_order')}*\n\n${lines}\n\n${t('subtotal')}: ${money(T.sub)}${T.d ? `\n${t('less_disc', { p: pct(T.d) })}: − ${money(T.discAmt)}` : ''}${T.v ? `\n${t('plus_vat', { p: pct(T.v) })}: + ${money(T.vatAmt)}` : ''}${T.adv ? `\n${t('less_adv')}: − ${money(T.adv)}` : ''}\n*${t('grand')}: ${money(T.grand)}*${who ? `\n\n${t('bill_to')}: ${who}` : ''}\n\n— ${t('wa_from')}`;
}
function invoiceMsg() {
  const I = invoice, T = I.totals;
  const nm = (l) => l.name || (l.pid ? pName(prod(l.pid)) : t('cat_' + (l.cat || 'custom')));
  const lines = I.lines.map((l, i) => `${dg(i + 1)}. ${nm(l)} — ${t(l.carat)}, ${weightText(l.tb)} → ${money(l.total)}`).join('\n');
  const P = I.pay;
  const payTxt = P ? `\n${t('pay_method')}: ${t('m_' + P.method)}${P.trx ? ' · TrxID ' + P.trx : ''}\n${t('paid')}: ${money(P.amount)}\n${t('due')}: ${money(P.due)}` : '';
  return `*${t('brand')} — ${t('wa_inv')} ${I.no}*\n${t('inv_date')}: ${fdate(I.ts)}\n${I.buyer.name ? t('bill_to') + ': ' + I.buyer.name + '\n' : ''}\n${lines}\n\n*${t('grand')}: ${money(T.grand)}*\n${t('in_words')}: ${words(Math.round(T.grand))} ${t('taka_only')}${payTxt}\n\n— ${t('wa_from')}`;
}

/* =====================================================================
   PAYMENT — bKash · Nagad · Bangla QR · Cash
   ===================================================================== */
const METHODS = ['bkash', 'nagad', 'qr', 'cash'];
const ONLINE = ['ssl', 'bkash', 'nagad', 'qr'];
let sslOn = false, autoOn = false;
let payState = Object.assign({ method: 'bkash', plan: 'full', delivery: 'pickup', trx: '', sender: '' }, LS.get('mj_pay', {}));
if (!ONLINE.includes(payState.method)) payState.method = 'bkash';
if (!['full', 'advance', 'cod', 'shop'].includes(payState.plan)) payState.plan = 'full';
if (!['pickup', 'home'].includes(payState.delivery)) payState.delivery = 'pickup';
const savePay = () => LS.set('mj_pay', payState);
const fmtPhone = (n) => String(n).replace(/^(\d{5})(\d+)$/, '$1-$2');
function mlogo(m) {
  return { bkash: '<span class="mlogo bk">bKash</span>', nagad: '<span class="mlogo ng">Nagad</span>', qr: `<span class="mlogo qr">${ICON.qr}</span>`, cash: '<span class="mlogo cs">৳</span>', cod: `<span class="mlogo cs">${ICON.truck}</span>`, ssl: `<span class="mlogo ssl">${ICON.card}</span>` }[m] || '';
}
function payBadges() {
  return `<span class="acc-l">${ICON.lock}${t('we_accept')}</span>
    <span class="pb">${mlogo('bkash')}<span>${dg(fmtPhone(CONFIG.bkash))}</span></span>
    <span class="pb">${mlogo('nagad')}<span>${dg(fmtPhone(CONFIG.nagad))}</span></span>
    <span class="pb">${mlogo('qr')}<span>Bangla QR</span></span>
    ${sslOn ? `<span class="pb">${mlogo('ssl')}<span>SSLCommerz</span></span>` : ''}
    <span class="pb">${mlogo('cod')}<span>${t('m_cod')}</span></span>`;
}
/* which choices make sense for this cart */
function planOptions() {
  const o = ['full'];
  if (hasCustom()) o.push('advance');
  if (payState.delivery === 'home' && CONFIG.codOn) o.push('cod');
  if (payState.delivery === 'pickup') o.push('shop');
  return o;
}
function normalizePlan() {
  const o = planOptions();
  if (!o.includes(payState.plan)) payState.plan = 'full';
  if (payState.method === 'ssl' && !sslOn) payState.method = 'bkash';
  if (isMfs(payState.method) && mfsOver(totals())) payState.method = sslOn ? 'ssl' : 'qr';
}
const isMfs = (m) => m === 'bkash' || m === 'nagad';
const mfsOver = (T) => planOnline() && payAmount(T) > CONFIG.mfsMax;
/* free automatic check: ask the server to match this order's TrxID with the payment SMS the shop phone received */
const matchAsked = {};
function askMatch(no) {
  if (!no || matchAsked[no]) return; matchAsked[no] = true;
  fetch('/api/pay/match', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ orderId: no }), keepalive: true }).catch(() => {});
}
const planOnline = () => payState.plan === 'full' || payState.plan === 'advance';
function payAmount(T) {
  const g = Math.round(T.grand);
  if (payState.plan === 'advance') return Math.min(g, Math.round((g - T.ship) * CONFIG.advancePct / 100) + T.ship);
  return planOnline() ? g : 0;
}
function copyText(v) {
  if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(v).catch(() => fallbackCopy(v));
  return Promise.resolve(fallbackCopy(v));
}
function fallbackCopy(v) {
  const ta = document.createElement('textarea'); ta.value = v; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
  document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e) { /* ignore */ } ta.remove();
}
function payRef() { const d = new Date(); return 'MJ' + String(d.getDate()).padStart(2, '0') + String(d.getMonth() + 1).padStart(2, '0'); }
function trxFields(withSender) {
  return `<div class="fgrid">
    ${withSender ? `<div><label class="lbl" for="paySender">${t('sender')}</label><div class="in"><input id="paySender" data-p="sender" type="tel" inputmode="tel" autocomplete="tel" value="${esc(payState.sender)}" placeholder="${t('sender_ph')}"></div></div>` : ''}
    <div class="${withSender ? '' : 'full'}"><label class="lbl" for="payTrx">${t('trx')}</label><div class="in"><input id="payTrx" data-p="trx" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" value="${esc(payState.trx)}" placeholder="${t('trx_ph')}"></div></div>
  </div><p class="hint">${ICON.lock.replace('<svg', '<svg style="display:inline;width:13px;height:13px;vertical-align:-2px;margin-right:4px"')}${withSender && autoOn ? t('verify_auto') : t('verify_note')}</p>`;
}
function panelHTML(T) {
  const a = money(payAmount(T));
  const amtBox = `<div class="numbox"><div><small>${t('amount')}</small><b data-o="amt">${a}</b></div><button class="copy" type="button" data-copy-amt>${ICON.copy}<span>${t('copy')}</span></button></div>`;
  if (payState.plan === 'cod') return `<div class="pay-head cash">${mlogo('cod')}<div><h3>${t('plan_cod')}</h3><small>${t('plan_cod_d')}</small></div></div>
      <p class="co-note">${t('cod_note')}</p><div class="numbox"><div><small>${t('due')}</small><b>${money(T.grand)}</b></div></div>`;
  if (payState.plan === 'shop') return `<div class="pay-head cash">${mlogo('cash')}<div><h3>${t('plan_shop')}</h3><small>${t('address')}</small></div></div>
      <p class="co-note">${t('cash_note')}</p>
      <div class="stack" style="flex-direction:row;flex-wrap:wrap"><a class="btn btn-glass btn-sm" href="tel:${CONFIG.phone}">${ICON.phone}<span>${t('call')}</span></a><a class="btn btn-glass btn-sm" href="contact.html">${ICON.pin}<span>${t('nav_contact')}</span></a></div>`;
  const m = payState.method;
  if (m === 'ssl') return `<div class="pay-head ssl">${mlogo('ssl')}<div><h3>${t('ssl_h')}</h3><small>${t('ssl_secure')}</small></div></div>
      <p class="co-note">${t('ssl_p')}</p>
      <div class="ssl-logos">${['VISA', 'Mastercard', 'AMEX', 'bKash', 'Nagad', 'Rocket', 'Upay', 'DBBL Nexus', 'City Touch'].map(x => `<span class="tag">${x}</span>`).join('')}</div>
      <div class="numbox"><div><small>${t('amount')}</small><b data-o="amt">${a}</b></div></div>`;
  if (m === 'bkash' || m === 'nagad') {
    const n = m === 'bkash' ? CONFIG.bkash : CONFIG.nagad, ussd = m === 'bkash' ? '*247#' : '*167#';
    const steps = [t('mfs_s1', { app: t('m_' + m), ussd }), t('mfs_s2'), t('mfs_s3', { n: `<b>${dg(fmtPhone(n))}</b>` }), t('mfs_s4', { a: `<b data-o="amt">${a}</b>` }), t('mfs_s5', { r: `<b>${payRef()}</b>` }), t('mfs_s6')];
    return `<div class="pay-head ${m}">${mlogo(m)}<div><h3>${t('m_' + m)} · ${t('pay_send_money')}</h3><small>${t('secure')}</small></div></div>
      <div class="numgrid">
        <div class="numbox"><div><small>${t('send_to')}</small><b>${dg(fmtPhone(n))}</b></div><button class="copy" type="button" data-copy="${n}">${ICON.copy}<span>${t('copy')}</span></button></div>
        ${amtBox}
      </div>
      <ol class="howto">${steps.map(x => `<li><span>${x}</span></li>`).join('')}</ol>
      ${trxFields(true)}`;
  }
  const steps = [t('qr_s1'), t('qr_s2'), t('qr_s3'), t('qr_s4', { a: `<b data-o="amt">${a}</b>` }), t('qr_s5')];
  return `<div class="pay-head qr">${mlogo('qr')}<div><h3>${t('m_qr')}</h3><small>${t('qr_bank')}</small></div></div>
      <div class="qr-wrap">
        <div class="qr-img"><img src="${CONFIG.qrImg}" alt="Bangla QR — ${CONFIG.qrMerchant}" width="600" height="780"></div>
        <div class="stack">
          <div class="numbox"><div><small>${t('qr_merchant')}</small><b style="font-size:19px">${CONFIG.qrMerchant}</b><small>TID: ${CONFIG.qrTid} · PARSHURAM</small></div></div>
          ${amtBox}
          <a class="btn btn-glass btn-sm" href="${CONFIG.qrPoster}" download="maa-jewellers-bangla-qr.jpg">${ICON.download}<span>${t('dl_qr')}</span></a>
          <div><div class="lbl">${t('qr_accept')}</div><div class="apps">${['Bangla QR', 'Cellfin', 'NPSB', 'VISA', 'Mastercard', 'UnionPay', 'TakaPay', 'mCash', 'Agrani Bank'].map(x => `<span class="tag">${x}</span>`).join('')}</div></div>
        </div>
      </div>
      <ol class="howto">${steps.map(x => `<li><span>${x}</span></li>`).join('')}</ol>
      ${trxFields(false)}`;
}
function confirmLabel(T) {
  if (payState.plan === 'cod') return t('place_cod');
  if (payState.plan === 'shop') return t('place_shop');
  if (payState.method === 'ssl') return t('pay_ssl_btn', { a: money(payAmount(T)) });
  return t('confirm_pay');
}
function coSummaryHTML(T) {
  const amt = payAmount(T), due = Math.max(Math.round(T.grand) - amt, 0);
  const rows = [[t('subtotal'), money(T.sub)]];
  if (T.d) rows.push([t('less_disc', { p: pct(T.d) }), '− ' + money(T.discAmt)]);
  if (T.v) rows.push([t('plus_vat', { p: pct(T.v) }), '+ ' + money(T.vatAmt)]);
  if (T.adv) rows.push([t('less_adv'), '− ' + money(T.adv)]);
  rows.push([t('delivery'), T.ship ? '+ ' + money(T.ship) : t('free')]);
  return `<h3>${t('order_sum')} <small class="cnt">${t('items_n', { n: dg(cart.reduce((s, l) => s + qtyOf(l), 0)) })}</small></h3>
    <div class="co-items">${cart.map((l, i) => `<div class="co-it">${lineThumb(l)}<div class="meta"><b>${esc(lineName(l))}${qtyTag(T.lines[i].q)}</b><small>${t(l.carat)} · ${weightText(T.lines[i].tb)}</small></div><span>${money(T.lines[i].total)}</span></div>`).join('')}</div>
    <div class="sumrows">${rows.map(r => `<div class="r"><span>${r[0]}</span><span>${r[1]}</span></div>`).join('')}</div>
    <div class="grand"><span>${t('grand')}</span><span>${money(T.grand)}</span></div>
    <div class="paysplit"><div><small>${t('pay_now')}</small><b data-o="paynow">${money(amt)}</b></div><div><small>${t('due')}</small><b data-o="due">${money(due)}</b></div></div>
    <div class="stack">
      <button class="btn btn-gold btn-lg" type="button" id="confirmPay">${payState.method === 'ssl' && planOnline() ? ICON.lock : ICON.check}<span>${confirmLabel(T)}</span></button>
      ${planOnline() && payState.method !== 'ssl' ? `<button class="btn btn-wa" type="button" id="sendProof">${ICON.wa}<span>${t('send_proof')}</span></button>` : ''}
      <a class="btn btn-glass" href="cart.html">${ICON.edit}<span>${t('edit_cart')}</span></a>
    </div>
    <p class="trust">${ICON.shield}<span>${t('ssl_secure')}</span></p>`;
}
function tile(group, val, on, icon, title, sub, extra) {
  return `<button type="button" class="tile ${on ? 'on' : ''}" data-${group}="${val}" aria-pressed="${on}">${icon ? `<span class="ti">${icon}</span>` : ''}<span class="tt"><b>${title}</b><small>${sub}</small></span>${extra || ''}<i class="tick">${ICON.check}</i></button>`;
}
function renderCheckout() {
  const host = $('#checkout'); if (!host) return;
  normalizePlan();
  const T = totals();
  if (!cart.length || T.lines.some(x => !x.tb)) {
    const empty = !cart.length;
    host.innerHTML = `<div class="empty glass" style="max-width:640px;margin:0 auto">${ICON.lock.replace('<svg', '<svg style="width:70px;height:70px;margin:0 auto 12px"')}
      <h3 style="margin:0">${empty ? t('pay_empty') : t('pay_noweight')}</h3><p style="margin:6px 0 18px">${t('pay_empty2')}</p>
      <a class="btn btn-gold btn-sm" href="${empty ? 'shop.html' : 'cart.html'}">${empty ? t('go_shop') : t('nav_cart')}</a></div>`;
    return;
  }
  ensureLock();
  const plans = planOptions();
  const planTile = (p) => tile('plan', p, payState.plan === p, { full: ICON.card, advance: ICON.coins, cod: ICON.truck, shop: ICON.store }[p],
    p === 'advance' ? t('plan_adv', { p: pct(CONFIG.advancePct) }) : t('plan_' + p), t('plan_' + (p === 'advance' ? 'adv' : p) + '_d'));
  const methods = (sslOn ? ['ssl'] : []).concat(['bkash', 'nagad', 'qr']);
  const over = mfsOver(T);
  host.innerHTML = `<div class="lockbar glass" id="lockBar"><span class="ic">${ICON.lock}</span><div><b>${t('lock_h')}</b><small>${t('lock_d', { m: dg(CONFIG.lockMinutes) })}</small></div>
      <div class="lock-r"><span class="lock-t" id="lockT">--:--</span><small>${t('lock_left')}</small></div><div class="lock-prog"><i id="lockP"></i></div></div>
    <div class="co-grid">
    <div class="stack" style="gap:20px">
      ${fbMod ? (user ? `<div class="acc-chip glass"><span class="av">${user.photoURL ? `<img src="${esc(user.photoURL)}" alt="" referrerpolicy="no-referrer">` : esc(initialOf(user))}</span><span>${t('acc_signed', { e: esc(user.email || '') })}</span><a href="account.html">${t('nav_account')} →</a></div>`
        : `<div class="acc-chip glass hint">${ICON.user}<span>${t('acc_hint_co')}</span><a class="btn btn-glass btn-sm" href="account.html?next=checkout.html">${t('acc_signin_btn')}</a></div>`) : ''}
      <div class="co-card glass"><h3 class="co-h"><i>${dg(1)}</i>${t('co_s1')}</h3><div class="fgrid">
        <div><label class="lbl" for="cName">${t('buyer_name')} *</label><div class="in"><input id="cName" data-b="name" type="text" autocomplete="name" value="${esc(buyer.name)}"></div></div>
        <div><label class="lbl" for="cPhone">${t('buyer_phone')} *</label><div class="in"><input id="cPhone" data-b="phone" type="tel" inputmode="tel" autocomplete="tel" value="${esc(buyer.phone)}"></div></div>
        <div class="full"><label class="lbl" for="cEmail">${t('buyer_email')}</label><div class="in ico">${ICON.mail}<input id="cEmail" data-b="email" type="email" inputmode="email" autocomplete="email" value="${esc(buyer.email || '')}" placeholder="name@gmail.com"></div><p class="hint">${t('email_hint')}</p></div>
        <div class="full"><label class="lbl" for="cAddr">${t('buyer_addr')}${payState.delivery === 'home' ? ' *' : ''}</label><div class="in"><input id="cAddr" data-b="addr" type="text" autocomplete="street-address" value="${esc(buyer.addr)}"></div></div>
      </div></div>
      <div class="co-card glass"><h3 class="co-h"><i>${dg(2)}</i>${t('co_s2')}</h3><div class="tiles two">
        ${tile('dlv', 'pickup', payState.delivery === 'pickup', ICON.store, t('dl_pickup'), t('dl_pickup_d'))}
        ${tile('dlv', 'home', payState.delivery === 'home', ICON.truck, t('dl_home'), t('dl_home_d', { f: CONFIG.deliveryFee ? money(CONFIG.deliveryFee) : t('free') }))}
      </div></div>
      <div class="co-card glass"><h3 class="co-h"><i>${dg(3)}</i>${t('co_s3')}</h3>
        ${hasCustom() ? `<p class="co-hint">${ICON.coins}<span>${t('adv_hint', { p: pct(CONFIG.advancePct) })}</span></p>` : ''}
        <div class="tiles ${plans.length > 2 ? 'three' : 'two'}">${plans.map(planTile).join('')}</div>
      </div>
      ${planOnline() ? `<div class="co-card glass"><h3 class="co-h"><i>${dg(4)}</i>${t('co_s4')}</h3>
        <div class="methods" role="radiogroup" aria-label="${t('m_h')}">${methods.map(m => { const off = isMfs(m) && over; return `<div class="method ${m === 'ssl' ? 'feat' : ''} ${off ? 'off' : ''}"><input type="radio" name="pm" id="pm_${m}" value="${m}" ${payState.method === m ? 'checked' : ''} ${off ? 'disabled' : ''}><label for="pm_${m}">${mlogo(m)}<b>${t('m_' + m)}</b><small>${off ? t('mfs_max', { m: money(CONFIG.mfsMax) }) : t('m_' + m + '_d')}</small></label></div>`; }).join('')}</div>
        ${over ? `<p class="co-note mfs-lim">${ICON.shield}<span>${t('mfs_limit', { m: money(CONFIG.mfsMax) })}</span></p>` : ''}
      </div>` : ''}
      <div class="co-card glass" id="coPanel">${panelHTML(T)}</div>
    </div>
    <aside class="summary glass" id="coSum">${coSummaryHTML(T)}</aside>
  </div>`;
  tickLock();
}
function updatePayAmounts() {
  const T = totals(), amt = payAmount(T), due = Math.max(Math.round(T.grand) - amt, 0);
  $$('[data-o="amt"]').forEach(el => { el.textContent = money(amt); });
  const pn = $('[data-o="paynow"]'); if (pn) pn.textContent = money(amt);
  const du = $('[data-o="due"]'); if (du) du.textContent = money(due);
}
function focusField(sel) { const f = $(sel); if (f) { f.scrollIntoView({ behavior: 'smooth', block: 'center' }); f.focus({ preventScroll: true }); } }
function payValid(T) {
  const ph = String(buyer.phone || '').replace(/[০-৯]/g, d => '০১২৩৪৫৬৭৮৯'.indexOf(d)).replace(/\D/g, '');
  if (!buyer.name.trim() || ph.length < 10) { toast(t('need_contact'), true); focusField(!buyer.name.trim() ? '#cName' : '#cPhone'); return false; }
  const em = String(buyer.email || '').trim();
  if (em && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)) { toast(t('bad_email'), true); focusField('#cEmail'); return false; }
  if (payState.delivery === 'home' && String(buyer.addr || '').trim().length < 8) { toast(t('need_addr'), true); focusField('#cAddr'); return false; }
  if (planOnline() && !(payAmount(T) > 0)) { toast(t('t_amt'), true); return false; }
  if (isMfs(payState.method) && mfsOver(T)) { toast(t('mfs_limit', { m: money(CONFIG.mfsMax) }), true); return false; }
  if (planOnline() && payState.method !== 'ssl' && !/^[A-Za-z0-9]{6,20}$/.test(String(payState.trx).trim())) { toast(t('t_trx'), true); focusField('#payTrx'); return false; }
  return true;
}
function currentPay(T) {
  if (payState.plan === 'cod') return { method: 'cod', methodLabel: 'Cash on delivery', amount: 0, trx: '', sender: '', plan: 'cod' };
  if (payState.plan === 'shop') return { method: 'cash', methodLabel: I18N.en.m_cash, amount: 0, trx: '', sender: '', plan: 'shop' };
  const ssl = payState.method === 'ssl';
  return { method: payState.method, methodLabel: ssl ? 'SSLCommerz' : I18N.en['m_' + payState.method], amount: payAmount(T), plan: payState.plan,
    trx: ssl ? '' : String(payState.trx || '').trim().toUpperCase(), sender: ssl ? '' : String(payState.sender || '').trim() };
}
function payMsg() {
  const T = totals(), P = currentPay(T), due = Math.max(Math.round(T.grand) - P.amount, 0);
  const lines = cart.map((l, i) => `${dg(i + 1)}. ${lineName(l)}${qtyTag(T.lines[i].q)} — ${t(l.carat)}, ${weightText(T.lines[i].tb)} → ${money(T.lines[i].total)}${l.desc ? '\n   ' + l.desc : ''}`).join('\n');
  const who = [buyer.name, buyer.phone, buyer.addr].filter(Boolean).join(', ');
  return `*${t('brand')} — ${t('wa_pay')}*\n\n${t('pay_method')}: ${t('m_' + P.method)}\n${t('amount')}: ${money(P.amount)}${P.trx ? `\nTrxID: ${P.trx}` : ''}${P.sender ? `\n${t('pay_from')}: ${P.sender}` : ''}\n${t('delivery_l')}: ${t(payState.delivery === 'home' ? 'dl_home' : 'dl_pickup')}\n${t('grand')}: ${money(T.grand)}\n${t('due')}: ${money(due)}\n\n${lines}${who ? `\n\n${t('bill_to')}: ${who}` : ''}\n\n— ${t('wa_from')}`;
}
/* SSLCommerz: the server (api/pay/init) re-checks the price and opens a payment session */
async function startSsl(orderId) {
  let why = 'offline';
  try {
    const r = await fetch('/api/pay/init', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ orderId }) });
    const j = await r.json().catch(() => ({}));
    if (r.ok && j.url && (/^https:\/\//.test(j.url) || location.hostname === 'localhost')) { toast(t('redirecting')); location.href = j.url; return true; }
    why = String(j.reason || j.error || r.status).slice(0, 80);
  } catch (e) { /* offline */ }
  toast(t('ssl_fail') + ' · ' + why, true);
  return false;
}
function loadSslConfig() {
  return fetch('/api/pay/config', { cache: 'no-store' }).then(r => r.ok ? r.json() : null).then(j => { sslOn = !!(j && j.ssl); autoOn = !!(j && j.auto); }).catch(() => { sslOn = false; autoOn = false; })
    .then(() => { if (PAGE === 'pay') { if (sslOn && !LS.get('mj_pay', null)) payState.method = 'ssl'; renderCheckout(); } if (PAGE === 'invoice') renderInvoice(); const f = $('#footAccept'); if (f) f.innerHTML = payBadges(); });
}
function bindCheckout() {
  const host = $('#checkout'); if (!host) return;
  const rerender = () => { savePay(); renderCheckout(); };
  host.addEventListener('change', e => {
    if (e.target.name === 'pm') { payState.method = e.target.value; rerender(); }
  });
  host.addEventListener('input', e => {
    if (e.target.dataset.b) { buyer[e.target.dataset.b] = e.target.value; saveBuyer(); return; }
    const f = e.target.dataset.p; if (!f) return;
    payState[f] = e.target.value; savePay();
  });
  host.addEventListener('click', e => {
    const dv = e.target.closest('[data-dlv]'); if (dv) { payState.delivery = dv.dataset.dlv; rerender(); return; }
    const pl = e.target.closest('[data-plan]'); if (pl) { payState.plan = pl.dataset.plan; rerender(); return; }
    const cb = e.target.closest('#confirmPay');
    if (cb) {
      const T = totals(); if (!payValid(T)) return;
      const pay = currentPay(T), ssl = pay.method === 'ssl';
      const lbl = $('span', cb), old = lbl.textContent;
      if (fbMod) {
        const inv = buildInvoice(pay); if (!inv) return;
        cb.disabled = true; lbl.textContent = t('placing');
        fbMod.placeOrder(orderDoc(inv)).then(async r => {
          if (r && r.dup) { cb.disabled = false; lbl.textContent = old; toast(t('t_dup'), true); focusField('#payTrx'); return; }
          if (r && r.ok) { inv.cloud = true; if (pay.trx) askMatch(inv.no); }
          else { const q = LS.get('mj_fb_outbox', []); q.push(orderDoc(inv)); LS.set('mj_fb_outbox', q); toast(/permission/.test((r && r.error) || '') ? t('order_denied') : t('order_saved_local'), true); }
          if (ssl && inv.cloud) {
            commitInvoice(inv, { currentTarget: cb }, { noNav: true }); lbl.textContent = t('redirecting');
            if (!(await startSsl(inv.no))) setTimeout(() => go('invoice.html'), 1200);
            return;
          }
          cb.disabled = false; lbl.textContent = old;
          commitInvoice(inv, { currentTarget: cb });
        });
        return;
      }
      const go2 = () => makeInvoice({ currentTarget: cb }, pay);
      if (!sheetOn() || !pay.trx) { go2(); return; }
      cb.disabled = true; lbl.textContent = t('checking');
      sheetGet({ action: 'checkTrx', trx: pay.trx }).then(r => {
        if (r && r.used) { toast(t('t_dup'), true); focusField('#payTrx'); return false; }
        return true;
      }).catch(() => true).then(ok => { cb.disabled = false; lbl.textContent = old; if (ok) go2(); });
      return;
    }
    if (e.target.closest('#sendProof')) { const T = totals(); if (!payValid(T)) return; openWA(payMsg()); }
  });
  setInterval(tickLock, 1000); tickLock();
}
function tickLock() {
  const el = $('#lockT'); if (!el || !lockState) return;
  const left = lockState.until - Date.now();
  if (left <= 0) { ensureLock(true); toast(t('lock_exp')); renderCheckout(); return; }
  const m = Math.floor(left / 60000), sec = Math.floor(left % 60000 / 1000);
  el.textContent = dg(String(m).padStart(2, '0') + ':' + String(sec).padStart(2, '0'));
  const pr = $('#lockP'); if (pr) pr.style.width = (left / (lockState.until - lockState.at) * 100).toFixed(2) + '%';
  $('#lockBar').classList.toggle('low', left < 120000);
}
function renderPayCards() {
  const el = $('#payCards'); if (!el) return;
  const mfs = (m, n) => `<article class="paycard glass tilt reveal in">
      <div class="pay-head ${m}">${mlogo(m)}<div><h3>${t('m_' + m)}</h3><small>${t('pay_send_money')} · ${t('m_' + m + '_d')}</small></div></div>
      <div class="numbox"><div><small>${t('send_to')}</small><b>${dg(fmtPhone(n))}</b></div><button class="copy" type="button" data-copy="${n}">${ICON.copy}<span>${t('copy')}</span></button></div>
      <a class="btn btn-glass btn-sm" href="checkout.html">${t('pay_go')}${ICON.arrow}</a>
    </article>`;
  el.innerHTML = mfs('bkash', CONFIG.bkash) + mfs('nagad', CONFIG.nagad) + `
    <article class="paycard qrcard glass tilt reveal in">
      <div class="qr-mini"><img src="${CONFIG.qrImg}" alt="Bangla QR — ${CONFIG.qrMerchant}" width="600" height="780" loading="lazy"></div>
      <div class="stack" style="gap:8px">
        <div class="pay-head qr" style="margin:0">${mlogo('qr')}<div><h3>${t('m_qr')}</h3><small>${t('qr_bank')}</small></div></div>
        <p style="margin:0;color:var(--muted);font-size:14px">${t('pay_any_app')}</p>
        <a class="btn btn-glass btn-sm" href="${CONFIG.qrPoster}" download="maa-jewellers-bangla-qr.jpg">${ICON.download}<span>${t('dl_qr')}</span></a>
      </div>
    </article>`;
  bindTilt(el);
}

/* =====================================================================
   GOOGLE SHEET BACKEND — order records + TrxID verification
   ===================================================================== */
const sheetOn = () => /^https?:\/\/\S+$/.test(CONFIG.sheetUrl || '');
let outbox = LS.get('mj_outbox', []); if (!Array.isArray(outbox)) outbox = [];
async function sheetGet(params) {
  const r = await fetch(CONFIG.sheetUrl + (CONFIG.sheetUrl.includes('?') ? '&' : '?') + new URLSearchParams(params), { cache: 'no-store' });
  if (!r.ok) throw new Error(r.status);
  return r.json();
}
async function sheetPost(obj, keepalive) {
  /* text/plain body = no CORS pre-flight, which Apps Script cannot answer */
  const r = await fetch(CONFIG.sheetUrl, { method: 'POST', body: JSON.stringify(obj), keepalive: !!keepalive, headers: { 'Content-Type': 'text/plain;charset=utf-8' } });
  if (!r.ok) throw new Error(r.status);
  return r.json();
}
function orderPayload(I) {
  const en = (k) => I18N.en[k] || k;
  return {
    type: 'order', id: I.no, ts: I.ts, lang, rateDate: I.rateDate,
    customer: I.buyer, delivery: I.delivery, plan: I.plan, status: I.status,
    items: I.lines.map(l => ({
      name: l.name || (l.pid ? (prod(l.pid) || { name: {} }).name.en || '' : en('cat_' + (l.cat || 'custom'))),
      carat: en(l.carat), weight: weightTextEn(l.tb), grams: +(l.tb * GRAM).toFixed(3),
      rate: Math.round(l.rate), making: Math.round(l.making), total: Math.round(l.total), qty: l.q || 1, desc: l.desc || '', photos: (l.refs || []).length
    })),
    totals: I.totals,
    pay: I.pay ? Object.assign({}, I.pay, { methodLabel: en('m_' + I.pay.method) }) : null
  };
}
function weightTextEn(tb) { const keep = lang; lang = 'en'; const s = weightText(tb); lang = keep; return s; }
let flushing = false;
async function flushOutbox(keepalive) {
  if (!sheetOn() || flushing || !outbox.length) return;
  flushing = true;
  try {
    for (const p of outbox.slice()) {
      try {
        const r = await sheetPost(p, keepalive);
        if (r && r.ok) {
          outbox = outbox.filter(x => x.id !== p.id); LS.set('mj_outbox', outbox);
          if (invoice && invoice.no === p.id) { invoice.sync = 'saved'; if (r.status) invoice.status = r.status; invoice.checkedAt = Date.now(); LS.set('mj_invoice', invoice); renderVerify(); renderInvoice(); }
        }
      } catch (e) {
        if (invoice && invoice.no === p.id) { invoice.sync = 'failed'; LS.set('mj_invoice', invoice); renderVerify(); }
        break;                                    // offline — try again later
      }
    }
  } finally { flushing = false; }
}
async function checkStatus(manual) {
  if (!sheetOn() || !invoice || outbox.some(x => x.id === invoice.no)) return;
  const btn = $('#verNow'); if (btn && manual) { btn.disabled = true; $('span', btn).textContent = t('checking'); }
  try {
    const r = await sheetGet({ action: 'status', order: invoice.no });
    if (r && r.ok && r.status) {
      const changed = invoice.status !== r.status;
      invoice.status = r.status; invoice.sync = 'saved'; invoice.checkedAt = Date.now(); LS.set('mj_invoice', invoice);
      renderVerify(); if (changed) { renderInvoice(); if (OPEN_ST.includes(r.status)) { burst($('#paperHost')); toast(t('inv_unlocked')); } }
    }
  } catch (e) { /* offline */ }
  finally { const b = $('#verNow'); if (b) { b.disabled = false; $('span', b).textContent = t('ver_check'); } }
}
const ST_KEY = { 'Awaiting payment': 'st_await', 'Cash on delivery': 'st_cod', 'Advance paid': 'st_adv', 'Pending': 'st_pending', 'Verified': 'st_verified', 'Amount mismatch': 'st_mismatch', 'Duplicate TrxID': 'st_dup', 'Cash at shop': 'st_cash', 'Not paid': 'st_notpaid', 'Rejected': 'st_rejected', 'Delivered': 'st_delivered' };
const ST_CLS = { 'Advance paid': 'ok', 'Awaiting payment': 'wait', 'Cash on delivery': 'wait', 'Verified': 'ok', 'Delivered': 'ok', 'Amount mismatch': 'bad', 'Duplicate TrxID': 'bad', 'Rejected': 'bad', 'Pending': 'wait' };
function renderVerify() {
  const el = $('#verifyBox'); if (!el) return;
  if (!invoice) { el.style.display = 'none'; return; }
  el.style.display = '';
  if (invoice.cloud) { el.classList.add('trk-host'); el.innerHTML = trackerHTML(invoice.no, liveStatus || { status: invoice.status }); return; }
  const st = invoice.status || (invoice.pay ? 'Pending' : 'Not paid');
  const sync = sheetOn() ? (outbox.some(x => x.id === invoice.no) ? (invoice.sync === 'failed' ? 'failed' : 'pending') : 'saved') : 'off';
  const canCheck = sheetOn() && invoice.pay && invoice.pay.method !== 'cash' && sync === 'saved';
  el.innerHTML = `<div class="vh"><span class="ic">${ICON.shield}</span><div><b>${t('ver_h')}</b>
      <small class="sync ${sync}">${t('sync_' + sync)}${invoice.checkedAt && sync === 'saved' ? ' · ' + t('last_check', { t: ftime(invoice.checkedAt) }) : ''}</small></div></div>
    <span class="vstat ${ST_CLS[st] || ''}">${t(ST_KEY[st] || 'st_pending')}</span>
    ${canCheck ? `<button class="btn btn-glass btn-sm" type="button" id="verNow">${ICON.reset}<span>${t('ver_check')}</span></button>` : ''}
    ${invoice.pay && invoice.pay.method !== 'cash' ? `<p class="hint" style="flex-basis:100%;margin:0">${t('ver_note')}</p>` : ''}`;
}
function bindVerify() {
  const el = $('#verifyBox'); if (!el) return;
  el.addEventListener('click', e => { if (e.target.closest('#verNow')) checkStatus(true); });
  if (sheetOn()) {
    flushOutbox().then(() => checkStatus());
    setInterval(() => { if (invoice && ['Pending', 'Amount mismatch'].includes(invoice.status)) checkStatus(); }, 30000);
  }
}

/* =====================================================================
   CONTACT
   ===================================================================== */
function bindContact() {
  const f = $('#contactForm'); if (!f) return;
  const map = $('#mapFrame'); if (map) map.src = 'https://www.google.com/maps?q=' + encodeURIComponent(CONFIG.mapQuery) + '&output=embed';
  $$('[data-map]').forEach(a => { a.href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(CONFIG.mapQuery); });
  f.addEventListener('submit', e => {
    e.preventDefault();
    const name = $('#cfName').value.trim(), phone = $('#cfPhone').value.trim(), msg = $('#cfMsg').value.trim();
    const topic = $('#cfTopic').selectedOptions[0].textContent;
    if (!name || !msg) { toast(t('t_fill'), true); return; }
    openWA(`${t('wa_hi')}\n\n*${t('f_interest')}:* ${topic}\n*${t('f_name')}:* ${name}${phone ? `\n*${t('f_phone')}:* ${phone}` : ''}\n\n${msg}\n\n— ${t('wa_from')}`);
  });
}
function renderContactOptions() {
  const s = $('#cfTopic'); if (!s) return;
  const v = s.value;
  s.innerHTML = ['int_buy', 'int_order', 'int_bridal', 'int_rate', 'int_other'].map(k => `<option value="${k}">${t(k)}</option>`).join('');
  if (v) s.value = v;
}

/* =====================================================================
   EFFECTS
   ===================================================================== */
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const LITE = document.documentElement.classList.contains('lite');
const raf1 = (fn) => { let q = 0, a; return (...args) => { a = args; if (!q) { q = 1; requestAnimationFrame(() => { q = 0; fn(...a); }); } }; };
const canVT = 'CSSViewTransitionRule' in window || (window.CSS && CSS.supports && CSS.supports('view-transition-name: a'));
const fine = window.matchMedia('(pointer: fine)').matches;

let tTimer;
function toast(msg, err) {
  const el = $('#toast'); if (!el) return;
  el.innerHTML = `<span class="ti">${err ? '!' : '✓'}</span><span>${esc(msg)}</span>`; el.classList.toggle('err', !!err);
  el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
  clearTimeout(tTimer); tTimer = setTimeout(() => el.classList.remove('show'), 2600);
}
function bindTilt(root) {
  if (!fine || reduce) return;
  $$('.tilt', root || document).forEach(el => {
    if (el._tilt) return; el._tilt = true;
    let r = null;
    const apply = raf1((cx, cy) => { if (!r) return; const x = (cx - r.left) / r.width - .5, y = (cy - r.top) / r.height - .5;
      el.style.transform = `perspective(900px) rotateX(${(-y * 7).toFixed(2)}deg) rotateY(${(x * 9).toFixed(2)}deg) translateY(-6px)`; });
    el.addEventListener('pointerenter', () => { r = el.getBoundingClientRect(); });
    el.addEventListener('pointermove', e => { if (!r) r = el.getBoundingClientRect(); apply(e.clientX, e.clientY); }, { passive: true });
    el.addEventListener('pointerleave', () => { r = null; requestAnimationFrame(() => { el.style.transform = ''; }); });
  });
}
function bindMagnetic() {
  if (!fine || reduce) return;
  $$('.mag').forEach(el => {
    const apply = raf1((cx, cy) => { const r = el.getBoundingClientRect(); el.style.transform = `translate(${((cx - r.left) / r.width - .5) * 14}px, ${((cy - r.top) / r.height - .5) * 12}px)`; });
    el.addEventListener('pointermove', e => apply(e.clientX, e.clientY), { passive: true });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });
}
function fly(from) {
  try { if (navigator.vibrate && !fine) navigator.vibrate(12); } catch (e) { /* */ }
  if (!$('#fab')) { burst(from, 10); return; }
  const target = (!$('#fab').classList.contains('hide') && $('#fab .bag')) || $('#cartBtn');
  const bump = () => { const f = $('#fab'); f.classList.remove('pop'); void f.offsetWidth; f.classList.add('pop'); };
  if (reduce || !from || !from.getBoundingClientRect || !document.body.animate || !target) return bump();
  const a = from.getBoundingClientRect(), b = target.getBoundingClientRect();
  const x0 = a.left + a.width / 2, y0 = a.top + a.height / 2, dx = b.left + b.width / 2 - x0, dy = b.top + b.height / 2 - y0;
  const d = document.createElement('div'); d.className = 'fly'; d.style.left = (x0 - 13) + 'px'; d.style.top = (y0 - 13) + 'px';
  document.body.appendChild(d);
  d.animate([{ transform: 'translate(0,0) scale(.6)', opacity: 1 }, { transform: `translate(${dx * .45}px, ${dy * .45 - 140}px) scale(1.25)`, opacity: 1, offset: .5 },
    { transform: `translate(${dx}px, ${dy}px) scale(.35)`, opacity: .3 }], { duration: 850, easing: 'cubic-bezier(.45,0,.25,1)' }).onfinish = () => { d.remove(); bump(); };
  burst(from, 10);
}
function celebrate() {
  if (reduce || !document.body.animate) return;
  const n = LITE ? 26 : 44;
  for (let i = 0; i < n; i++) {
    const c = document.createElement('div'), gem = i % 5 === 0;
    c.className = 'coin' + (gem ? ' gem' : ''); if (!gem) c.textContent = '৳';
    c.style.left = (Math.random() * 100) + 'vw'; document.body.appendChild(c);
    const drift = (Math.random() - .5) * 160, rot = (Math.random() - .5) * 900, dur = 1800 + Math.random() * 1600;
    c.animate([{ transform: `translate3d(0,0,0) rotate(${gem ? 45 : 0}deg) rotateY(0)`, opacity: 1 },
      { transform: `translate3d(${drift}px, ${innerHeight + 60}px, 0) rotate(${rot}deg) rotateY(${720 + Math.random() * 720}deg)`, opacity: .9 }],
      { duration: dur, delay: Math.random() * 700, easing: 'cubic-bezier(.25,.6,.4,1)', fill: 'both' }).onfinish = () => c.remove();
  }
}
function burst(from, n = 22) {
  if (reduce || !document.body.animate) return;
  const r = from && from.getBoundingClientRect ? from.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0 };
  const x = r.left + r.width / 2, y = r.top + r.height / 2;
  for (let i = 0; i < n; i++) {
    const p = document.createElement('div'); p.className = 'spark-p'; p.style.left = x + 'px'; p.style.top = y + 'px';
    document.body.appendChild(p);
    const ang = Math.random() * Math.PI * 2, dist = 50 + Math.random() * 110, s = .5 + Math.random();
    p.animate([{ transform: `translate(-50%,-50%) rotate(45deg) scale(${s})`, opacity: 1 },
      { transform: `translate(calc(-50% + ${Math.cos(ang) * dist}px), calc(-50% + ${Math.sin(ang) * dist + 40}px)) rotate(${200 + Math.random() * 200}deg) scale(0)`, opacity: 0 }],
      { duration: 800 + Math.random() * 500, easing: 'cubic-bezier(.2,.7,.2,1)' }).onfinish = () => p.remove();
  }
}
function go(href) {
  if (reduce || canVT) { location.href = href; return; }
  document.body.classList.add('leaving'); setTimeout(() => { location.href = href; }, 180);
}
function initReveal() {
  const els = $$('.reveal:not(.in)');
  if (!('IntersectionObserver' in window) || reduce) { els.forEach(el => el.classList.add('in')); return; }
  const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { threshold: .08, rootMargin: '0px 0px -30px 0px' });
  els.forEach((el, i) => { el.style.transitionDelay = (i % 4) * 80 + 'ms'; io.observe(el); });
}
function initCursor() {
  if (!fine || reduce) return;
  const c = $('#cursor'), d = $('#cursorDot'), spot = $('#spot');
  let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
  let running = false, tgt = null;
  const loop = () => {
    cx += (x - cx) * .2; cy += (y - cy) * .2;
    c.style.transform = `translate3d(${cx}px,${cy}px,0)`; d.style.transform = `translate3d(${x}px,${y}px,0)`;
    if (!spot.dataset.on) { spot.dataset.on = 1; spot.style.left = '0'; spot.style.top = '0'; }
    spot.style.transform = `translate3d(${x - 280}px,${y - 280}px,0)`;
    if (Math.abs(x - cx) + Math.abs(y - cy) > .4) requestAnimationFrame(loop); else running = false;
  };
  document.addEventListener('pointermove', e => {
    x = e.clientX; y = e.clientY;
    if (tgt !== e.target) { tgt = e.target; c.classList.toggle('big', !!(tgt.closest && tgt.closest('a,button,[data-qv],select,label'))); }
    if (!running) { running = true; c.classList.add('on'); d.classList.add('on'); requestAnimationFrame(loop); }
  }, { passive: true });
  document.addEventListener('pointerleave', () => { c.classList.remove('on'); d.classList.remove('on'); });
}
function initSheen() {
  if (LITE || !fine) return;
  const apply = raf1((g, cx, cy) => { const r = g.getBoundingClientRect(); g.style.setProperty('--mx', (cx - r.left) + 'px'); g.style.setProperty('--my', (cy - r.top) + 'px'); });
  document.addEventListener('pointermove', e => {
    const g = e.target.closest && e.target.closest('.glass'); if (g) apply(g, e.clientX, e.clientY);
  }, { passive: true });
}
function initProgress() {
  const p = $('#progress');
  let h = 0;
  const measure = () => { h = document.documentElement.scrollHeight - innerHeight; };
  const upd = raf1(() => { if (!h) measure(); p.style.setProperty('--p', h > 0 ? Math.min(1, scrollY / h).toFixed(4) : 0); });
  addEventListener('scroll', upd, { passive: true }); addEventListener('resize', () => { measure(); upd(); }); setTimeout(() => { measure(); upd(); }, 800); upd();
}
function initGems() {
  const cv = $('#gems'), ctx = cv && cv.getContext && cv.getContext('2d'); if (!ctx || reduce) return;
  const dpr = Math.min(window.devicePixelRatio || 1, LITE ? 1.5 : 2);
  let w, h, gems = [], run = true, mx = 0, my = 0, col = '226,190,110', colAt = 0, last = 0, scrolling = 0, raf = 0;
  const step = LITE ? 1000 / 30 : 0;
  const mk = (any) => {
    const s = (Math.random() * 26 + 12) * dpr;
    return { x: Math.random() * w, y: any ? Math.random() * h : h + s * 2, s, z: s / (38 * dpr),
      vy: -(Math.random() * .22 + .06) * dpr, sway: Math.random() * 6.28, spin: Math.random() * 6.28, vs: (Math.random() * .006 + .002) * (Math.random() < .5 ? -1 : 1),
      tilt: (Math.random() - .5) * .5, glint: 0, gx: 0 };
  };
  const size = () => {
    w = cv.width = innerWidth * dpr; h = cv.height = innerHeight * dpr; cv.style.width = innerWidth + 'px'; cv.style.height = innerHeight + 'px';
    gems = Array.from({ length: LITE ? 7 : Math.round(Math.min(16, Math.max(8, innerWidth / 100))) }, () => mk(true));
  };
  // brilliant-cut diamond in side view: table, crown facets, girdle, pavilion to culet
  const drawGem = (g, a) => {
    const s = g.s, cx = Math.cos(g.spin), sx = Math.max(.3, Math.abs(cx));
    ctx.save(); ctx.translate(g.x + mx * g.z * 18, g.y + my * g.z * 12); ctx.rotate(g.tilt + Math.sin(g.sway) * .08); ctx.scale(sx, 1);
    const T = s * .26, G = s * .5, C = -s * .27, P = s * .62;
    const grad = ctx.createLinearGradient(-G, C, G, P);
    grad.addColorStop(0, `rgba(${col},${.10 * a})`); grad.addColorStop(.5, `rgba(255,255,255,${.04 * a})`); grad.addColorStop(1, `rgba(${col},${.02 * a})`);
    ctx.beginPath(); ctx.moveTo(-T, C); ctx.lineTo(T, C); ctx.lineTo(G, 0); ctx.lineTo(0, P); ctx.lineTo(-G, 0); ctx.closePath();
    ctx.fillStyle = grad; ctx.fill();
    ctx.lineWidth = 1.1 * dpr / sx * .7; ctx.strokeStyle = `rgba(${col},${.55 * a})`; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-G, 0); ctx.lineTo(G, 0);                         // girdle
    const off = Math.sin(g.spin) * T * .5;                                        // facets slide as it turns
    ctx.moveTo(-T, C); ctx.lineTo(-G * .5 + off, 0); ctx.lineTo(0 + off * .5, C);
    ctx.lineTo(G * .5 + off, 0); ctx.lineTo(T, C);
    ctx.moveTo(-G * .5 + off, 0); ctx.lineTo(0, P); ctx.lineTo(G * .5 + off, 0);
    ctx.moveTo(-G, 0); ctx.lineTo(-G * .22 + off * .4, P * .55); ctx.moveTo(G, 0); ctx.lineTo(G * .22 + off * .4, P * .55);
    ctx.lineWidth = .7 * dpr / sx * .7; ctx.strokeStyle = `rgba(${col},${.3 * a})`; ctx.stroke();
    ctx.restore();
    if (g.glint > 0) {                                                            // a star of light catches a facet
      const k = Math.sin(g.glint * Math.PI), r = s * .55 * k, x = g.x + mx * g.z * 18 + g.gx * sx, y = g.y + my * g.z * 12 + C * .9;
      ctx.save(); ctx.translate(x, y); ctx.rotate(g.glint * .8);
      const rg = ctx.createRadialGradient(0, 0, 0, 0, 0, r * .6); rg.addColorStop(0, `rgba(255,250,230,${.9 * k})`); rg.addColorStop(1, 'rgba(255,250,230,0)');
      ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(0, 0, r * .6, 0, 6.283); ctx.fill();
      ctx.fillStyle = `rgba(255,248,220,${.95 * k})`; ctx.beginPath();
      for (let i = 0; i < 8; i++) { const rr = i % 2 ? r * .09 : r, an = i * Math.PI / 4; ctx.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); }
      ctx.closePath(); ctx.fill(); ctx.restore();
    }
  };
  if (fine) addEventListener('pointermove', e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; }, { passive: true });
  const wake = () => { if (!raf && run && !scrolling) raf = requestAnimationFrame(tick); };
  addEventListener('scroll', () => { clearTimeout(scrolling); scrolling = setTimeout(() => { scrolling = 0; wake(); }, 160); }, { passive: true });
  const tick = (now) => {
    raf = 0;
    if (!run || scrolling) return;
    if (step && now - last < step) { raf = requestAnimationFrame(tick); return; }
    const k = last ? Math.min(3, (now - last) / 16.7) : 1; last = now;
    if (now - colAt > 1000) { col = getComputedStyle(document.documentElement).getPropertyValue('--gem-line').trim() || col; colAt = now; }
    ctx.clearRect(0, 0, w, h);
    for (const g of gems) {
      g.y += g.vy * k; g.sway += .01 * k; g.x += Math.sin(g.sway) * .12 * dpr * k; g.spin += g.vs * k;
      if (g.y < -g.s * 2) Object.assign(g, mk(false));
      if (g.glint > 0) { g.glint += .022 * k; if (g.glint >= 1) g.glint = 0; }
      else if (Math.random() < .0016 * k) { g.glint = .001; g.gx = (Math.random() - .5) * g.s * .4; }
      const edge = Math.min(1, (h - g.y) / (h * .15), (g.y + g.s) / (h * .2));
      drawGem(g, Math.max(0, edge) * (.45 + g.z * .55));
    }
    raf = requestAnimationFrame(tick);
  };
  let rz = 0; size(); addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(size, 200); });
  document.addEventListener('visibilitychange', () => { run = !document.hidden; last = 0; wake(); });
  wake();
}

/* =====================================================================
   PRICE ESTIMATOR (calculator.html) — public, rates & making fixed
   ===================================================================== */
function shrinkImg(file, max, q) {
  return new Promise((res, rej) => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
      res(c.toDataURL('image/jpeg', q));
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('img')); }; img.src = url;
  });
}
function viewImg(src) {
  if (!src) return;
  const d = document.createElement('div'); d.className = 'imgview'; d.innerHTML = `<img src="${src}" alt=""><button type="button" aria-label="${t('close') || '×'}">${ICON.x}</button>`;
  d.addEventListener('click', () => { d.classList.remove('on'); setTimeout(() => d.remove(), 250); });
  document.body.appendChild(d); requestAnimationFrame(() => d.classList.add('on'));
}
const estState = Object.assign({ kt: 'k22', mode: 'bhori', b: '1', a: '', r: '', p: '', g: '', name: '', desc: '', cat: 'necklace', refs: [] }, LS.get('mj_est', {}));
function estCalc() { return calc(Object.assign({ carat: estState.kt, mcu: 'pct', mc: CONFIG.making }, estState)); }
function renderEstimator() {
  const host = $('#estimator'); if (!host) return;
  const W = ['bhori', 'ana', 'rati', 'point'];
  host.innerHTML = `<div class="est-grid">
    <div class="est-card glass">
      <div class="lbl">${t('est_h1')}</div>
      <div class="est-kts">${CARATS.map(k => `<button class="est-kt" type="button" data-ekt="${k}" aria-pressed="${estState.kt === k}"><b>${ktLabel(k)}</b><small>${money(rateOf(k))}</small></button>`).join('')}</div>
      <div class="lbl" style="margin-top:22px"><span>${t('est_h2')}</span><span class="seg" role="group" aria-label="${t('weight')}">
        <button type="button" data-emode="bhori" aria-pressed="${estState.mode !== 'gram'}">${t('by_bhori')}</button><button type="button" data-emode="gram" aria-pressed="${estState.mode === 'gram'}">${t('by_gram')}</button></span></div>
      ${estState.mode === 'gram'
        ? `<div class="in pad-u"><input type="text" inputmode="decimal" data-e="g" value="${esc(estState.g)}" placeholder="0" aria-label="${t('gram')}"><span class="u">${t('gram')}</span></div>`
        : `<div class="wgrid">${['b', 'a', 'r', 'p'].map((f, i) => `<div class="in"><input type="text" inputmode="numeric" data-e="${f}" value="${esc(estState[f])}" placeholder="0" aria-label="${t(W[i])}"><small>${t(W[i])}</small></div>`).join('')}</div>`}
      <div class="conv-note" style="margin-top:14px">${t('conv_note')}</div>
      <div class="est-design">
        <h3>${ICON.edit}<span>${t('est_design_h')}</span></h3>
        <div class="fgrid">
          <div><label class="lbl" for="eName">${t('est_name')} *</label><div class="in"><input id="eName" data-e="name" type="text" maxlength="60" value="${esc(estState.name)}" placeholder="${esc(t('est_name_ph'))}"></div></div>
          <div><label class="lbl" for="eCat">${t('est_cat')}</label><div class="in"><select id="eCat" data-e="cat">${CATS.map(c => `<option value="${c}" ${estState.cat === c ? 'selected' : ''}>${t('cat_' + c)}</option>`).join('')}</select></div></div>
          <div class="full"><label class="lbl" for="eDesc">${t('est_desc')}</label><div class="in"><textarea id="eDesc" data-e="desc" rows="3" maxlength="300" placeholder="${esc(t('est_desc_ph'))}">${esc(estState.desc)}</textarea></div></div>
          <div class="full"><div class="lbl">${t('ref_h')}</div>
            <div class="ref-drop" id="refDrop">
              ${(estState.refs || []).map((r, i) => `<div class="ref big"><img src="${r}" alt="${t('ref_h')} ${dg(i + 1)}"><button type="button" class="ref-x" data-rmref="${i}" aria-label="${t('remove')}">${ICON.x}</button></div>`).join('')}
              ${(estState.refs || []).length < 3 ? `<label class="ref-add">${ICON.camera}<span>${t('ref_add')}</span><input type="file" accept="image/*" multiple id="refFile" hidden></label>` : ''}
            </div>
            <p class="hint">${t('ref_note')}</p></div>
        </div>
      </div>
    </div>
    <aside class="est-out glass" id="estOut"></aside>
  </div>`;
  renderEstOut();
}
function renderEstOut() {
  const el = $('#estOut'); if (!el) return;
  const c = estCalc();
  el.innerHTML = `<div class="est-ring">${emblem({ sparkle: true })}</div>
    <small class="lbl" style="justify-content:center">${t('est_result')}</small>
    <div class="est-total">${c.tb ? money(c.total) : '—'}</div>
    <div class="sumrows">
      <div class="r"><span>${t('weight')}</span><span>${c.tb ? weightText(c.tb) + ' · ' + num(c.tb * GRAM, 3) + ' ' + t('gram') : t('est_need')}</span></div>
      <div class="r"><span>${t(estState.kt)} · ${t('today_rate')}</span><span>${money(c.rate)} / ${t('bhori')}</span></div>
      <div class="r"><span>${t('gold_value')}</span><span>${money(c.gold)}</span></div>
      <div class="r"><span>${t('est_making')} · ${pct(CONFIG.making)}</span><span>${money(c.making)}</span></div>
    </div>
    <div class="stack">
      <button class="btn btn-gold" type="button" id="estAdd" ${c.tb ? '' : 'disabled'}>${ICON.cartAdd}<span>${t('est_add')}</span></button>
      <button class="btn btn-wa" type="button" id="estWa" ${c.tb ? '' : 'disabled'}>${ICON.wa}<span>${t('est_wa')}</span></button>
    </div>
    <p class="hint" style="text-align:center">${ICON.lock.replace('<svg', '<svg style="width:14px;height:14px;vertical-align:-2px;margin-right:4px"')}${t('est_note')}</p>`;
}
function bindEstimator() {
  const host = $('#estimator'); if (!host) return;
  const save = () => LS.set('mj_est', estState);
  host.addEventListener('input', e => { const f = e.target.dataset.e; if (!f) return; estState[f] = e.target.value; save(); if (!['name', 'desc'].includes(f)) renderEstOut(); });
  host.addEventListener('change', async e => {
    if (e.target.dataset.e === 'cat') { estState.cat = e.target.value; save(); return; }
    if (e.target.id === 'refFile') {
      const files = Array.from(e.target.files || []); estState.refs = estState.refs || [];
      for (const f of files) {
        if (estState.refs.length >= 3) { toast(t('ref_max'), true); break; }
        try { estState.refs.push(await shrinkImg(f, 800, .7)); } catch (err) { toast(t('ref_bad'), true); }
      }
      save(); renderEstimator();
    }
  });
  host.addEventListener('click', e => {
    const rm = e.target.closest('[data-rmref]'); if (rm) { estState.refs.splice(+rm.dataset.rmref, 1); save(); renderEstimator(); return; }
    const k = e.target.closest('[data-ekt]'); if (k) { estState.kt = k.dataset.ekt; save(); $$('[data-ekt]').forEach(b => b.setAttribute('aria-pressed', b === k)); renderEstOut(); return; }
    const m = e.target.closest('[data-emode]');
    if (m && m.dataset.emode !== estState.mode) {
      const tb = estCalc().tb; estState.mode = m.dataset.emode;
      if (tb) { if (estState.mode === 'gram') estState.g = String(+(tb * GRAM).toFixed(3)); else Object.assign(estState, bhoriParts(tb)); }
      save(); renderEstimator(); return;
    }
    if (e.target.closest('#estAdd')) {
      const c = estCalc(); if (!c.tb) return;
      const nm = String(estState.name || '').trim().slice(0, 60);
      if (!nm) { toast(t('est_need_name'), true); const f = $('#eName'); if (f) { f.scrollIntoView({ behavior: 'smooth', block: 'center' }); f.focus({ preventScroll: true }); } return; }
      cart.push(Object.assign({ id: uid(), pid: null, cat: CATS.includes(estState.cat) ? estState.cat : 'custom', gem: 'diamond', carat: estState.kt, mode: 'bhori', g: '', mcu: 'pct', mc: String(CONFIG.making), name: nm, desc: String(estState.desc || '').trim().slice(0, 300), custom: true, qty: 1, refs: (estState.refs || []).slice(0, 3) }, bhoriParts(c.tb)));
      estState.name = ''; estState.desc = ''; estState.refs = []; save();
      saveCart(); if (invoice) { invoice = null; LS.set('mj_invoice', null); }
      updateCartBadges(); fly(e.target.closest('button')); toast(t('added'));
      setTimeout(() => go('cart.html'), 700); return;
    }
    if (e.target.closest('#estWa')) {
      const c = estCalc(); if (!c.tb) return;
      openWA(`${t('wa_hi')}\n\n*${t('custom_order')}${estState.name ? ': ' + estState.name : ''}*${estState.desc ? '\n' + estState.desc : ''}\n${t('carat')}: ${t(estState.kt)}\n${t('weight')}: ${weightText(c.tb)}\n${t('wa_est')}: ${money(c.total)}\n\n— ${t('wa_from')}`);
    }
  });
}

/* =====================================================================
   LIVE ORDER TRACKING (track.html + invoice page)
   ===================================================================== */
let liveStatus = null, statusUnsub = null;
function trackerHTML(no, st) {
  const s = (st && st.status) || 'Pending';
  const lvl = s === 'Delivered' ? 4 : s === 'Verified' || s === 'Advance paid' ? 3 : 1;
  const bad = ['Rejected', 'Duplicate TrxID', 'Amount mismatch'].includes(s);
  const label = (k, i) => i === 1 && ['Cash at shop', 'Not paid', 'Cash on delivery', 'Awaiting payment'].includes(s) ? t(ST_KEY[s]) : t(k);
  const money2 = st && st.grand ? `<div class="trk-amt"><div><small>${t('grand')}</small><b>${money(st.grand)}</b></div>${st.method ? `<div><small>${t('paid')} · ${t('m_' + st.method)}</small><b>${money(st.paid || 0)}</b></div>` : ''}<div><small>${t('due')}</small><b>${money(st.due || 0)}</b></div></div>` : '';
  return `<div class="trk glass ${bad ? 'bad' : ''}">
    <div class="trk-h"><span class="ic">${ICON.shield}</span><div><b>${t('tr_h')}</b><small>${t('order_id')}: <span class="mono">${esc(no)}</span></small></div><span class="vstat ${ST_CLS[s] || ''}">${t(ST_KEY[s] || 'st_pending')}</span></div>
    <ol class="trk-steps">${['tr_s1', 'tr_s2', 'tr_s3', 'tr_s4'].map((k, i) => `<li class="${i < lvl ? 'done' : i === lvl ? (bad ? 'bad' : 'active') : ''}"><i>${i < lvl ? '✓' : dg(i + 1)}</i><span>${label(k, i)}</span></li>`).join('')}</ol>
    ${money2}
    <p class="trk-live">${bad ? t('tr_problem') : `<span class="pulse"></span>${t('tr_live')}`}</p>
  </div>`;
}
function watchStatus(no, cb) {
  if (statusUnsub) { try { statusUnsub(); } catch (e) { /* */ } statusUnsub = null; }
  if (!fbMod || !no) return;
  fbMod.onOrderStatus(no, st => cb(st)).then(u => { statusUnsub = u; });
}
function watchInvoice() {
  if (PAGE !== 'invoice' || !invoice || !invoice.cloud || !fbMod) return;
  watchStatus(invoice.no, st => {
    const wasLocked = invLocked(invoice);
    liveStatus = st;
    if (st && st.status === 'Pending' && invoice.pay && ['bkash', 'nagad', 'qr'].includes(invoice.pay.method) && invoice.pay.trx) askMatch(invoice.no);
    if (st && st.status) {
      invoice.status = st.status;
      if (invoice.pay && st.paid != null) { invoice.pay.amount = +st.paid || 0; invoice.pay.due = +st.due || 0; if (st.method) invoice.pay.method = st.method; }
      LS.set('mj_invoice', invoice);
    }
    const nowLocked = invLocked(invoice);
    if (wasLocked !== nowLocked || !nowLocked) renderInvoice();
    if (wasLocked && !nowLocked) { toast(t('inv_unlocked')); burst($('#paperHost')); }
    renderVerify();
  });
}
const trackState = { no: (new URLSearchParams(location.search).get('id') || '').toUpperCase(), st: undefined };
function renderTrack() {
  const host = $('#trackBox'); if (!host) return;
  const mine = LS.get('mj_my_orders', []);
  let res = '';
  if (fbReadyDone && !fbMod) res = `<div class="trk-off glass"><p>${t('track_off')}</p><a class="btn btn-wa btn-sm" href="${waLink(t('wa_hi') + (trackState.no ? '\n' + t('order_id') + ': ' + trackState.no : ''))}" target="_blank" rel="noopener">${ICON.wa}<span>${t('whatsapp')}</span></a></div>`;
  else if (trackState.no) res = trackState.st === undefined ? `<p class="trk-wait">${t('searching')}</p>` : trackState.st === null ? `<div class="trk-off glass"><p>${t('not_found')}</p></div>` : trackerHTML(trackState.no, trackState.st);
  host.innerHTML = `<form class="trk-form glass" id="trackForm" autocomplete="off">
      <div class="in"><input id="trackNo" type="text" value="${esc(trackState.no)}" placeholder="${t('track_ph')}" aria-label="${t('order_id')}" spellcheck="false"></div>
      <button class="btn btn-gold" type="submit">${ICON.shield}<span>${t('track_btn')}</span></button></form>
    <div id="trackRes" aria-live="polite">${res}</div>
    <div class="my-orders glass"><h3>${t('my_orders')}</h3>${mine.length ? mine.map(o => `<button class="mo" type="button" data-track="${esc(o.no)}"><span class="mono">${esc(o.no)}</span><small>${fdate(o.ts)} · ${o.method ? t('m_' + o.method) : ''}</small><b>${money(o.grand)}</b><span class="mo-st" data-st-of="${esc(o.no)}">${myStatus[o.no] ? `<span class="vstat ${ST_CLS[myStatus[o.no]] || ''}">${t(ST_KEY[myStatus[o.no]] || 'st_pending')}</span>` : ''}</span></button>`).join('') : `<p class="hint">${t('no_orders')}</p>`}</div>`;
  watchMyOrders(mine);
}
const myStatus = {}, myWatch = {};
function watchMyOrders(mine) {
  if (!fbMod) return;
  mine.slice(0, 12).forEach(o => {
    if (myWatch[o.no]) return;
    myWatch[o.no] = true;
    fbMod.onOrderStatus(o.no, st => {
      if (!st) return; myStatus[o.no] = st.status;
      const el = document.querySelector(`[data-st-of="${o.no}"]`);
      if (el) el.innerHTML = `<span class="vstat ${ST_CLS[st.status] || ''}">${t(ST_KEY[st.status] || 'st_pending')}</span>`;
    });
  });
}
function startTrack(no) {
  trackState.no = String(no || '').trim().toUpperCase(); trackState.st = undefined;
  history.replaceState(null, '', trackState.no ? '?id=' + encodeURIComponent(trackState.no) : location.pathname);
  renderTrack();
  if (!trackState.no || !fbMod) return;
  watchStatus(trackState.no, st => { trackState.st = st; const r = $('#trackRes'); if (r) r.innerHTML = st ? trackerHTML(trackState.no, st) : `<div class="trk-off glass"><p>${t('not_found')}</p></div>`; });
}
function bindTrack() {
  const host = $('#trackBox'); if (!host) return;
  host.addEventListener('submit', e => { e.preventDefault(); startTrack($('#trackNo').value); });
  host.addEventListener('click', e => { const b = e.target.closest('[data-track]'); if (b) startTrack(b.dataset.track); });
}

/* =====================================================================
   CUSTOMER ACCOUNTS (account.html) — Firebase email/password + Google
   ===================================================================== */
let user = null, profile = null, myOrders = null, myOrdersUnsub = null;
const wish = new Set(LS.get('mj_wish', []));
const accState = { mode: 'login', tab: 'orders', busy: false, err: '', show: false };
const initialOf = (u) => String((u && (u.displayName || u.email)) || '?').trim().charAt(0).toUpperCase();
const AUTH_ERR = { 'email-already-in-use': 'ae_exists', 'invalid-email': 'ae_email', 'weak-password': 'ae_weak', 'invalid-credential': 'ae_cred', 'wrong-password': 'ae_cred',
  'user-not-found': 'ae_cred', 'invalid-login-credentials': 'ae_cred', 'popup-closed-by-user': 'ae_popup', 'cancelled-popup-request': 'ae_popup', 'unauthorized-domain': 'ae_domain',
  'operation-not-allowed': 'ae_off', 'too-many-requests': 'ae_many', 'network-request-failed': 'ae_net' };
const authMsg = (e) => t(AUTH_ERR[String((e && e.code) || '').replace('auth/', '')] || 'ae_other');
function saveWish() {
  LS.set('mj_wish', [...wish]);
  if (user && fbMod) fbMod.saveProfile(user.uid, { wish: [...wish].slice(0, 100) }).catch(() => {});
}
function toggleWish(id, el) {
  const on = !wish.has(id); on ? wish.add(id) : wish.delete(id); saveWish();
  $$(`[data-wish="${id}"]`).forEach(b => { b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
  if (on && el) { el.classList.add('pop'); setTimeout(() => el.classList.remove('pop'), 600); burst(el, 8); }
  toast(t(on ? 'wish_add' : 'wish_rm'));
  if (PAGE === 'account') renderAccount();
}
async function onUserChange(u) {
  user = u || null; profile = null;
  if (myOrdersUnsub) { try { myOrdersUnsub(); } catch (e) { /* */ } myOrdersUnsub = null; }
  myOrders = null;
  if (user && fbMod) {
    try { profile = await fbMod.getProfile(user.uid); } catch (e) { profile = null; }
    const merged = new Set([...(profile && profile.wish || []), ...wish]);
    const base = { name: (profile && profile.name) || user.displayName || '', email: user.email || '', photo: user.photoURL || '', provider: (user.providerData[0] || {}).providerId || 'password' };
    if (!profile) fbMod.saveProfile(user.uid, Object.assign(base, { wish: [...merged].slice(0, 100), createdAt: Date.now() })).catch(() => {});
    else if (merged.size !== (profile.wish || []).length) fbMod.saveProfile(user.uid, { wish: [...merged].slice(0, 100) }).catch(() => {});
    wish.clear(); merged.forEach(x => wish.add(x)); LS.set('mj_wish', [...wish]);
    profile = Object.assign(base, profile || {});
    ['name', 'phone', 'addr'].forEach(k => { if (!buyer[k] && profile[k]) buyer[k] = profile[k]; });
    if (!buyer.email && user.email) buyer.email = user.email;
    saveBuyer();
    if (PAGE === 'account') fbMod.onMyOrders(user.uid, list => { myOrders = list; renderAccount(); }).then(u2 => { myOrdersUnsub = u2; });
    const next = new URLSearchParams(location.search).get('next');
    if (PAGE === 'account' && next && /^[a-z]+\.html$/.test(next)) { go(next); return; }
  }
  renderChrome();
  if (PAGE === 'account') renderAccount();
  if (PAGE === 'pay') renderCheckout();
  if (PAGE === 'shop') renderShop();
  if (PAGE === 'home') renderFeatured();
}
function invoiceFromOrder(o) {
  return { no: o.id, ts: o.createdAt || Date.now(), rateDate: o.rateDate, buyer: o.customer || {}, lines: (o.items || []).map(l => Object.assign({ q: +l.qty || 1 }, l)),
    totals: o.totals || { grand: o.grand }, pay: o.pay, status: o.status, delivery: o.delivery, plan: o.plan, cloud: true, sync: 'off' };
}
function accOrderCard(o) {
  const items = o.items || [], st = o.status || 'Pending';
  const lvl = st === 'Delivered' ? 4 : OPEN_ST.includes(st) ? 3 : ['Rejected', 'Amount mismatch'].includes(st) ? 0 : 2;
  const nm = (l) => (lang === 'en' ? l.title_en : l.title_bn) || l.name || t('cat_' + (l.cat || 'custom'));
  return `<article class="aord glass">
    <header><div><span class="mono">${esc(o.id)}</span><small>${o.createdAt ? fdate(o.createdAt) : ''} · ${t(o.delivery && o.delivery.method === 'home' ? 'dl_home' : 'dl_pickup')}</small></div>
      <span class="vstat ${ST_CLS[st] || ''}">${t(ST_KEY[st] || 'st_pending')}</span></header>
    <div class="aord-items">${items.slice(0, 4).map(l => `<div class="ai">${lineThumb(l)}<span><b>${esc(nm(l))}${qtyTag(+l.qty || 1)}</b><small>${t(l.carat)} · ${weightText(+l.tb || 0)}</small></span></div>`).join('')}
      ${items.length > 4 ? `<span class="more">${t('acc_more', { n: dg(items.length - 4) })}</span>` : ''}</div>
    <div class="aord-prog" aria-hidden="true">${[1, 2, 3, 4].map(i => `<i class="${i <= lvl ? 'on' : ''}"></i>`).join('')}</div>
    <footer><div><small>${t('grand')}</small><b>${money(o.grand)}</b></div>
      <div class="acts"><a class="btn btn-glass btn-sm" href="track.html?id=${encodeURIComponent(o.id)}">${ICON.shield}<span>${t('acc_track')}</span></a>
      <button class="btn btn-gold btn-sm" type="button" data-open-inv="${esc(o.id)}">${ICON.doc || ICON.download}<span>${t('acc_invoice')}</span></button></div></footer>
  </article>`;
}
function renderAccount() {
  const host = $('#accountBox'); if (!host) return;
  if (!fbReadyDone) { host.innerHTML = `<div class="acc-wait glass"><span class="ldr"></span>${t('acc_loading')}</div>`; return; }
  if (!fbMod) { host.innerHTML = `<div class="trk-off glass"><p>${t('acc_off')}</p><a class="btn btn-gold btn-sm" href="track.html">${t('nav_track')}</a></div>`; return; }
  if (!user) {
    const reg = accState.mode === 'register';
    host.innerHTML = `<div class="auth glass">
      <aside class="auth-side">
        <div class="auth-art">${emblem({ sparkle: true })}</div>
        <h3>${t('acc_side_h')}</h3><p>${t('acc_side_p')}</p>
        <ul>${['acc_p1', 'acc_p2', 'acc_p3', 'acc_p4'].map((k, i) => `<li style="animation-delay:${.15 + i * .1}s">${[ICON.shield, ICON.truck, ICON.heart, ICON.doc || ICON.box][i]}<span>${t(k)}</span></li>`).join('')}</ul>
      </aside>
      <div class="auth-main">
        <div class="auth-tabs" role="tablist"><button type="button" role="tab" data-amode="login" aria-selected="${!reg}">${t('acc_login')}</button><button type="button" role="tab" data-amode="register" aria-selected="${reg}">${t('acc_register')}</button><i class="ink ${reg ? 'r' : ''}"></i></div>
        <button class="gbtn" type="button" id="gSign" ${accState.busy ? 'disabled' : ''}>${ICON.google}<span>${t('acc_google')}</span></button>
        <div class="or"><span>${t('acc_or')}</span></div>
        <form id="authForm" novalidate>
          ${reg ? `<label class="lbl" for="aName">${t('acc_name')}</label><div class="in ico">${ICON.user}<input id="aName" type="text" autocomplete="name" required></div>` : ''}
          <label class="lbl" for="aEmail">${t('acc_email')}</label><div class="in ico">${ICON.mail}<input id="aEmail" type="email" inputmode="email" autocomplete="email" required value="${esc(accState.email || '')}"></div>
          <label class="lbl" for="aPass">${t('acc_pass')}</label><div class="in ico pw">${ICON.lock}<input id="aPass" type="${accState.show ? 'text' : 'password'}" autocomplete="${reg ? 'new-password' : 'current-password'}" required minlength="6"><button type="button" class="eye" data-showpw aria-label="${t('acc_show')}">${accState.show ? ICON.eyeoff : ICON.eye}</button></div>
          ${reg ? `<p class="hint">${t('acc_pass_hint')}</p>` : `<button type="button" class="linkish" data-forgot>${t('acc_forgot')}</button>`}
          ${accState.err ? `<p class="aerr" role="alert">${esc(accState.err)}</p>` : ''}
          <button class="btn btn-gold btn-lg" type="submit" ${accState.busy ? 'disabled' : ''}>${accState.busy ? '<span class="ldr"></span>' : ICON.check}<span>${t(reg ? 'acc_do_register' : 'acc_do_login')}</span></button>
        </form>
      </div></div>`;
    return;
  }
  const list = myOrders || [], P = profile || {};
  const spent = list.reduce((s, o) => s + (o.pay ? +o.pay.amount || 0 : 0), 0);
  const active = list.filter(o => !['Delivered', 'Rejected'].includes(o.status)).length;
  const device = LS.get('mj_my_orders', []).filter(x => !list.some(o => o.id === x.no));
  const wishList = [...wish].map(prod).filter(Boolean);
  const since = user.metadata && user.metadata.creationTime ? fdate(Date.parse(user.metadata.creationTime)) : '';
  const tab = accState.tab;
  host.innerHTML = `<div class="acc-head glass">
      <div class="acc-av">${user.photoURL ? `<img src="${esc(user.photoURL)}" alt="" referrerpolicy="no-referrer">` : esc(initialOf(user))}</div>
      <div class="acc-who"><small>${t('acc_hello')} ✦</small><h2>${esc(P.name || user.displayName || user.email || '')}</h2><p>${esc(user.email || '')}${since ? ' · ' + t('acc_member', { d: since }) : ''}</p></div>
      <div class="acc-acts">${fbMod.isAdmin(user) ? `<a class="btn btn-glass btn-sm" href="admin.html">${ICON.shield}<span>${t('acc_admin')}</span></a>` : ''}<button class="btn btn-glass btn-sm" type="button" data-logout>${ICON.logout}<span>${t('acc_logout')}</span></button></div>
    </div>
    ${!user.emailVerified && (user.providerData[0] || {}).providerId === 'password' ? `<div class="acc-verify glass">${ICON.mail}<span>${t('acc_verify')}</span><button class="btn btn-glass btn-sm" type="button" data-resend>${t('acc_resend')}</button></div>` : ''}
    <div class="acc-stats">${[['acc_s_orders', dg(list.length), ICON.box], ['acc_s_spent', money(spent), ICON.coins], ['acc_s_active', dg(active), ICON.truck], ['acc_s_wish', dg(wish.size), ICON.heart]]
      .map(([k, v, ic], i) => `<div class="astat glass" style="animation-delay:${i * .07}s"><span class="ic">${ic}</span><small>${t(k)}</small><b>${v}</b></div>`).join('')}</div>
    <div class="acc-tabs glass" role="tablist">${['orders', 'wish', 'profile'].map(k => `<button type="button" role="tab" data-atab="${k}" aria-selected="${tab === k}">${t('acc_t_' + k)}${k === 'orders' && list.length ? ` <em>${dg(list.length)}</em>` : k === 'wish' && wish.size ? ` <em>${dg(wish.size)}</em>` : ''}</button>`).join('')}</div>
    <div class="acc-pane">${tab === 'orders'
      ? (myOrders === null ? `<div class="acc-wait"><span class="ldr"></span>${t('acc_loading')}</div>`
        : (list.length ? `<div class="aords">${list.map(accOrderCard).join('')}</div>` : `<div class="empty glass"><h3>${t('acc_no_orders')}</h3><a class="btn btn-gold btn-sm" href="shop.html">${t('go_shop')}</a></div>`)
          + (device.length ? `<a class="btn btn-glass btn-sm dev-link" href="track.html">${t('acc_device', { n: dg(device.length) })}</a>` : ''))
      : tab === 'wish'
        ? (wishList.length ? `<div class="grid">${wishList.map(productCard).join('')}</div>` : `<div class="empty glass"><h3>${t('acc_no_wish')}</h3><a class="btn btn-gold btn-sm" href="shop.html">${t('go_shop')}</a></div>`)
        : `<form class="co-card glass acc-prof" id="profForm"><h3 class="co-h"><i>${ICON.user}</i>${t('acc_profile_h')}</h3><div class="fgrid">
            <div><label class="lbl" for="pName">${t('buyer_name')}</label><div class="in"><input id="pName" data-pf="name" type="text" autocomplete="name" value="${esc(P.name || '')}"></div></div>
            <div><label class="lbl" for="pPhone">${t('buyer_phone')}</label><div class="in"><input id="pPhone" data-pf="phone" type="tel" inputmode="tel" autocomplete="tel" value="${esc(P.phone || '')}"></div></div>
            <div class="full"><label class="lbl" for="pAddr">${t('buyer_addr')}</label><div class="in"><input id="pAddr" data-pf="addr" type="text" autocomplete="street-address" value="${esc(P.addr || '')}"></div></div>
            <div class="full"><label class="lbl">${t('acc_email')}</label><div class="in ico">${ICON.mail}<input type="email" value="${esc(user.email || '')}" disabled></div></div>
          </div>
          <div class="stack" style="flex-direction:row;flex-wrap:wrap;margin-top:14px"><button class="btn btn-gold" type="submit">${ICON.check}<span>${t('acc_save')}</span></button>
          ${(user.providerData[0] || {}).providerId === 'password' ? `<button class="btn btn-glass" type="button" data-pwreset>${ICON.lock}<span>${t('acc_change_pw')}</span></button>` : ''}</div></form>`}</div>`;
}
function bindAccount() {
  const host = $('#accountBox'); if (!host) return;
  host.addEventListener('click', async e => {
    const m = e.target.closest('[data-amode]'); if (m) { accState.mode = m.dataset.amode; accState.err = ''; renderAccount(); return; }
    const tb = e.target.closest('[data-atab]'); if (tb) { accState.tab = tb.dataset.atab; renderAccount(); return; }
    if (e.target.closest('[data-showpw]')) { const v = $('#aPass') && $('#aPass').value; accState.show = !accState.show; accState.email = ($('#aEmail') || {}).value; renderAccount(); if ($('#aPass')) { $('#aPass').value = v || ''; $('#aPass').focus(); } return; }
    if (e.target.closest('#gSign')) {
      accState.busy = true; accState.err = ''; renderAccount();
      try { await fbMod.signInGoogle(); } catch (err) { accState.err = authMsg(err); }
      accState.busy = false; if (!user) renderAccount(); return;
    }
    if (e.target.closest('[data-forgot]')) {
      const em = ($('#aEmail').value || '').trim(); if (!em) { accState.err = t('acc_need_email'); renderAccount(); return; }
      try { await fbMod.resetPassword(em); toast(t('acc_reset_sent')); } catch (err) { accState.email = em; accState.err = authMsg(err); renderAccount(); } return;
    }
    if (e.target.closest('[data-logout]')) { await fbMod.logout(); toast(t('acc_out')); return; }
    if (e.target.closest('[data-resend]')) { try { await fbMod.sendVerify(); toast(t('acc_verify')); } catch (err) { toast(authMsg(err), true); } return; }
    if (e.target.closest('[data-pwreset]')) { try { await fbMod.resetPassword(user.email); toast(t('acc_reset_sent')); } catch (err) { toast(authMsg(err), true); } return; }
    const oi = e.target.closest('[data-open-inv]');
    if (oi) { const o = (myOrders || []).find(x => x.id === oi.dataset.openInv); if (o) { LS.set('mj_invoice', invoiceFromOrder(o)); go('invoice.html'); } }
  });
  host.addEventListener('submit', async e => {
    e.preventDefault();
    if (e.target.id === 'profForm') {
      const d = {}; $$('[data-pf]', e.target).forEach(i => { d[i.dataset.pf] = i.value.trim().slice(0, 160); });
      try { await fbMod.saveProfile(user.uid, d); profile = Object.assign(profile || {}, d); Object.assign(buyer, { name: d.name || buyer.name, phone: d.phone || buyer.phone, addr: d.addr || buyer.addr }); saveBuyer(); toast(t('acc_saved')); renderAccount(); }
      catch (err) { toast(authMsg(err), true); }
      return;
    }
    if (e.target.id !== 'authForm') return;
    const reg = accState.mode === 'register', em = ($('#aEmail').value || '').trim(), pw = $('#aPass').value, nm = reg ? ($('#aName').value || '').trim() : '';
    accState.email = em;
    if (reg && !nm) { accState.err = t('ae_name'); renderAccount(); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)) { accState.err = t('ae_email'); renderAccount(); return; }
    if (pw.length < 6) { accState.err = t('ae_weak'); renderAccount(); if ($('#aPass')) $('#aPass').focus(); return; }
    accState.busy = true; accState.err = ''; renderAccount();
    try {
      if (reg) { const u = await fbMod.signUp(em, pw, nm); await fbMod.saveProfile(u.uid, { name: nm, email: em, provider: 'password', wish: [...wish], createdAt: Date.now() }); }
      else await fbMod.signIn(em, pw);
    } catch (err) { accState.err = authMsg(err); }
    accState.busy = false; if (!user) { renderAccount(); if ($('#aEmail')) $('#aEmail').value = em; }
  });
}

/* =====================================================================
   HOME — category showcase + custom design band
   ===================================================================== */
function renderCatShow() {
  const el = $('#catShow'); if (!el) return;
  const vis = catalog.filter(p => !p.hidden);
  el.innerHTML = CATS.map((c, i) => {
    const n = vis.filter(p => p.cat === c).length, sample = vis.find(p => p.cat === c) || { gem: 'diamond' };
    return `<a class="cat-tile glass tilt" href="shop.html#${c}" style="--d:${i * .06}s"><span class="halo"></span><span class="cart-art">${art(c, sample.gem)}</span>
      <b>${t('cat_' + c)}</b><small>${t('cat_items', { n: dg(n) })}</small><span class="go">${ICON.arrow || '→'}</span></a>`;
  }).join('');
  const cd = $('#cdText'); if (cd) cd.textContent = t('cd_d', { p: pct(CONFIG.advancePct) });
  const tr = $('#trustRow');
  if (tr) { const items = ['tb1', 'tb2', 'tb3', 'tb4', 'tb5', 'tb6', 'tb7'].map(k => `<span class="tb">✦ ${t(k)}</span>`).join(''); tr.innerHTML = items + items; }
}

/* =====================================================================
   FIREBASE — live rates, settings, catalogue (admin-controlled)
   ===================================================================== */
let fbReadyDone = false;
function normProduct(p) {
  const o = Object.assign({}, p);
  o.w = toNum(o.w) || 0; o.kt = CARATS.includes(o.kt) ? o.kt : 'k22'; o.cat = CATS.includes(o.cat) ? o.cat : 'necklace';
  o.name = { bn: (o.name && o.name.bn) || o.name_bn || '', en: (o.name && o.name.en) || o.name_en || '' };
  if (!o.name.bn) o.name.bn = o.name.en; if (!o.name.en) o.name.en = o.name.bn;
  return o;
}
function loadFirebase() {
  return import(new URL('fb.js', SCRIPT_URL).href).then(m => {
    if (!m.enabled) return null;
    fbMod = m;
    m.onRates(r => {
      if (!r || !CARATS.every(k => toNum(r[k]))) return;
      const before = official;
      official = { from: 'firebase', date: r.date || todayKey() }; CARATS.forEach(k => { official[k] = toNum(r[k]); });
      LS.set('mj_rates_cache', Object.assign({ date: official.date }, ...CARATS.map(k => ({ [k]: official[k] }))));
      if (PAGE === 'pay' && lockState && Date.now() - lockState.at < 20000 && CARATS.some(k => before[k] !== official[k])) ensureLock(true);
      rerenderRates();
    });
    m.onSettings(st => { if (!st) return; applySettings(st); rerenderRates(); renderChrome(); renderPayCards(); renderCatShow(); });
    m.onAuth(u => onUserChange(u && !u.isAnonymous ? u : null));
    m.onProducts(list => {
      if (!list || !list.length) return;
      catalog = list.map(normProduct);
      LS.set('mj_catalog_cache', catalog.map(p => Object.assign({}, p, { img: /^data:/.test(p.img || '') ? '' : p.img })));
      if (PAGE === 'home') { renderFeatured(); renderCatShow(); }
      if (PAGE === 'shop') renderShop();
      if (PAGE === 'account') renderAccount();
      if (PAGE === 'cart') renderCart();
    });
    const q = LS.get('mj_fb_outbox', []);
    if (q.length) Promise.all(q.map(o => m.placeOrder(o).then(r => ({ o, r })))).then(rs => {
      const left = rs.filter(x => !(x.r && (x.r.ok || x.r.dup))).map(x => x.o);
      LS.set('mj_fb_outbox', left);
      rs.forEach(x => { if (x.r && x.r.ok && invoice && invoice.no === x.o.id) { invoice.cloud = true; LS.set('mj_invoice', invoice); if (PAGE === 'invoice') { renderVerify(); watchInvoice(); } } });
    });
    return m;
  }).catch(err => { console.warn('fb.js not loaded', err); return null; })
    .then(m => { fbReadyDone = true; if (PAGE === 'account') renderAccount(); if (PAGE === 'track') { if (trackState.no) startTrack(trackState.no); else renderTrack(); } watchInvoice(); return m; });
}

/* =====================================================================
   GLOBAL EVENTS
   ===================================================================== */
function closeDialogs() { $$('dialog[open]').forEach(d => d.close ? d.close() : d.removeAttribute('open')); }
function bindGlobal() {
  document.addEventListener('click', e => {
    const T = e.target;
    const add = T.closest('[data-add]'); if (add) { e.preventDefault(); addProduct(add.dataset.add, add.dataset.kt, add); return; }
    const wb = T.closest('[data-wish]'); if (wb) { e.preventDefault(); e.stopPropagation(); toggleWish(wb.dataset.wish, wb); return; }
    const qv = T.closest('[data-qv]'); if (qv) { e.preventDefault(); openQV(qv.dataset.qv); return; }
    const qkt = T.closest('[data-qkt]'); if (qkt) { qvState.kt = qkt.dataset.qkt; renderQV(); return; }
    const cp = T.closest('[data-copy],[data-copy-amt]');
    if (cp) {
      const v = cp.hasAttribute('data-copy-amt') ? String(payAmount(totals())) : cp.dataset.copy;
      copyText(v).then(() => { toast(t('copied') + ' · ' + dg(v)); const sp = $('span', cp); if (sp) { sp.textContent = t('copied'); setTimeout(() => { sp.textContent = t('copy'); }, 1600); } });
      return;
    }
    if (T.closest('[data-close-dlg]')) { closeDialogs(); return; }
    if (T.closest('[data-lang-toggle]')) { lang = lang === 'bn' ? 'en' : 'bn'; LS.set('mj_lang', lang); renderAll(); return; }
    if (T.closest('[data-theme-toggle]')) { const n = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light'; document.documentElement.dataset.theme = n; LS.set('mj_theme', n); return; }
    if (T.closest('[data-menu]')) { $('#drawer').classList.add('open'); return; }
    if (T.closest('[data-close-menu]')) { $('#drawer').classList.remove('open'); return; }
    const wa = T.closest('button[data-wa]'); if (wa) { openWA(t('wa_hi')); return; }
    const a = T.closest('a[href]');
    if (a && !a.target && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
      const href = a.getAttribute('href');
      if (/^[\w-]+\.html(#.*)?$/.test(href)) {
        const [file] = href.split('#'); const here = location.pathname.split('/').pop() || 'index.html';
        if (file !== here) { e.preventDefault(); $('#drawer').classList.remove('open'); go(href); }
        else $('#drawer').classList.remove('open');
      }
    }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') $('#drawer').classList.remove('open');
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('.art[data-qv]')) { e.preventDefault(); openQV(e.target.dataset.qv); }
  });
  $$('dialog.dlg').forEach(d => d.addEventListener('click', e => { if (e.target === d) closeDialogs(); }));
  addEventListener('pageshow', e => { if (e.persisted) document.body.classList.remove('leaving'); });
  addEventListener('storage', e => {     // keep tabs in sync
    if (e.key === CART_KEY) { cart = LS.get(CART_KEY, []); updateCartBadges(); if (PAGE === 'cart' || PAGE === 'admin') renderCart(); }
  });
}

/* =====================================================================
   RENDER ALL + INIT
   ===================================================================== */
function renderAll() {
  applyStatic(); renderChrome(); renderTicker();
  if (PAGE === 'home') { renderHero(); renderRateBoard(); renderFeatured(); renderCatShow(); }
  if (PAGE === 'account') renderAccount();
  renderPayCards();
  if (PAGE === 'pay') renderCheckout();
  if (PAGE === 'shop') renderShop();
  if (PAGE === 'calc') { renderRateChips(); renderEstimator(); }
  if (PAGE === 'cart') { renderRateChips(); renderCart(); $$('[data-b]').forEach(i => { i.value = buyer[i.dataset.b] || ''; }); }
  if (PAGE === 'track') renderTrack();
  if (PAGE === 'invoice') { renderInvoice(); renderVerify(); }
  if (PAGE === 'contact') renderContactOptions();
  if ($('#qvDlg') && $('#qvDlg').open) renderQV();
  renderIntlPanel();
}

if (PAGE === 'admin') {
  document.body.insertAdjacentHTML('afterbegin', spriteHTML());
  document.body.insertAdjacentHTML('beforeend', '<div class="toast glass" id="toast" role="status" aria-live="polite"></div>');
  bindCart();
  window.MJ = {
    CONFIG, BUILTIN, PRODUCTS, CATS, CARATS, I18N, GRAM, ICON,
    t, dg, num, money, pct, esc, fdate, ftime, weightText, words, toNum, art, emblem, imgSrc, photo, toast, LS, ST_KEY, ST_CLS,
    get lang() { return lang; }, set lang(v) { lang = v === 'en' ? 'en' : 'bn'; LS.set('mj_lang', lang); },
    get official() { return official; },
    setRates(r) { official = Object.assign({ from: 'firebase' }, r); renderRateChips(); renderCart(); },
    setSettings(st) { applySettings(st, true); renderCart(); },
    setCatalog(list) { catalog = list.map(normProduct); },
    get catalog() { return catalog; }, prod, pName,
    get cart() { return cart; }, get buyer() { return buyer; },
    renderPOS() { $$('[data-b]').forEach(i => { i.value = buyer[i.dataset.b] || ''; }); renderRateChips(); renderCart(); },
    addProduct, totals, calc, buildInvoice, orderDoc, commitInvoice,
    clearPOS() { cart = []; buyer = { name: '', phone: '', addr: '', disc: '', vat: '', adv: '' }; saveCart(); saveBuyer(); renderCart(); $$('[data-b]').forEach(i => { i.value = ''; }); },
    openInvoice(inv) { LS.set('mj_invoice', Object.assign({}, inv, { adminView: true })); window.open('invoice.html', '_blank', 'noopener'); }
  };
  document.dispatchEvent(new CustomEvent('mj:ready'));
  return;
}
injectChrome();
$$('[data-emblem]').forEach(el => { el.innerHTML = emblem({ sparkle: true, spin: el.dataset.emblem === 'spin', label: 'Maa Jewellers logo' }); });
bindGlobal();
bindShop();
bindCart();
bindEstimator();
bindTrack();
bindAccount();
bindInvoice();
bindContact();
bindCheckout();
bindVerify();
renderAll();
initReveal();
bindTilt(document);
bindMagnetic();
initSheen();
initCursor();
initProgress();
initGems();
loadRatesFile();
if (['home', 'shop', 'about', 'contact', 'calc'].includes(PAGE)) (window.requestIdleCallback || ((f) => setTimeout(f, 600)))(() => loadFirebase(), { timeout: 2200 });
else loadFirebase();
if (PAGE === 'pay' || PAGE === 'invoice') loadSslConfig();
liveTick();
setInterval(liveTick, CONFIG.liveEverySec * 1000);
setInterval(updateAgo, 1000);
setInterval(loadRatesFile, 30 * 60 * 1000);
if (PAGE !== 'invoice') flushOutbox();
if (document.prerendering) document.addEventListener('prerenderingchange', () => {
  cart = LS.get(CART_KEY, []); if (!Array.isArray(cart)) cart = [];
  Object.assign(buyer, LS.get(BUYER_KEY, {}));
  invoice = LS.get('mj_invoice', null);
  const lw = LS.get('mj_wish', []); wish.clear(); lw.forEach(x => wish.add(x));
  const ln = LS.get('mj_lang', 'bn') === 'en' ? 'en' : 'bn';
  if (ln !== lang) lang = ln;
  document.documentElement.setAttribute('data-theme', LS.get('mj_theme', document.documentElement.getAttribute('data-theme')) || 'dark');
  renderAll(); updateCartBadges(); initReveal();
}, { once: true });
addEventListener('online', () => flushOutbox());
})();
