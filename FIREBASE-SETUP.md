# Firebase setup — admin panel, live prices, orders
# ফায়ারবেস সেটআপ — অ্যাডমিন প্যানেল, লাইভ দর, অর্ডার

Takes about 15 minutes, free (Spark plan). Until you finish, the website still works with the built-in rates and the default catalogue, and the admin page shows "Firebase is not connected yet".

প্রায় ১৫ মিনিট লাগে, বিনামূল্যে (Spark প্ল্যান)। শেষ না হওয়া পর্যন্ত ওয়েবসাইট আগের মতো চলবে।

---

## 1. Create the project · প্রজেক্ট তৈরি
1. Go to https://console.firebase.google.com → **Add project** → name it `maa-jewellers` → Google Analytics can be off → **Create**.
2. On the project home click the **</>** (Web) icon → app nickname `website` → **Register app**.
3. Firebase shows a `firebaseConfig = { … }` block. Keep this page open (step 5).

## 2. Turn on email/password login · ইমেইল-পাসওয়ার্ড লগইন চালু
1. Left menu **Build → Authentication → Get started**.
2. **Sign-in method → Email/Password → Enable → Save**.
3. **Users → Add user** → Email `santanubanik2k@gmail.com`, choose a strong password → **Add user**.
   - This password is what you type on `/admin.html`. Nobody else (including Claude) needs it.
   - এই পাসওয়ার্ড দিয়েই `/admin.html`-এ লগইন করবেন।
4. **Settings → Authorized domains → Add domain** → add your Vercel domain, e.g. `maa-jewellers.vercel.app` (and your own domain later).

## 3. Create the database · ডাটাবেস তৈরি
1. **Build → Firestore Database → Create database** → location `asia-south1 (Mumbai)` → **Start in production mode** → **Create**.
2. Open the **Rules** tab, delete everything, paste the whole content of `firestore.rules` from this repo → **Publish**.
   - The rules make sure only `santanubanik2k@gmail.com` (with a verified email) can change prices, products, settings and order status. Customers can only place orders and see the status of their own order number.

## 4. Paste the config · কনফিগ বসান
Open `assets/firebase-config.js` and replace the `PASTE-…` values with the values from step 1.3:
```js
export const firebaseConfig = {
  apiKey: 'AIza…',
  authDomain: 'maa-jewellers.firebaseapp.com',
  projectId: 'maa-jewellers',
  storageBucket: 'maa-jewellers.firebasestorage.app',
  messagingSenderId: '1234567890',
  appId: '1:1234567890:web:abc123'
};
```
These values are **not secret** — every Firebase website ships them; the security comes from the rules in step 3. Commit and push → Vercel redeploys in ~30 s.

## 5. First login · প্রথম লগইন
1. Open `https://<your-site>/admin.html` → sign in with the email and password from step 2.3.
2. A yellow banner says the email is not verified → **Send verification email** → open Gmail, click the link → back in the admin, **I have verified**.
3. **Products → Add default catalogue** (puts the 18 products with photos into the database — then you can edit, add photos, mark sold out, hide, or delete).
4. **BAJUS rates** → enter today's rates → **Publish rates**. Every customer page updates within a second.
5. **Settings** → making charge %, price-lock minutes, bKash/Nagad numbers, optional notice banner.

## Daily use · প্রতিদিনের কাজ
- New BAJUS rate → Admin → **BAJUS rates → Publish** (no code, no push needed).
- New online order → you hear a chime, the Orders tab shows a red count. Check the TrxID in your bKash/Nagad/bank app → **Verify ✓**. The customer's invoice and the Track page turn "Verified" instantly. When the piece is handed over → **Delivered**.
- "⚠ Price mismatch" on an order = the amounts don't match your published rates; check before verifying.
- In-store sale → **In-store sale** tab → add pieces, discount/VAT/advance, payment → **Create & save invoice** (opens the printable invoice).

## Forgot the password? · পাসওয়ার্ড ভুলে গেলে
On the admin login page click **Forgot password?** → a reset link goes to santanubanik2k@gmail.com. Or Firebase console → Authentication → Users → ⋮ → Reset password.

## Changing the admin email · অ্যাডমিন ইমেইল বদলাতে
Change it in **both** `assets/firebase-config.js` (`ADMIN_EMAIL`) and `firestore.rules` (then publish the rules again), and add that user in Authentication.
