/**
 * attendance.service.js — تسجيل حضور المشتركين. يفرض قاعدتي عمل واضحتين:
 * (١) لا يمكن تسجيل حضور عضو اشتراكه منتهٍ — يجب التجديد أولاً.
 * (٢) لا يُسجَّل حضور نفس العضو مرتين في نفس اليوم (يمنع تكرار العدّ في الإحصائيات).
 */
const { prisma } = require('../config/db');
const ApiError = require('../utils/ApiError');
const memberService = require('./member.service');

function dayBounds(date = new Date()) {
  const start = new Date(date); start.setHours(0, 0, 0, 0);
  const end = new Date(date); end.setHours(23, 59, 59, 999);
  return { start, end };
}

async function checkIn(memberId, recordedByUserId) {
  const member = await prisma.member.findFirst({
    where: { id: memberId, isActive: true },
    include: { subscriptions: { orderBy: { endDate: 'desc' }, take: 1 } },
  });
  if (!member) throw ApiError.notFound('العضو غير موجود');

  const status = memberService.computeStatus(member.subscriptions[0] || null);
  if (status !== 'active') {
    throw ApiError.forbidden('اشتراك هذا العضو منتهٍ — يجب التجديد قبل تسجيل الحضور');
  }

  const { start, end } = dayBounds();
  const alreadyToday = await prisma.attendance.findFirst({
    where: { memberId, checkInAt: { gte: start, lte: end } },
  });
  if (alreadyToday) {
    throw ApiError.conflict('تم تسجيل حضور هذا العضو اليوم بالفعل');
  }

  return prisma.attendance.create({
    data: { memberId, recordedByUserId, method: 'MANUAL' },
    include: { member: { select: { id: true, fullName: true, phone: true } } },
  });
}

async function todayList() {
  const { start, end } = dayBounds();
  return prisma.attendance.findMany({
    where: { checkInAt: { gte: start, lte: end } },
    include: { member: { select: { id: true, fullName: true, phone: true } } },
    orderBy: { checkInAt: 'desc' },
  });
}

async function todayCount() {
  const { start, end } = dayBounds();
  return prisma.attendance.count({ where: { checkInAt: { gte: start, lte: end } } });
}

async function listByMember(memberId) {
  return prisma.attendance.findMany({ where: { memberId }, orderBy: { checkInAt: 'desc' }, take: 90 });
}

module.exports = { checkIn, todayList, todayCount, listByMember, dayBounds };
