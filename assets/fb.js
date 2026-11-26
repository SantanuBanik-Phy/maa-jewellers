/* =====================================================================
   MAA JEWELLERS — Firebase layer (Firestore + Authentication)
   Loaded on demand by app.js / admin.js with import('./fb.js').
   Every function is safe to call when Firebase is not configured:
   it resolves to null / does nothing.
   ===================================================================== */
import { firebaseConfig, ADMIN_EMAIL } from './firebase-config.js';

const V = '12.11.0';
export const enabled = !!(firebaseConfig && firebaseConfig.apiKey && !/^PASTE/.test(firebaseConfig.apiKey));
export const adminEmail = ADMIN_EMAIL;

let F = null, A = null, db = null, auth = null, ready = null;
function init() {
  if (!enabled) return Promise.resolve(false);
  if (ready) return ready;
  ready = Promise.all([
    import(`https://www.gstatic.com/firebasejs/${V}/firebase-app.js`),
    import(`https://www.gstatic.com/firebasejs/${V}/firebase-firestore.js`),
    import(`https://www.gstatic.com/firebasejs/${V}/firebase-auth.js`)
  ]).then(([appM, fsM, authM]) => {
    const app = appM.initializeApp(firebaseConfig);
    F = fsM; A = authM;
    db = fsM.getFirestore(app);
    auth = authM.getAuth(app);
    return true;
  }).catch(err => { console.warn('Firebase could not load', err); ready = null; return false; });
  return ready;
}
const D = (...p) => F.doc(db, ...p);
const now = () => F.serverTimestamp();
const plain = (snap) => { const d = snap.data() || {}; Object.keys(d).forEach(k => { if (d[k] && typeof d[k].toMillis === 'function') d[k] = d[k].toMillis(); }); return d; };

/* ---------------- Public (anyone) ---------------- */
export async function onRates(cb) {
  if (!(await init())) return null;
  return F.onSnapshot(D('public', 'rates'), s => cb(s.exists() ? plain(s) : null), () => cb(null));
}
export async function onSettings(cb) {
  if (!(await init())) return null;
  return F.onSnapshot(D('public', 'settings'), s => cb(s.exists() ? plain(s) : null), () => cb(null));
}
export async function onProducts(cb) {
  if (!(await init())) return null;
  return F.onSnapshot(F.collection(db, 'products'), q => {
    const list = q.docs.map(d => Object.assign({ id: d.id }, plain(d)));
    list.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
    cb(list);
  }, () => cb(null));
}
export async function trxUsed(trx) {
  if (!trx || !(await init())) return false;
  try { return (await F.getDoc(D('trx', trx))).exists(); } catch (e) { return false; }
}
/* Creates the order, its public status and the TrxID lock in ONE batch.
   The rules refuse a TrxID that already exists → duplicate payments are impossible. */
export async function placeOrder(order) {
  if (!(await init())) return { ok: false, offline: true };
  const b = F.writeBatch(db);
  b.set(D('orders', order.id), Object.assign({}, order, { createdAt: now() }));
  b.set(D('orderStatus', order.id), {
    status: order.status, updatedAt: now(),
    method: order.pay ? order.pay.method : '', paid: order.pay ? order.pay.amount : 0,
    due: order.pay ? order.pay.due : order.grand, grand: order.grand
  });
  const trx = order.pay && order.pay.trx;
  if (trx) b.set(D('trx', trx), { order: order.id, at: now() });
  try { await b.commit(); return { ok: true, status: order.status }; }
  catch (err) {
    if (trx && await trxUsed(trx)) return { ok: false, dup: true };
    return { ok: false, error: String(err && err.code || err) };
  }
}
export async function onOrderStatus(id, cb) {
  if (!id || !(await init())) return null;
  return F.onSnapshot(D('orderStatus', id), s => cb(s.exists() ? plain(s) : null), () => cb(null));
}

/* ---------------- Customer accounts ---------------- */
export async function signUp(email, password, name) {
  await init(); await A.setPersistence(auth, A.browserLocalPersistence);
  const c = await A.createUserWithEmailAndPassword(auth, email, password);
  if (name) { try { await A.updateProfile(c.user, { displayName: name }); } catch (e) { /* */ } }
  try { await A.sendEmailVerification(c.user); } catch (e) { /* */ }
  return c.user;
}
export async function signIn(email, password) {
  await init(); await A.setPersistence(auth, A.browserLocalPersistence);
  return (await A.signInWithEmailAndPassword(auth, email, password)).user;
}
export async function signInGoogle() {
  await init(); await A.setPersistence(auth, A.browserLocalPersistence);
  const p = new A.GoogleAuthProvider(); p.setCustomParameters({ prompt: 'select_account' });
  try { return (await A.signInWithPopup(auth, p)).user; }
  catch (e) {
    if (/popup-blocked|operation-not-supported|web-storage/.test(e.code || '')) { await A.signInWithRedirect(auth, p); return null; }
    throw e;
  }
}
export async function getProfile(uid) { if (!(await init())) return null; const s = await F.getDoc(D('users', uid)); return s.exists() ? plain(s) : null; }
export async function saveProfile(uid, data) { await init(); await F.setDoc(D('users', uid), Object.assign({}, data, { updatedAt: now() }), { merge: true }); }
export async function onMyOrders(uid, cb) {
  if (!uid || !(await init())) return null;
  return F.onSnapshot(F.query(F.collection(db, 'orders'), F.where('uid', '==', uid), F.limit(100)),
    q => cb(q.docs.map(d => Object.assign({ id: d.id }, plain(d))).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))), err => cb([], err));
}
export async function onUsers(cb) {
  if (!(await init())) return null;
  return F.onSnapshot(F.query(F.collection(db, 'users'), F.limit(1000)), q => cb(q.docs.map(d => Object.assign({ uid: d.id }, plain(d)))), err => cb(null, err));
}

