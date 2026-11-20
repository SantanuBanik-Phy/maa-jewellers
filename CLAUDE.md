# Maa Jewellers website — notes for updates

Static site (no build step) for মা জুয়েলার্স / Maa Jewellers, Parashuram Bazar, Feni.
Hosted on Vercel from this repo: every push to `main` redeploys automatically.

## Files
- `index.html` `shop.html` `calculator.html` `checkout.html` `invoice.html` `about.html` `contact.html`
- `assets/app.js` — all logic and all Bangla/English text (I18N dict). Top of file:
  - `CONFIG` — phone, WhatsApp, bKash, Nagad, Bangla QR, making %, `sheetUrl` (Google Apps Script /exec URL)
  - `BUILTIN` — fallback BAJUS rates per bhori (`rates.json` overrides when hosted)
  - `PRODUCTS` — catalogue (name bn/en, cat, carat, weight in bhori, gem, badge)
- `assets/style.css` — design (glass, dark/light), print invoice (white · black · gold only)
- `rates.json` — today's BAJUS rates: `{date, k22, k21, k18, trad}` (taka per bhori, VAT incl.)
- `assets/img/` — Bangla QR (colour for site, `-plain` B/W for invoice, poster for download). Verified scannable.
- `google-apps-script/Code.gs` — Google Sheet backend (orders, TrxID duplicate check, SMS auto-verify). Never put the real SECRET here (repo is public).

## Common updates
- New BAJUS rate: edit `rates.json` (and `BUILTIN` in app.js). Source: BAJUS announcements in BD news.
- Every new UI string needs both `bn` and `en` keys in I18N.
- Keep the invoice print palette white/black/gold; check it still fits one A4 page.
- Test pages headless (Playwright) at 1440 and 390 widths before pushing; `node --check assets/app.js`.
