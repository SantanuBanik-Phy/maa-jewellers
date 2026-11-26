# মা জুয়েলার্স — Google Sheet রেকর্ড ও TrxID যাচাই সেটআপ
*(English version below)*

প্রতিটি অর্ডার (ক্রেতা, গহনা, মোট দাম, পেমেন্ট মাধ্যম, TrxID) স্বয়ংক্রিয়ভাবে আপনার Google Sheet-এ জমা হবে।
বিকাশ / নগদ / ব্যাংকের SMS এলে TrxID মিলিয়ে অর্ডারটি নিজে থেকেই **“Verified”** হয়ে যাবে।
খরচ: বিনামূল্যে (Google অ্যাকাউন্ট লাগবে)। সময়: প্রায় ১৫ মিনিট।

---

## ধাপ ১ — Google Sheet তৈরি (৫ মিনিট)

1. কম্পিউটারে **sheets.google.com** খুলুন → **Blank** (খালি শিট)।
2. উপরে নাম দিন: `Maa Jewellers — Orders`
3. মেনু থেকে **Extensions → Apps Script**।
4. সেখানে যা লেখা আছে সব মুছে, `google-apps-script/Code.gs` ফাইলের **পুরো লেখা** পেস্ট করুন।
5. উপরের দিকে এই লাইনটি বদলান (নিজের গোপন শব্দ দিন, শুধু ইংরেজি অক্ষর ও সংখ্যা):
   ```
   SECRET: 'CHANGE-THIS-maa-2026-secret',
   ```
   চাইলে `ALERT_EMAIL` এ আপনার ইমেইল দিন — প্রতিটি অর্ডার ও পেমেন্টে ইমেইল যাবে।
6. 💾 **Save** চাপুন।
7. উপরে ফাংশন তালিকা থেকে **setup** বেছে **▶ Run** চাপুন।
   - অনুমতি চাইবে: **Review permissions → আপনার অ্যাকাউন্ট → Advanced → Go to project → Allow**।
   - শিটে ৪টি ট্যাব তৈরি হবে: **Dashboard, Orders, Items, Payments (SMS)** — কালো-সোনালি রঙে।

## ধাপ ২ — ওয়েবসাইটের সাথে যুক্ত করা (৫ মিনিট)

1. Apps Script-এ **Deploy → New deployment**।
2. ⚙️ চিহ্ন থেকে **Web app** বেছে নিন।
   - **Execute as:** Me (আপনি)
   - **Who has access:** **Anyone**
3. **Deploy** → যে লিংক দেখাবে (শেষে `/exec`) সেটি **কপি** করুন।
4. ওয়েবসাইটের `assets/app.js` ফাইল খুলে উপরের দিকে এই লাইনে লিংকটি বসান:
   ```
   sheetUrl: 'https://script.google.com/macros/s/……/exec',
   ```
5. ওয়েবসাইট আবার আপলোড করুন (Vercel)।
6. পরীক্ষা: লিংকটি ব্রাউজারে খুললে `{"ok":true,"shop":"Maa Jewellers",…}` দেখাবে।
   এরপর ওয়েবসাইটে একটি পরীক্ষামূলক অর্ডার দিন — Orders ট্যাবে সারি যোগ হবে।

> **Code.gs পরে বদলালে:** Deploy → Manage deployments → ✏️ → Version: **New version** → Deploy।
> লিংক একই থাকবে।

## ধাপ ৩ — SMS দিয়ে স্বয়ংক্রিয় TrxID যাচাই (দোকানের Android ফোন)

> **নতুন (নভেম্বর ২০২৬):** এখন অর্ডার Firebase-এ থাকে, তাই ফরওয়ার্ডারের লিংক হবে ওয়েবসাইটের —
> `https://maa-jewellers-shop.vercel.app/api/sms?key=আপনার-SECRET` (PAYMENTS-EMAIL-SETUP.md → সেকশন F)।
> ওয়েবসাইট অর্ডার যাচাই করবে এবং SMS-টি এই শিটের Payments (SMS) ট্যাবেও পাঠিয়ে দেবে। নিচের পুরোনো লিংক আর দরকার নেই।

যে ফোনে বিকাশ / নগদ / ব্যাংকের টাকা আসার SMS আসে, সেই ফোনে:

1. Play Store থেকে একটি **SMS forwarder (webhook)** অ্যাপ ইনস্টল করুন — যেমন **“SMS to URL Forwarder”**
   বা যেকোনো অ্যাপ যা SMS একটি URL-এ পাঠাতে পারে।
2. অ্যাপে নতুন নিয়ম (rule) তৈরি করুন:
   - **URL:** `আপনার /exec লিংক` + `?key=আপনার-SECRET`
     উদাহরণ: `https://script.google.com/macros/s/AKfy…/exec?key=maa2026secret`
   - **Method:** POST
   - **Body / JSON template:** `{"from":"%from%","text":"%text%"}`
     (কিছু অ্যাপে চিহ্ন আলাদা, যেমন `{sender}` / `{message}` — অ্যাপের নির্দেশনা দেখুন)
   - **Filter (ঐচ্ছিক):** প্রেরক `bKash`, `NAGAD`, `IBBL` / ব্যাংক
3. অ্যাপকে ব্যাকগ্রাউন্ডে চলার অনুমতি দিন (Battery optimisation বন্ধ)।

