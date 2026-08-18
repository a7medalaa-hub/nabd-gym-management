/**
 * subscriptionType.service.js — إدارة أنواع الاشتراكات (مثال: فضي/ذهبي/بلاتيني VIP).
 * لا حذف فعلي — نوع اشتراك قديم قد تشير إليه اشتراكات سابقة، فتعطيله
 * (isActive=false) هو ما يمنع استخدامه في اشتراكات جديدة دون كسر التاريخ.
 */
const { prisma } = require('../config/db');
const ApiError = require('../utils/ApiError');

async function list({ includeInactive = false } = {}) {
  return prisma.subscriptionType.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: { price: 'asc' },
  });
}

async function getById(id) {
  const type = await prisma.subscriptionType.findUnique({ where: { id } });
  if (!type) throw ApiError.notFound('نوع الاشتراك غير موجود');
  return type;
}

async function create(data) {
  const existing = await prisma.subscriptionType.findUnique({ where: { name: data.name } });
  if (existing) throw ApiError.conflict('يوجد نوع اشتراك بنفس هذا الاسم بالفعل');
  return prisma.subscriptionType.create({ data });
}

async function update(id, data) {
  await getById(id);
  return prisma.subscriptionType.update({ where: { id }, data });
}

async function deactivate(id) {
  await getById(id);
  return prisma.subscriptionType.update({ where: { id }, data: { isActive: false } });
}

module.exports = { list, getById, create, update, deactivate };
