/**
 * notification.service.js — إشعارات النظام. هذا التطبيق يعمل فقط عندما
 * يكون مفتوحاً على جهاز الاستقبال (لا يوجد خادم يعمل ٢٤/٧ ولا مجدول مهام
 * حقيقي)، لذا فبدل نظام cron، تُولَّد الإشعارات عملياً بفحص واحد عند بدء
 * تشغيل الخادم (راجع generateSystemNotifications، تُستدعى من server.js).
 * كل فحص لا يكرر إشعاراً "غير مقروء" لنفس الحدث بالضبط، فتشغيل التطبيق
 * عدة مرات في نفس اليوم لا يُنشئ إشعارات مكررة.
 */
const { prisma } = require('../config/db');
const { parsePagination, buildMeta } = require('../utils/pagination');

async function listForCurrentUser(userId, { page, limit } = {}) {
  const { skip, page: safePage, limit: safeLimit } = parsePagination({ page, limit });
  const where = { OR: [{ userId }, { userId: null }] }; // إشعارات المستخدم + الإشعارات العامة (broadcast)

  const [rows, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: safeLimit }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { ...where, isRead: false } }),
  ]);
  return { data: rows, meta: buildMeta({ page: safePage, limit: safeLimit, total }), unreadCount };
}

async function markRead(id) {
  return prisma.notification.update({ where: { id }, data: { isRead: true } });
}

/**
 * generateSystemNotifications — يُستدعى مرة عند إقلاع الخادم. يفحص حالتين:
 * (١) اشتراكات تنتهي خلال ٣ أيام، (٢) منتجات وصلت لحد المخزون المنخفض.
 * لكل حالة يتحقق أولاً من عدم وجود إشعار غير مقروء لنفس العنصر بالفعل.
 */
async function generateSystemNotifications() {
  const now = new Date();
  const in3Days = new Date(now); in3Days.setDate(in3Days.getDate() + 3);

  const expiringSoon = await prisma.subscription.findMany({
    where: { status: { not: 'CANCELLED' }, endDate: { gte: now, lte: in3Days } },
    include: { member: true },
  });

  for (const sub of expiringSoon) {
    const exists = await prisma.notification.findFirst({
      where: { type: 'subscription_expiring', memberId: sub.memberId, isRead: false },
    });
    if (exists) continue;
    await prisma.notification.create({
      data: {
        type: 'subscription_expiring',
        memberId: sub.memberId,
        title: 'اشتراك قريب من الانتهاء',
        message: `اشتراك ${sub.member.fullName} ينتهي في ${sub.endDate.toLocaleDateString('ar-EG')}`,
      },
    });
  }

  const lowStockProducts = await prisma.product.findMany({
    where: { isActive: true },
  });
  for (const p of lowStockProducts) {
    if (p.stockQuantity > p.lowStockThreshold) continue;
    const exists = await prisma.notification.findFirst({
      where: { type: 'low_stock', title: { contains: p.name }, isRead: false },
    });
    if (exists) continue;
    await prisma.notification.create({
      data: {
        type: 'low_stock',
        title: `مخزون منخفض: ${p.name}`,
        message: `الكمية المتبقية من "${p.name}" هي ${p.stockQuantity} فقط`,
      },
    });
  }
}

module.exports = { listForCurrentUser, markRead, generateSystemNotifications };
