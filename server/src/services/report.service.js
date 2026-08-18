/**
 * report.service.js — تجميع بيانات مالية لعرضها كرسوم بيانية. الجمع بين
 * إيراد الاشتراكات (Payment) ومبيعات البار (Sale) في نفس السلسلة الزمنية
 * يتم في الكود (JavaScript) لا في SQL، لأنهما جدولان منفصلان تماماً —
 * موثّق هنا حتى لا يُظن أنه استعلام SQL مُوحَّد ناقص.
 */
const { prisma } = require('../config/db');

function defaultRange(from, to) {
  const end = to ? new Date(to) : new Date();
  const start = from ? new Date(from) : new Date(end.getTime() - 29 * 86400000); // آخر ٣٠ يوماً افتراضياً
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function dateKey(d) {
  return new Date(d).toISOString().slice(0, 10);
}

async function revenueByDay(from, to) {
  const { start, end } = defaultRange(from, to);

  const [payments, sales] = await Promise.all([
    prisma.payment.findMany({ where: { createdAt: { gte: start, lte: end } }, select: { amount: true, createdAt: true } }),
    prisma.sale.findMany({ where: { createdAt: { gte: start, lte: end } }, select: { totalAmount: true, createdAt: true } }),
  ]);

  const byDay = {};
  const bump = (date, amount) => {
    const key = dateKey(date);
    byDay[key] = (byDay[key] || 0) + Number(amount);
  };
  payments.forEach((p) => bump(p.createdAt, p.amount));
  sales.forEach((s) => bump(s.createdAt, s.totalAmount));

  // نضمن ظهور كل يوم في المدى حتى لو كان إيراده صفراً (يمنع فجوات في الرسم البياني)
  const days = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = dateKey(d);
    days.push({ date: key, total: byDay[key] || 0 });
  }
  return days;
}

async function expensesByCategory(from, to) {
  const { start, end } = defaultRange(from, to);
  const grouped = await prisma.expense.groupBy({
    by: ['category'],
    where: { expenseDate: { gte: start, lte: end } },
    _sum: { amount: true },
    orderBy: { _sum: { amount: 'desc' } },
  });
  return grouped.map((g) => ({ category: g.category, total: Number(g._sum.amount || 0) }));
}

async function summary(from, to) {
  const { start, end } = defaultRange(from, to);
  const [revenueDays, expenseCategories] = await Promise.all([revenueByDay(from, to), expensesByCategory(from, to)]);
  const totalRevenue = revenueDays.reduce((s, d) => s + d.total, 0);
  const totalExpenses = expenseCategories.reduce((s, c) => s + c.total, 0);
  return {
    range: { from: start.toISOString(), to: end.toISOString() },
    totalRevenue, totalExpenses, netProfit: totalRevenue - totalExpenses,
    revenueByDay: revenueDays, expensesByCategory: expenseCategories,
  };
}

module.exports = { revenueByDay, expensesByCategory, summary };
