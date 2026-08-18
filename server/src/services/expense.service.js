/**
 * expense.service.js — مصروفات تشغيل الجيم. لا يوجد عمود isActive في هذا
 * الجدول (راجع schema.prisma) لأن المصروفات، خلافاً للأعضاء أو المنتجات،
 * لا يشير إليها أي جدول آخر كمرجع فرعي — فالحذف الفعلي هنا آمن ولا يكسر
 * أي سجل تاريخي مرتبط.
 */
const { prisma } = require('../config/db');
const ApiError = require('../utils/ApiError');
const { parsePagination, buildMeta } = require('../utils/pagination');

async function create(data, paidByUserId) {
  return prisma.expense.create({
    data: { ...data, expenseDate: data.expenseDate ? new Date(data.expenseDate) : new Date(), paidByUserId },
  });
}

async function list({ page, limit, from, to }) {
  const { skip, page: safePage, limit: safeLimit } = parsePagination({ page, limit });
  const where = from || to
    ? { expenseDate: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } }
    : {};

  const [rows, total] = await Promise.all([
    prisma.expense.findMany({
      where, include: { paidBy: { select: { fullName: true } } },
      orderBy: { expenseDate: 'desc' }, skip, take: safeLimit,
    }),
    prisma.expense.count({ where }),
  ]);
  return { data: rows, meta: buildMeta({ page: safePage, limit: safeLimit, total }) };
}

async function remove(id) {
  const expense = await prisma.expense.findUnique({ where: { id } });
  if (!expense) throw ApiError.notFound('المصروف غير موجود');
  await prisma.expense.delete({ where: { id } });
}

module.exports = { create, list, remove };
