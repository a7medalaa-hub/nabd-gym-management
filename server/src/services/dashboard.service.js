/**
 * dashboard.service.js — يجمّع كل أرقام لوحة التحكم في استدعاء واحد،
 * حتى لا تُضطر الواجهة الأمامية لعمل ٤-٥ طلبات منفصلة عند كل تحميل للصفحة.
 */
const { prisma } = require('../config/db');
const paymentService = require('./payment.service');
const subscriptionService = require('./subscription.service');
const attendanceService = require('./attendance.service');
const saleService = require('./sale.service');

async function getStats() {
  const now = new Date();

  const [totalMembers, activeSubscriptionsCount, subRevenue, posRevenue, expiring, todayAttendanceCount] = await Promise.all([
    prisma.member.count({ where: { isActive: true } }),
    // عدد الأعضاء الذين لديهم اشتراك فعّال حالياً (وليس عدد الاشتراكات نفسها)
    prisma.member.count({
      where: {
        isActive: true,
        subscriptions: { some: { status: { not: 'CANCELLED' }, endDate: { gte: now } } },
      },
    }),
    paymentService.todaySummary(),
    saleService.todaySummary(), // إيراد بار الجيم اليوم — كان مؤجَّلاً في Phase 3، مبنيّ الآن
    subscriptionService.expiringSoon(10),
    attendanceService.todayCount(),
  ]);

  // الاشتراكات المنتهية فعلاً (خلال آخر ٣٠ يوماً) لا تُحسب ضمن "قريبة من الانتهاء"
  const expiringSoonOnly = expiring.filter((s) => s.endDate >= now);

  return {
    totalMembers,
    activeMembers: activeSubscriptionsCount,
    todayRevenue: subRevenue.total + posRevenue.total,
    todaySalesCount: subRevenue.count + posRevenue.count,
    todayAttendanceCount,
    expiringSoonCount: expiringSoonOnly.length,
    expiringSoonList: expiringSoonOnly.map((s) => ({
      subscriptionId: s.id,
      memberId: s.member.id,
      memberName: s.member.fullName,
      phone: s.member.phone,
      endDate: s.endDate,
      subscriptionType: s.subscriptionType.name,
    })),
  };
}

module.exports = { getStats };
