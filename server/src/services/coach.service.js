/**
 * coach.service.js — إدارة بيانات المدربين. لا حذف فعلي — قد يكون مدرّب
 * قديم مرتبطاً بخطط تمرين/غذاء سابقة، فتعطيله هو الأداة الوحيدة المتاحة.
 */
const { prisma } = require('../config/db');
const ApiError = require('../utils/ApiError');

async function list({ includeInactive = false } = {}) {
  return prisma.coach.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: { name: 'asc' },
  });
}

async function create(data) {
  return prisma.coach.create({ data });
}

async function update(id, data) {
  const coach = await prisma.coach.findUnique({ where: { id } });
  if (!coach) throw ApiError.notFound('المدرب غير موجود');
  return prisma.coach.update({ where: { id }, data });
}

module.exports = { list, create, update };
