/* =====================================================================
   FIREBASE SETTINGS — paste your own project's values here.
   Firebase console → Project settings → General → Your apps → Web app
   → "SDK setup and configuration" → Config.
   These values are public by design (security comes from firestore.rules).
   Until apiKey is filled in, the site runs without Firebase.
   ===================================================================== */
export const firebaseConfig = {
  apiKey: "AIzaSyDvIVOWHmPs27FbqOxpDO51E3WXnJtoR6w",
  authDomain: "maa-jewellers-ee0b4.firebaseapp.com",
  projectId: "maa-jewellers-ee0b4",
  storageBucket: "maa-jewellers-ee0b4.firebasestorage.app",
  messagingSenderId: "43500123539",
  appId: "1:43500123539:web:6df32e9e7cc373d2c4e466"
};
/* The only account that can open the admin panel.
   The same email is written in firestore.rules — change both together. */
export const ADMIN_EMAIL = 'santanubanik2k@gmail.com';
