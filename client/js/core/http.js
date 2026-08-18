/**
 * http.js — عميل HTTP واحد لكل الاتصال بالـ API. كل ملف في js/api/ يمر من هنا،
 * ولا يوجد أي fetch() مباشر في أي مكان آخر بالواجهة. هذا يجعل تغيير عنوان
 * الخادم أو طريقة إرفاق التوكن أمراً في مكان واحد فقط.
 *
 * BASE_URL يشير للخادم المحلي الذي يُشغّله Electron (راجع Phase 6). أثناء
 * التطوير في متصفح عادي، يجب تشغيل `npm run dev` داخل server/ يدوياً أولاً.
 */
const API_BASE_URL = 'http://localhost:4000/api';

/**
 * request — كل الطلبات (GET/POST/PATCH/DELETE) تمر من هذه الدالة الوحيدة.
 * ترفق رمز الدخول تلقائياً، وتوحّد شكل الأخطاء، وتتعامل مع انتهاء الجلسة.
 */
async function request(path, { method = 'GET', body, isFormData = false, query } = {}) {
  const token = window.Auth.getToken();
  const headers = {};
  if (!isFormData) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let url = `${API_BASE_URL}${path}`;
  if (query) {
    const qs = new URLSearchParams(
      Object.entries(query).filter(([, v]) => v !== undefined && v !== null && v !== '')
    ).toString();
    if (qs) url += `?${qs}`;
  }

  let response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
    });
  } catch (networkErr) {
    // فشل الاتصال نفسه (الخادم المحلي متوقف) — رسالة واضحة بدل "Failed to fetch"
    throw new Error('تعذّر الاتصال بالخادم المحلي. تأكد أن التطبيق يعمل بشكل صحيح.');
  }

  // انتهاء الجلسة أو رمز غير صالح: نخرج المستخدم فوراً بدل إظهار أخطاء متتالية
  if (response.status === 401) {
    window.Auth.clearSession();
    if (!window.location.pathname.endsWith('login.html')) {
      window.location.href = 'login.html';
    }
  }

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    const message = json?.message || `خطأ غير متوقع (${response.status})`;
    const error = new Error(message);
    error.statusCode = response.status;
    error.details = json?.details;
    throw error;
  }

  return json; // { success, statusCode, message, data, meta? }
}

window.Http = {
  baseUrl: API_BASE_URL, // يُستخدم فقط لبناء روابط تنزيل مباشرة (Excel/PDF) — راجع reports.js
  get: (path, query) => request(path, { method: 'GET', query }),
  post: (path, body, opts = {}) => request(path, { method: 'POST', body, ...opts }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  delete: (path) => request(path, { method: 'DELETE' }),
};
