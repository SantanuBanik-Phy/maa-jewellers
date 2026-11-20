/* =====================================================================
   FIREBASE SETTINGS — paste your own project's values here.
   Firebase console → Project settings → General → Your apps → Web app
   → "SDK setup and configuration" → Config.
   These values are public by design (security comes from firestore.rules).
   Until apiKey is filled in, the site runs without Firebase.
   ===================================================================== */
export const firebaseConfig = {
  apiKey: 'PASTE-API-KEY',
  authDomain: 'PASTE-PROJECT-ID.firebaseapp.com',
  projectId: 'PASTE-PROJECT-ID',
  storageBucket: 'PASTE-PROJECT-ID.firebasestorage.app',
  messagingSenderId: 'PASTE-SENDER-ID',
  appId: 'PASTE-APP-ID'
};

/* The only account that can open the admin panel.
   The same email is written in firestore.rules — change both together. */
export const ADMIN_EMAIL = 'santanubanik2k@gmail.com';
