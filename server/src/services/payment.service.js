/**
 * payment.service.js — قراءة سجل المدفوعات وحساب إيراد اليوم.
 * الإنشاء نفسه لا يحدث هنا مباشرة — يحدث ضمن transaction في
 * member.service.js (اشتراك جديد) أو subscription.service.js (تجديد)،
 * حتى لا ينفصل تسجيل الدفعة عن العملية التي سبَّبتها أبداً.
 */
const { prisma } = require('../config/db');
const { parsePagination, buildMeta } = require('../utils/pagination');

function dayBounds(date = new Date()) {
  const start = new Date(date); start.setHours(0, 0, 0, 0);
  const end = new Date(date); end.setHours(23, 59, 59, 999);
  return { start, end };
}

async function list({ page, limit, from, to, memberId }) {
  const { skip, page: safePage, limit: safeLimit } = parsePagination({ page, limit });

  const where = {
    ...(memberId ? { memberId } : {}),
    ...(from || to
      ? { createdAt: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: { member: { select: { id: true, fullName: true } }, receivedBy: { select: { id: true, fullName: true } } },
      orderBy: { createdAt: 'desc' },
      skip, take: safeLimit,
    }),
    prisma.payment.count({ where }),
  ]);

  return { data: rows, meta: buildMeta({ page: safePage, limit: safeLimit, total }) };
}

/**
 * todaySummary — إجمالي إيراد اليوم من الاشتراكات فقط. يُجمَع مع إيراد
 * مبيعات البار (sale.service.todaySummary) داخل dashboard.service.js لإنتاج
 * "إيراد اليوم" الكلي المعروض في لوحة التحكم — هذا الملف يبقى مسؤولاً عن
 * مصدر بيانات واحد فقط (مبدأ المسؤولية الواحدة).
 */
async function todaySummary() {
  const { start, end } = dayBounds();
  const result = await prisma.payment.aggregate({
    where: { createdAt: { gte: start, lte: end } },
    _sum: { amount: true },
    _count: true,
  });
  return { total: Number(result._sum.amount || 0), count: result._count };
}

module.exports = { list, todaySummary, dayBounds };
