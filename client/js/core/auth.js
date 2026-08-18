/**
 * auth.js — إدارة جلسة تسجيل الدخول على جهاز العميل (Electron/متصفح محلي).
 * تُخزَّن الجلسة في localStorage تحت مفتاح واحد فقط — لا توجد أي بيانات
 * عمل (أعضاء، مدفوعات...) مخزَّنة محلياً بعد الآن؛ كل ذلك يأتي من الـ API
 * في كل مرة. هذا هو المفتاح الوحيد المتبقي من نمط التخزين القديم، وهو
 * مخصص فقط لجلسة الدخول، وهو استخدام مقبول ومتعارف عليه لـ localStorage.
 */
const SESSION_KEY = 'gms_session';

function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setSession({ token, user }) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ token, user }));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function getToken() {
  return getSession()?.token || null;
}

function getUser() {
  return getSession()?.user || null;
}

/** hasPermission — تستخدمها الواجهة لإخفاء/تعطيل أزرار المستخدم لا يملك صلاحيتها. */
function hasPermission(key) {
  const user = getUser();
  return Boolean(user?.permissions?.includes(key));
}

/** requireAuth — يُستدعى في أول سطر من كل صفحة محمية؛ يُعيد التوجيه لصفحة الدخول إن لزم. */
function requireAuth() {
  if (!getToken()) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

function logout() {
  clearSession();
  window.location.href = 'login.html';
}

window.Auth = { getSession, setSession, clearSession, getToken, getUser, hasPermission, requireAuth, logout };
