# Maa Jewellers website — notes for updates

Static site (no build step) for মা জুয়েলার্স / Maa Jewellers, Parashuram Bazar, Feni.
Hosted on Vercel from this repo: every push to `main` redeploys automatically.

## Two sides
- **Customer site** — `index` `shop` `calculator` (price estimator) `cart` `checkout` `invoice` `track` `about` `contact` (.html).
  Customers can NOT edit rates or making charge; cart lines are read-only (remove only).
  Custom orders: calculator.html takes carat + weight + jewellery name (required) + type + description → cart line `{custom, name, desc}`.
  Invoice is locked (blurred, print/share blocked, prints a notice) until the shop marks it Verified/Delivered;
  for Firestore orders only the live `orderStatus` unlocks it (localStorage edits don't). Admin-opened invoices set `adminView`.
  Cart: quantity stepper (`qty`, max 20; same product+carat merges), cart clears after an order. Custom orders can carry up to
  3 reference photos (`refs`, ~800px JPEG data URLs stored in the order items).
  Checkout: delivery (pickup / home + `deliveryFee`), plan (full / advance `advancePct` for custom orders / cash on delivery / pay at shop),
  method (SSLCommerz `ssl` when `/api/pay/config` says on, bKash, Nagad, Bangla QR with TrxID). Optional email → confirmation mails.
  Accounts: `account.html` — Firebase email/password + Google sign-in (fb.signUp/signIn/signInGoogle), profile in `users/{uid}`
  {name, phone, addr, email, wish[], photo, provider}; orders placed while signed in carry `uid` and show in the account
  (fb.onMyOrders). Wishlist hearts on product cards (LS `mj_wish`, synced to the profile). Header avatar button → account.
  Home extras: trust ribbon (`#trustRow`), category showcase (`#catShow`), animated custom-design band (`.cd-band`).
  Statuses: Pending, Awaiting payment (ssl), Advance paid, Verified, Cash on delivery, Cash at shop, Not paid, Amount mismatch, Delivered, Rejected.
- **Admin console** — `admin.html` + `assets/admin.js` + `assets/admin.css` (own look, noindex).
  Firebase Auth email/password; only `santanubanik2k@gmail.com` with a verified email. Tabs: Dashboard,
  Orders (verify/reject/deliver, price-integrity check, chime on new orders), BAJUS rates (publish + history),
  Products (CRUD, photo upload → resized JPEG data URL), In-store sale (POS with discount/VAT/advance), Settings,
  Customers (registered users + guests aggregated by phone). Dashboard: greeting, 5 KPIs, 14-day sales bars, status donut,
  best sellers, payment mix, newest customers. Orders CSV export. Dark mode (LS `mj_admin_theme`).

## Server (Vercel functions, `api/`, no npm deps)
- `api/_lib.js` helpers (service-account JWT → Firestore REST, price re-check, admin ID-token check, Apps Script mail).
- `api/pay/config` (is SSL on), `api/pay/init` (re-checks price, opens SSLCommerz session), `api/pay/callback?r=success|fail|cancel|ipn`
  (validates with SSLCommerz, marks order + orderStatus paid, emails), `api/notify` (admin status change → customer email).
- Env vars on Vercel: FIREBASE_SERVICE_ACCOUNT, SSLCZ_STORE_ID, SSLCZ_STORE_PASSWORD, SSLCZ_LIVE, SHEET_SECRET (= Code.gs SECRET). See PAYMENTS-EMAIL-SETUP.md.
- Test server code with Node and a fake `fetch` (`L.setFetch`) — never call the real gateway or Firebase from tests.
- Emails are sent by `google-apps-script/Code.gs` (MailApp): order confirmation on new order; `type:'mail'` + secret for updates.

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

## Speed rules (v7)
- `html.lite` is set in each page's <head> script for phones / low-power devices (`?fx=full` or `?fx=lite` to force):
  no backdrop-filter, opaque glass, fewer gems at 30 fps, no blob motion. Backdrop blur over animated layers was the main lag.
- Never animate SVG transforms or layout properties in infinite loops (twinkle is opacity-only); keyframe names must be unique
  (`ring` clashed once). Pointer handlers go through `raf1`; the gems canvas pauses while scrolling.
- Page changes use cross-document View Transitions + speculation-rules prefetch; fonts load non-blocking; Firebase loads on idle
  for home/shop/about/contact/calc. Admin redraws only the visible tab once per frame (`refresh()`, `shown()`), orders page in 40s.

## Common updates
- New BAJUS rate: owner publishes it in admin.html (no push). Fallback: edit `rates.json` and `BUILTIN`.
- Every new UI string needs both `bn` and `en` keys (I18N in app.js; admin strings in `A` in admin.js).
- Keep the invoice print palette white/black/gold; check it still fits one A4 page.
- Test headless (Playwright) at 1440 and 390 widths before pushing; `node --check assets/app.js`.
  For admin/order flows, copy the site and replace `assets/fb.js` with an in-memory mock exporting the same API
  (incl. `setOrderStatus(id, status, extra, pub)`, `idToken()`, and the account functions signUp/signIn/signInGoogle/
  getProfile/saveProfile/onMyOrders/onUsers with an auth listener list); stub `/api/*` with Playwright routes.
