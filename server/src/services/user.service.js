/**
 * user.service.js — إدارة حسابات الموظفين (Users). لا يوجد حذف فعلي أبداً —
 * حساب موظف قد يكون مرتبطاً بمدفوعات/حضور سُجِّلت باسمه، فحذفه فعلياً يكسر
 * السجل التاريخي. التعطيل (isActive=false) هو الأداة الوحيدة المتاحة.
 */
const { prisma } = require('../config/db');
const { hashPassword } = require('../utils/password.util');
const ApiError = require('../utils/ApiError');

const SAFE_SELECT = {
  id: true, fullName: true, username: true, isActive: true, lastLoginAt: true,
  createdAt: true, roleId: true, role: { select: { id: true, name: true } },
}; // passwordHash مستبعد عمداً من أي استجابة API

async function list() {
  return prisma.user.findMany({ select: SAFE_SELECT, orderBy: { createdAt: 'desc' } });
}

async function getById(id) {
  const user = await prisma.user.findUnique({ where: { id }, select: SAFE_SELECT });
  if (!user) throw ApiError.notFound('المستخدم غير موجود');
  return user;
}

async function create({ fullName, username, password, roleId }) {
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) throw ApiError.conflict('اسم المستخدم هذا مستخدم بالفعل');

  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role) throw ApiError.badRequest('الدور المحدد غير موجود');

  const passwordHash = await hashPassword(password);
  return prisma.user.create({
    data: { fullName, username, passwordHash, roleId },
    select: SAFE_SELECT,
  });
}

async function update(id, data) {
  await getById(id); // يرمي 404 تلقائياً إن لم يوجد
  return prisma.user.update({ where: { id }, data, select: SAFE_SELECT });
}

module.exports = { list, getById, create, update };
