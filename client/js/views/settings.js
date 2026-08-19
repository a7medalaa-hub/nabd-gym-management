/**
 * views/settings.js — إعدادات الجيم والنسخ الاحتياطي المحلي، متصلة بالكامل
 * بـ /api/settings و/api/backups.
 */
async function initSettingsView() {
  await Promise.all([loadSettingsForm(), renderBackupsList()]);
}

async function loadSettingsForm() {
  try {
    const { data } = await window.SettingsAPI.getAll();
    document.getElementById('set-gym-name').value = data.gym_name || '';
    document.getElementById('set-currency').value = data.currency || '';
  } catch (err) {
    showApiError(err);
  }
}

async function saveSettings() {
  const settings = {
    gym_name: document.getElementById('set-gym-name').value.trim(),
    currency: document.getElementById('set-currency').value.trim(),
  };
  try {
    await window.SettingsAPI.update(settings);
    showToast('تم حفظ الإعدادات بنجاح', '', 'save');
  } catch (err) {
    showApiError(err);
  }
}

async function renderBackupsList() {
  const container = document.getElementById('backups-list');
  container.innerHTML = `<div class="skeleton-row"></div>`;
  try {
    const { data: backups } = await window.BackupsAPI.list();
    container.innerHTML = backups.map((b) => `
      <div class="flex items-center gap-3 bg-surface2 border border-border rounded-lg px-4 py-2.5">
        <i data-lucide="file-archive" class="w-4 h-4 text-ink-500 shrink-0"></i>
        <div class="min-w-0 flex-1">
          <p class="text-xs font-mono truncate ltr-num">${b.filename}</p>
          <p class="text-[10px] text-ink-700 ltr-num">${new Date(b.createdAt).toLocaleString('ar-EG')} · ${(b.sizeBytes / 1024).toFixed(1)} KB</p>
        </div>
        <button onclick="restoreBackupConfirm('${b.filename}')" class="text-xs font-semibold text-accent-amber hover:text-accent-amber/80 shrink-0">استعادة</button>
      </div>`).join('') || `<p class="text-xs text-ink-700 text-center py-4">لا توجد نسخ احتياطية بعد</p>`;
    lucide.createIcons();
  } catch (err) {
    container.innerHTML = `<p class="text-xs text-accent-red">${err.message}</p>`;
    showApiError(err);
  }
}

async function createBackupNow() {
  try {
    const { data } = await window.BackupsAPI.create();
    showToast('تم إنشاء نسخة احتياطية', data.filename, 'database-backup');
    renderBackupsList();
  } catch (err) {
    showApiError(err); // مثال: تعذّر تشغيل pg_dump — راجع رسالة الخادم
  }
}

async function restoreBackupConfirm(filename) {
  const confirmed = confirm(`سيتم استبدال البيانات الحالية بمحتوى "${filename}". هذا الإجراء لا يمكن التراجع عنه. هل أنت متأكد؟`);
  if (!confirmed) return;
  try {
    await window.BackupsAPI.restore(filename);
    showToast('تمت الاستعادة بنجاح', 'يُفضَّل إعادة تحميل الصفحة الآن', 'check-circle-2');
  } catch (err) {
    showApiError(err);
  }
}
document.getElementById('changePasswordForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;

  try {
    const response = await window.AuthAPI.changePassword(currentPassword, newPassword);
    
    if (response.success) {
      alert('تم تغيير كلمة المرور بنجاح!');
      e.target.reset(); // تفريغ حقول الإدخال
    } else {
      alert('خطأ: ' + (response.message || 'فشل تغيير كلمة المرور'));
    }
  } catch (error) {
    console.error(error);
    alert('حدث خطأ أثناء الاتصال بالسيرفر');
  }
});
