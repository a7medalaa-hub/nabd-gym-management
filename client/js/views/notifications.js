/**
 * views/notifications.js — يفعّل جرس الإشعارات الموجود بالفعل في الهيدر
 * (كان زخرفياً فقط، بدون أي منطق). متصل بالكامل بـ /api/notifications.
 */
let notificationsOpen = false;

async function initNotifications() {
  await refreshNotifications();
  document.addEventListener('click', (e) => {
    const panel = document.getElementById('notifications-panel');
    const button = document.getElementById('notifications-bell');
    if (notificationsOpen && !panel.contains(e.target) && !button.contains(e.target)) {
      closeNotifications();
    }
  });
}

async function refreshNotifications() {
  try {
    const { data: items, meta } = await window.NotificationsAPI.list();
    const badge = document.getElementById('notifications-badge');
    if (meta.unreadCount > 0) {
      badge.classList.remove('hidden');
      badge.textContent = meta.unreadCount > 9 ? '9+' : meta.unreadCount;
    } else {
      badge.classList.add('hidden');
    }

    const list = document.getElementById('notifications-list');
    list.innerHTML = items.map((n) => `
      <button onclick="handleNotificationClick('${n.id}', ${!n.isRead})" class="w-full text-right px-4 py-3 border-b border-border/60 hover:bg-white/[0.03] transition-colors ${n.isRead ? 'opacity-60' : ''}">
        <div class="flex items-start gap-2">
          <span class="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${n.isRead ? 'bg-ink-700' : 'bg-accent-amber'}"></span>
          <div class="min-w-0">
            <p class="text-xs font-semibold truncate">${n.title}</p>
            <p class="text-[11px] text-ink-500 mt-0.5">${n.message}</p>
            <p class="text-[10px] text-ink-700 font-mono mt-1 ltr-num">${new Date(n.createdAt).toLocaleString('ar-EG', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>
      </button>`).join('') || `<p class="text-xs text-ink-700 text-center py-8">لا توجد إشعارات</p>`;
  } catch (err) {
    // فشل صامت هنا (لا نعرض toast) حتى لا نزعج المستخدم بخطأ عن مكوّن ثانوي في الهيدر
    console.error('تعذّر تحميل الإشعارات:', err.message);
  }
}

function toggleNotifications() {
  notificationsOpen ? closeNotifications() : openNotifications();
}
function openNotifications() {
  document.getElementById('notifications-panel').classList.remove('hidden');
  notificationsOpen = true;
  refreshNotifications();
}
function closeNotifications() {
  document.getElementById('notifications-panel').classList.add('hidden');
  notificationsOpen = false;
}

async function handleNotificationClick(id, wasUnread) {
  if (!wasUnread) return;
  try {
    await window.NotificationsAPI.markRead(id);
    refreshNotifications();
  } catch (err) {
    showApiError(err);
  }
}
