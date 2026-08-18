/**
 * app.js — نقطة إقلاع الواجهة: يتحقق من الجلسة، يعرض بيانات المستخدم
 * الحالي، يربط التنقل بين الشاشات، ويشغّل الشاشة الافتراضية.
 * لا يحتوي هذا الملف على أي منطق بيانات — كل ذلك في js/views/*.
 */

function switchView(view) {
  document.querySelectorAll('.view-section').forEach((s) => s.classList.remove('active'));
  document.getElementById('view-' + view).classList.add('active');
  document.querySelectorAll('.nav-item').forEach((b) => b.classList.remove('active'));
  document.querySelector(`.nav-item[data-view="${view}"]`).classList.add('active');

  if (view === 'dashboard') renderDashboard();
  if (view === 'members') renderMembersTable();
  if (view === 'weight') initWeightView();
  if (view === 'pos') initPosView();
  if (view === 'reports') initReportsView();
  if (view === 'settings') initSettingsView();
  if (view === 'vip') initVipView();
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('collapsed');
}

function updateClock() {
  const now = new Date();
  document.getElementById('header-time').textContent = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  document.getElementById('header-date').textContent = now.toLocaleDateString('ar-EG', { weekday: 'long', day: '2-digit', month: 'long' });
}

/** يعرض اسم/دور المستخدم المسجَّل دخوله في تذييل الشريط الجانبي، ويخفي
 *  أزراراً معينة إن لم تكن لديه الصلاحية المناسبة (مثال: "مشترك جديد"). */
function renderCurrentUser() {
  const user = window.Auth.getUser();
  if (!user) return;
  document.getElementById('current-user-name').textContent = user.fullName;
  document.getElementById('current-user-role').textContent = user.roleName;
  document.getElementById('current-user-avatar').textContent = user.fullName.trim()[0] || '؟';

  if (!window.Auth.hasPermission('members.create')) {
    document.querySelectorAll('[data-requires="members.create"]').forEach((el) => el.classList.add('hidden'));
  }
}

let searchDebounceTimer = null;
function wireGlobalSearch() {
  const input = document.getElementById('global-search');
  input.addEventListener('input', () => {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      const q = input.value.trim();
      if (!q) return;
      switchView('members');
      document.getElementById('members-search').value = q;
      renderMembersTable();
    }, 300); // تأخير بسيط حتى لا يُرسَل طلب مع كل ضغطة حرف
  });
}

function init() {
  if (!window.Auth.requireAuth()) return; // يُعيد التوجيه لصفحة الدخول تلقائياً إن لزم

  renderCurrentUser();
  wireGlobalSearch();
  initNotifications();
  updateClock();
  setInterval(updateClock, 1000);

  switchView('dashboard');
  lucide.createIcons();
}

document.addEventListener('DOMContentLoaded', init);
