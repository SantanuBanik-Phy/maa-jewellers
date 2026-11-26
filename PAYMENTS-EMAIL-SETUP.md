# Online payment (SSLCommerz) + customer emails — setup
# অনলাইন পেমেন্ট (SSLCommerz) ও গ্রাহকের ইমেইল — সেটআপ

Everything else (cash on delivery, home delivery, advance for custom orders, quantity, reference photos, bKash/Nagad/QR with TrxID) already works.
The steps below switch on **card / bKash / Nagad / Rocket payment through SSLCommerz** and **automatic emails**.
Until they're done, the "Online payment" option simply doesn't show at checkout.

বাকি সব (ক্যাশ অন ডেলিভারি, হোম ডেলিভারি, কাস্টম অর্ডারে অগ্রিম, পরিমাণ, রেফারেন্স ছবি) এখনই চালু। নিচের ধাপগুলো করলে SSLCommerz অনলাইন পেমেন্ট ও স্বয়ংক্রিয় ইমেইল চালু হবে।

Never send passwords or keys in chat — paste them only into Vercel / Firebase / Apps Script as shown.
পাসওয়ার্ড বা কী কখনো চ্যাটে পাঠাবেন না — শুধু নিচের জায়গাগুলোতে বসাবেন।

---

## Costs at a glance · খরচ এক নজরে
| Way to pay | Cost to the shop | Notes |
|---|---|---|
| bKash / Nagad Send Money + **free SMS auto-check** (section F) | no gateway fee | A customer can send at most ৳50,000 a day — the checkout now blocks bigger amounts and points to Bangla QR. |
| Bangla QR (Islami Bank) | bank's QR charge (Bangladesh Bank removed the 1% minimum from Oct 2026 — ask the bank) | Good for big amounts from any bank app. |
| SSLCommerz (cards + all wallets on one page) | one-time sign-up fee + about 2–2.5% per payment (confirm with SSLCommerz) | Free sandbox to test; needs trade licence for live. |

বিকাশ/নগদ + বাংলা কিউআর-এ কোনো গেটওয়ে ফি নেই; সেকশন F করলে পেমেন্ট নিজে থেকেই যাচাই হবে। কার্ডে টাকা নিতে চাইলে তখন SSLCommerz (সেকশন C)।

## A. Publish the new Firestore rules · নতুন রুলস প্রকাশ (1 min)
Firebase console → Firestore Database → **Rules** → delete all → paste the whole `firestore.rules` file from this repo → **Publish**.
(Needed for cash-on-delivery and online orders to save.)

## B. Firebase service account → Vercel (3 min)
The payment server needs this to mark orders "paid" after SSLCommerz confirms.
1. Firebase console → ⚙ Project settings → **Service accounts** → **Generate new private key** → a `.json` file downloads.
2. vercel.com → project **maa-jewellers-shop** → Settings → **Environment Variables** → Add:
   - Name `FIREBASE_SERVICE_ACCOUNT` → Value: open the .json file in Notepad, copy **everything**, paste.