**কী হবে:** টাকা এলে SMS → **Payments (SMS)** ট্যাবে জমা হবে → TrxID কোনো অর্ডারের সাথে মিললে এবং টাকার পরিমাণ ঠিক থাকলে
অর্ডার **Verified** হবে। ক্রেতার চালান পাতাতেও নিজে থেকে **“যাচাইকৃত ✓”** দেখাবে এবং স্ট্যাম্প হবে **PAID · VERIFIED**।
পরিমাণ কম হলে **Amount mismatch** (লাল) দেখাবে।

> SMS-এর ভাষা কোম্পানি মাঝে মাঝে বদলায়। কোনো SMS ঠিকমতো না পড়লে Payments (SMS) ট্যাবে “No TrxID found” দেখাবে —
> তখন হাতে যাচাই করুন, আর সেই SMS-এর লেখা ডেভেলপারকে দিন যাতে `parseSms_` অংশ ঠিক করা যায়।
> Apps Script-এ **testSms** চালিয়ে পড়া পরীক্ষা করা যায়।

## প্রতিদিনের ব্যবহার

- **Dashboard** ট্যাব: আজকের অর্ডার ও বিক্রি, যাচাইকৃত টাকা, অপেক্ষমাণ যাচাই, সমস্যা, মোট বাকি।
- **Orders** ট্যাবের **Status** কলামে ড্রপডাউন:
  `Pending` · `Verified` · `Amount mismatch` · `Duplicate TrxID` · `Cash at shop` · `Not paid` · `Rejected` · `Delivered`
  — হাতে **Verified** করলে সময় নিজে থেকে লেখা হবে; গহনা দিয়ে দিলে **Delivered** করুন।
- একই TrxID দ্বিতীয়বার দিলে ওয়েবসাইট আটকে দেয়, আর শিটে **Duplicate TrxID** (লাল) দেখায়।
- ⚠️ **গহনা হস্তান্তরের আগে সবসময় নিজের বিকাশ / নগদ / ব্যাংক অ্যাপে টাকা এসেছে কিনা দেখে নিন।**

## নিরাপত্তা

- শিটটি শুধু আপনার Google অ্যাকাউন্টে — অন্য কেউ দেখতে পারে না।
- ওয়েব লিংক শুধু নতুন অর্ডার নেয় আর অর্ডারের *অবস্থা* (Pending/Verified) জানায় — কোনো ক্রেতার তথ্য ফেরত দেয় না।
- SMS পাঠাতে গোপন `key` লাগে, তাই অন্য কেউ ভুয়া পেমেন্ট “Verified” করাতে পারবে না।
- শিটে আসা লেখা কখনো ফর্মুলা হিসেবে চলে না।

---

# English

**What you get:** every order from the website (customer, items, totals, payment method, TrxID) is saved to your
Google Sheet. When the bKash / Nagad / bank SMS arrives on the shop phone, its TrxID and amount are matched and the
order turns **Verified** automatically — the customer's invoice page updates to "Verified ✓" by itself.

### 1. Sheet (5 min)
1. sheets.google.com → Blank → name it `Maa Jewellers — Orders`.
2. **Extensions → Apps Script** → delete everything → paste all of `google-apps-script/Code.gs`.
3. Change `SECRET` to your own word (letters/numbers). Optional: `ALERT_EMAIL`.
4. Save → choose **setup** → **▶ Run** → allow permissions (Advanced → Go to project → Allow).
   Tabs created: Dashboard, Orders, Items, Payments (SMS).

### 2. Connect the website (5 min)
1. **Deploy → New deployment → Web app** · Execute as **Me** · Who has access **Anyone** → Deploy.
2. Copy the Web app URL (ends with `/exec`).
3. In `assets/app.js` set `sheetUrl: 'https://script.google.com/macros/s/…/exec'` and upload the site again.
4. Opening the URL in a browser shows `{"ok":true,…}`. Place a test order — a row appears in **Orders**.
5. After editing Code.gs later: Deploy → Manage deployments → ✏️ → Version: **New version** → Deploy (same URL).

### 3. Automatic TrxID verification (Android phone that receives the SMS)
Install an SMS-to-webhook forwarder app (for example "SMS to URL Forwarder"). Create a rule:
- URL: `<your /exec URL>?key=<your SECRET>` · Method: POST
- Body: `{"from":"%from%","text":"%text%"}` (placeholder names differ by app)
- Optional filter: senders bKash, NAGAD, your bank. Turn off battery optimisation for the app.

SMS lands in **Payments (SMS)** → if the TrxID matches an order and the amount is enough → **Verified**;
if the amount is lower → **Amount mismatch**. If an SMS format isn't recognised it shows "No TrxID found" — verify by
hand and send that SMS text to your developer to update `parseSms_` (run **testSms** to try it).

### Daily use
- **Dashboard:** today's orders and sales, verified money, pending checks, problems, total due.
- **Status** dropdown in Orders: set Verified by hand (time is stamped), Rejected, or Delivered.
- A TrxID can't be used twice — the website blocks it and the sheet marks it red.
- ⚠️ Always confirm the money in your own bKash / Nagad / bank app before handing over jewellery.

### Why not the official bKash/Nagad API?
Their payment-gateway APIs (which confirm payments instantly) need a **merchant account and agreement** with bKash /
Nagad, plus a server to keep the secret keys. If you get a merchant account later, the website's payment page can be
switched to it; the Google Sheet records keep working the same way.
