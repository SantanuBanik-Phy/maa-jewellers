# Maa Jewellers website — notes for updates

Static site (no build step) for মা জুয়েলার্স / Maa Jewellers, Parashuram Bazar, Feni.
Hosted on Vercel from this repo: every push to `main` redeploys automatically.

## Two sides
- **Customer site** — `index` `shop` `calculator` (price estimator) `cart` `checkout` `invoice` `track` `about` `contact` (.html).
  Customers can NOT edit rates or making charge; cart lines are read-only (remove only).
  Custom orders: calculator.html takes carat + weight + jewellery name (required) + type + description → cart line `{custom, name, desc}`.
  Invoice is locked (blurred, print/share blocked, prints a notice) until the shop marks it Verified/Delivered;
  for Firestore orders only the live `orderStatus` unlocks it (localStorage edits don't). Admin-opened invoices set `adminView`.
- **Admin console** — `admin.html` + `assets/admin.js` + `assets/admin.css` (own look, noindex).
  Firebase Auth email/password; only `santanubanik2k@gmail.com` with a verified email. Tabs: Dashboard,
  Orders (verify/reject/deliver, price-integrity check, chime on new orders), BAJUS rates (publish + history),
  Products (CRUD, photo upload → resized JPEG data URL), In-store sale (POS with discount/VAT/advance), Settings.

## Files
- `assets/app.js` — all customer logic and all Bangla/English text (I18N). `PAGE === 'admin'` skips the
  public chrome and exposes `window.MJ` helpers for admin.js. Top of file:
  - `CONFIG` — phone, WhatsApp, bKash, Nagad, Bangla QR, making %, lockMinutes, `sheetUrl`
  - `BUILTIN` — fallback BAJUS rates per bhori; `PRODUCTS` — default catalogue (`img` = Unsplash id or URL, `credit`)
- `assets/fb.js` — Firebase layer (SDK 12.11.0 from gstatic, loaded on demand). Safe no-op while not configured.
- `assets/firebase-config.js` — web config + ADMIN_EMAIL (public values; security = `firestore.rules`).
- `firestore.rules` — paste into Firebase console. Collections: `public/rates`, `public/settings`, `products`,
  `rateHistory`, `orders` (admin-read only, PII), `orderStatus` (public get, no PII), `trx/{TRXID}` (create-only → no duplicate TrxID).
- Order id format `MJ-YYMMDD-HHMMSS-XXXX` (rules + Code.gs regex depend on it).
- Rate priority: Firestore `public/rates` (admin) > `rates.json` > `BUILTIN`. Checkout locks prices for `lockMinutes`.
- `assets/style.css` — customer design (glass, dark/light, floating cut-diamond canvas `#gems`), print invoice (white · black · gold only)
- `google-apps-script/Code.gs` — optional Google Sheet backup. Never put the real SECRET here (repo is public).
- `FIREBASE-SETUP.md` — owner's setup steps (BN + EN).

## Common updates
- New BAJUS rate: owner publishes it in admin.html (no push). Fallback: edit `rates.json` and `BUILTIN`.
- Every new UI string needs both `bn` and `en` keys (I18N in app.js; admin strings in `A` in admin.js).
- Keep the invoice print palette white/black/gold; check it still fits one A4 page.
- Test headless (Playwright) at 1440 and 390 widths before pushing; `node --check assets/app.js`.
  For admin/order flows, copy the site and replace `assets/fb.js` with an in-memory mock exporting the same API.