/* ---------------- Admin ---------------- */
export const isAdmin = (u) => !!(u && u.email && u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase());
export async function onAuth(cb) {
  if (!(await init())) { cb(null); return null; }
  return A.onAuthStateChanged(auth, cb);
}
export async function login(email, password) {
  await init();
  await A.setPersistence(auth, A.browserLocalPersistence);
  return A.signInWithEmailAndPassword(auth, email, password);
}
export async function idToken() { if (!(await init()) || !auth.currentUser) return null; return auth.currentUser.getIdToken(); }
export async function logout() { if (await init()) await A.signOut(auth); }
export async function resetPassword(email) { await init(); return A.sendPasswordResetEmail(auth, email); }
export async function sendVerify() { await init(); if (auth.currentUser) return A.sendEmailVerification(auth.currentUser); }
export async function reloadUser() { await init(); if (auth.currentUser) { await auth.currentUser.reload(); await auth.currentUser.getIdToken(true); return auth.currentUser; } return null; }

export async function publishRates(r, by) {
  await init();
  const data = { date: r.date, k22: r.k22, k21: r.k21, k18: r.k18, trad: r.trad, updatedAt: now(), updatedBy: by || '' };
  const b = F.writeBatch(db);
  b.set(D('public', 'rates'), data);
  b.set(F.doc(F.collection(db, 'rateHistory')), data);
  await b.commit();
}
export async function onRateHistory(cb) {
  if (!(await init())) return null;
  return F.onSnapshot(F.query(F.collection(db, 'rateHistory'), F.orderBy('updatedAt', 'desc'), F.limit(20)),
    q => cb(q.docs.map(d => plain(d))), () => cb([]));
}
export async function saveSettings(s) { await init(); await F.setDoc(D('public', 'settings'), Object.assign({}, s, { updatedAt: now() }), { merge: true }); }

export async function onOrders(cb) {
  if (!(await init())) return null;
  return F.onSnapshot(F.query(F.collection(db, 'orders'), F.orderBy('createdAt', 'desc'), F.limit(500)),
    q => cb(q.docs.map(d => Object.assign({ id: d.id }, plain(d)))), err => cb(null, err));
}
export async function onSmsLog(cb) {
  if (!(await init())) return null;
  return F.onSnapshot(F.query(F.collection(db, 'smsPay'), F.orderBy('at', 'desc'), F.limit(12)),
    q => cb(q.docs.map(d => Object.assign({ id: d.id }, plain(d)))), () => cb(null));
}
export async function setOrderStatus(id, status, extra, pub) {
  await init();
  const b = F.writeBatch(db);
  const o = Object.assign({ status, statusAt: now() }, extra || {});
  if (status === 'Verified') o.verifiedAt = now();
  b.update(D('orders', id), o);
  b.set(D('orderStatus', id), Object.assign({ status, updatedAt: now() }, pub || {}), { merge: true });
  await b.commit();
}
export async function createAdminOrder(order) {
  await init();
  const b = F.writeBatch(db);
  b.set(D('orders', order.id), Object.assign({}, order, { createdAt: now() }));
  b.set(D('orderStatus', order.id), { status: order.status, updatedAt: now(), method: order.pay ? order.pay.method : '', paid: order.pay ? order.pay.amount : 0, due: order.pay ? order.pay.due : order.grand, grand: order.grand });
  if (order.pay && order.pay.trx) b.set(D('trx', order.pay.trx), { order: order.id, at: now() });
  await b.commit();
}

export async function saveProduct(p) {
  await init();
  const id = p.id || ('p' + Date.now().toString(36));
  const data = Object.assign({}, p); delete data.id;
  await F.setDoc(D('products', id), Object.assign(data, { updatedAt: now() }));
  return id;
}
export async function deleteProduct(id) { await init(); await F.deleteDoc(D('products', id)); }
export async function seedProducts(list) {
  await init();
  const b = F.writeBatch(db);
  list.forEach((p, i) => { const d = Object.assign({}, p, { order: i, updatedAt: now() }); delete d.id; b.set(D('products', p.id), d); });
  await b.commit();
}
