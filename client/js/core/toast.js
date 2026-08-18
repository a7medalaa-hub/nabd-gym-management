/**
 * toast.js — إشعار عابر موحّد لكل نجاح/فشل عبر الواجهة بالكامل.
 */
function showToast(title, subtitle = '', icon = 'check', variant = 'success') {
  const root = document.getElementById('toast-root');
  if (!root) return;

  const colorClass = variant === 'error' ? 'border-accent-red/30 shadow-glow-amber' : 'border-accent-green/30 shadow-glow-green';
  const iconBg = variant === 'error' ? 'bg-accent-red/15 text-accent-red' : 'bg-accent-green/15 text-accent-green';

  const toast = document.createElement('div');
  toast.className = `toast-enter flex items-center gap-3 bg-surface border ${colorClass} rounded-xl px-4 py-3 min-w-[260px]`;
  toast.innerHTML = `
    <div class="w-8 h-8 rounded-full ${iconBg} flex items-center justify-center shrink-0">
      <i data-lucide="${icon}" class="w-4 h-4"></i>
    </div>
    <div class="leading-tight">
      <p class="text-sm font-semibold">${title}</p>
      ${subtitle ? `<p class="text-[11px] font-mono text-ink-500">${subtitle}</p>` : ''}
    </div>`;
  root.appendChild(toast);
  if (window.lucide) window.lucide.createIcons();

  setTimeout(() => {
    toast.style.transition = 'all .3s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-24px)';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

/** يعرض رسالة الخطأ القادمة من الـ API مباشرة (موحّدة الشكل من كل الخدمات). */
function showApiError(err) {
  showToast(err.message || 'حدث خطأ غير متوقع', '', 'alert-triangle', 'error');
}

window.showToast = showToast;
window.showApiError = showApiError;
