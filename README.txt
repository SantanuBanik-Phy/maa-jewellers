MAA JEWELLERS — WEBSITE
=======================

PAGES
  index.html        Home (live rate, featured jewellery, why us)
  shop.html         Shop — all jewellery, search, filter, quick view
  calculator.html   Cart + price calculation
  checkout.html     Payment — bKash, Nagad, Bangla QR, cash at shop
  invoice.html      Invoice — print / PDF / send on WhatsApp
  about.html        About the shop + logo story
  contact.html      Call, WhatsApp, map, message form, FAQ

  assets/style.css  Design (colours, glass, layout, print)
  assets/app.js     All logic + Bangla/English text + product list
  assets/logo.svg   The Maa Jewellers logo (use it anywhere)
  rates.json        Today's BAJUS rates (update this when BAJUS changes)
  google-apps-script/Code.gs   Google Sheet backend (orders + TrxID check)
  SETUP-GOOGLE-SHEET.md        Step-by-step setup (Bangla + English)


HOW TO RUN
  On a computer: double-click index.html (Chrome or Edge works best).
  Online: upload this whole folder to Vercel (or Netlify / any host).
  Keep the folder structure exactly as it is.


UPDATE THE GOLD RATE (when BAJUS announces a new price)
  Open rates.json and change the date and the four numbers (taka per bhori):

    {
      "date": "2026-11-20",
      "k22": 201146,
      "k21": 192106,
      "k18": 164987,
      "trad": 135886
    }

  Upload it again. Every visitor sees the new rate.
  (When opened from your computer by double-click, the site uses the
   rates written at the top of assets/app.js -> BUILTIN. Change them
   there too if you use it offline.)
  The shop owner can also press "Edit rates" on the site to set the
  shop's own price on that device.


CHANGE PHONE / WHATSAPP / MAKING CHARGE
  Open assets/app.js — the CONFIG block at the very top.


CHANGE PRODUCTS
  Open assets/app.js — the PRODUCTS list at the top.
  Each product:  name (Bangla + English), category, carat, weight in bhori.
  The sample products and weights are examples — replace them with
  your real stock. Prices are calculated automatically from the rate.

  1 bhori = 16 ana = 96 rati = 11.664 g   (so 8 ana = 0.5, 4 ana = 0.25)


LIVE INTERNATIONAL PRICE
  Updates every 60 seconds from xaus.com (backup: gold-api.com),
  dollar rate from open.er-api.com. Needs internet. It is shown for
  reference; sales and invoices use the BAJUS rate.


PAYMENT (bKash / Nagad / Bangla QR)
  Numbers are in assets/app.js -> CONFIG (bkash, nagad, qrMerchant, qrTid).
  Your Bangla QR images are in assets/img/:
    bangla-qr.png         shown on the website (colour)
    bangla-qr-plain.png   black & white, printed on the invoice
    bangla-qr-poster.jpg  full poster for customers to download
  If your QR ever changes, replace these three files (same names).

  How it works: the customer picks a method, sends money, and types the
  TrxID. The invoice shows method + TrxID + paid + due, and the customer
  can send the proof to your WhatsApp. ALWAYS check the TrxID in your own
  bKash / Nagad / bank app before handing over jewellery — a website
  without a payment-gateway contract cannot confirm payments by itself.


ORDER RECORDS IN GOOGLE SHEET + TRXID VERIFICATION
  Follow SETUP-GOOGLE-SHEET.md, then paste your Web App URL into
  assets/app.js -> CONFIG.sheetUrl. Until then the website works exactly
  as before (invoices are kept on the device only).
