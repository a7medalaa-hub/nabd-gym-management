/**
 * format.js — أدوات تنسيق مشتركة عبر كل شاشات الواجهة.
 */
function formatDateAr(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ar-EG', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatMoney(amount) {
  return Number(amount || 0).toLocaleString('en-US');
}

/** daysUntil — الفرق بالأيام بين الآن وتاريخ معيّن (سالب = مضى بالفعل). */
function daysUntil(dateStr) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr); target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
}

window.formatDateAr = formatDateAr;
window.formatMoney = formatMoney;
window.daysUntil = daysUntil;
