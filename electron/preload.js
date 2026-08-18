/**
 * preload.js — الجسر الآمن الوحيد بين الواجهة (renderer، أي client/) وعملية
 * Electron الرئيسية. contextIsolation مفعّلة (راجع main.js)، لذا لا تصل
 * صفحات client/ لأي Node API مباشرة — فقط للدوال المحدودة المُصرَّح بها هنا.
 *
 * حالياً الواجهة تتواصل مع الخادم المحلي عبر HTTP (localhost:4000/api) كما
 * لو كانت أي تطبيق ويب عادي — لذا لا حاجة فعلية لتمرير بيانات عبر preload
 * في هذه المرحلة. الجسر جاهز أدناه لأي حاجة مستقبلية (مثال: مربع حوار
 * حفظ ملف أصلي لتصدير Excel/PDF بدل رابط تنزيل عبر المتصفح).
 */
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('nabdDesktop', {
  isElectron: true,
  platform: process.platform,
});