3. Keep the .json file private (don't upload it to GitHub).

## C. SSLCommerz store → Vercel (test first, then live)
1. **Test (sandbox):** register at https://developer.sslcommerz.com/registration/ → you get a *Store ID* and *Store Password* by email.
2. Vercel → Environment Variables → add:
   - `SSLCZ_STORE_ID` = your store id
   - `SSLCZ_STORE_PASSWORD` = your store password (the API password from the email)
   - `SSLCZ_LIVE` = `false`
3. Vercel → **Deployments** → ⋯ on the latest → **Redeploy** (environment variables apply only after a redeploy).
4. Test on the website: checkout → "Online payment" → you'll see the SSLCommerz sandbox page. Use their test card / bKash test numbers.
5. **Live (real money):** apply for a merchant account at https://sslcommerz.com (trade licence, NID, bank account). When approved, change the two values to your live store id/password, set `SSLCZ_LIVE` = `true`, and redeploy.
   In the SSLCommerz merchant panel set the **IPN URL** to `https://maa-jewellers-shop.vercel.app/api/pay/callback?r=ipn`.

How it is protected: the customer never chooses the amount. The server re-checks every price against your published BAJUS rates and making charge, asks SSLCommerz to validate each payment, and only then marks the order paid (invoice unlocks automatically).

## D. Customer emails (Google Sheet script) · গ্রাহকের ইমেইল (5 min)
Emails are sent from your own Gmail by the Google Sheet script you already use.
1. Open your Google Sheet → **Extensions → Apps Script**.
2. Replace all the code with the new `google-apps-script/Code.gs` from this repo.
3. At the top, change `SECRET: 'CHANGE-THIS-maa-2026-secret'` to your own secret (letters/numbers, e.g. `Maa7Feni2026xQ`). If your SMS forwarder uses the old secret, update it there too.
4. **Deploy → Manage deployments → ✏ Edit → Version: New version → Deploy.** (Same link, no change needed on the website.) Allow the "send email as you" permission when asked.
5. Run **setup** once (▶ Run → setup) so the sheet gets the new statuses and the Email column.
6. Vercel → Environment Variables → add `SHEET_SECRET` = the same secret as step 3 → Redeploy.

What customers receive:
- **Order confirmation** — right after ordering (when they typed an email).
- **Payment received** — when SSLCommerz confirms an online payment.
- **Order update** — when you press Verify / Delivered / Reject in the admin panel.
Gmail allows about 100 emails a day; each address gets at most 4 emails an hour (stops misuse).

## F. Free automatic payment check (bKash / Nagad SMS) · ফ্রি স্বয়ংক্রিয় পেমেন্ট যাচাই (10 min)
When a customer pays by bKash / Nagad Send Money (or Bangla QR) and types the TrxID, the shop phone gets a
"You have received Tk …" SMS. The phone forwards it to the website, which finds the order with that TrxID,
checks the amount (and the sender number, if the customer typed it) and marks it **Verified** / **Advance paid** —
the customer's invoice unlocks and the email goes out. No gateway, no fee.

গ্রাহক বিকাশ/নগদে টাকা পাঠিয়ে TrxID দিলে দোকানের ফোনে যে “টাকা পেয়েছেন” SMS আসে, সেটি ওয়েবসাইটে চলে যাবে —
TrxID ও টাকা মিললে অর্ডার নিজে থেকে যাচাই হবে, চালান খুলে যাবে। কোনো ফি নেই।

Needs: steps **A** (rules — they now include `smsPay`), **B** (service account) and a secret (step D's `SHEET_SECRET` works; or add `SMS_SECRET`, at least 8 letters/numbers).
1. Vercel → Environment Variables: make sure `FIREBASE_SERVICE_ACCOUNT` and `SHEET_SECRET` (or `SMS_SECRET`) are there → **Redeploy**.
2. On the Android phone that receives the bKash / Nagad SMS, install an **SMS forwarder (webhook)** app, e.g. “SMS to URL Forwarder”.
3. Add a rule in the app:
   - **URL:** `https://maa-jewellers-shop.vercel.app/api/sms?key=YOUR-SECRET`
   - **Method:** POST · **Body (JSON):** `{"from":"%from%","text":"%text%"}` (some apps write `{sender}` / `{message}`)
   - **Filter:** senders `bKash`, `NAGAD`, `IBBL` (optional — the website ignores everything else anyway)
4. Allow the app to run in the background (turn battery optimisation off for it).
5. Test: send ৳10 to the shop bKash from another number → admin → **Settings → “স্বয়ংক্রিয় পেমেন্ট যাচাই (SMS)”** shows it under “সাম্প্রতিক পেমেন্ট SMS”, and the badge says **চালু**.

Safety: only SMS from the companies' sender names (bKash, NAGAD, IBBL…) count — an SMS typed from a phone number is ignored.
Each TrxID can be used once. If the amount is short → **Amount mismatch**; if the sender number differs → stays **Pending**
with an orange note on the order card so you check by hand. The website copies each SMS to the Google Sheet's
“Payments (SMS)” tab too, so point the forwarder here instead of the Apps Script link.

## E. Shop settings in the admin panel · অ্যাডমিন সেটিংস
Admin → **Settings**: home-delivery charge (default ৳150), advance % for custom orders (default 30%), cash on delivery on/off.
