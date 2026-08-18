/**
 * workoutPlan.service.js — إنشاء خطة تمرين لعضو. كل خطة جديدة هي نسخة
 * جديدة كاملة (وليست تعديلاً على القديمة) — هذا يحافظ على تاريخ الخطط
 * السابقة بدل الكتابة فوقه، و"الخطة الحالية" هي ببساطة الأحدث إنشاءً.
 */
const { prisma } = require('../config/db');
const ApiError = require('../utils/ApiError');

async function create({ memberId, coachId, title, startDate, endDate, notes, days }) {
  const member = await prisma.member.findFirst({ where: { id: memberId, isActive: true } });
  if (!member) throw ApiError.notFound('العضو غير موجود');

  return prisma.workoutPlan.create({
    data: {
      memberId, coachId: coachId || null, title, notes,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      days: {
        create: days.map((d, index) => ({
          dayLabel: d.dayLabel, focus: d.focus, notes: d.notes || null, orderIndex: index,
        })),
      },
    },
    include: { days: { orderBy: { orderIndex: 'asc' } }, coach: true },
  });
}

/** current — أحدث خطة تمرين لعضو (أو null إن لم توجد أي خطة بعد). */
async function current(memberId) {
  return prisma.workoutPlan.findFirst({
    where: { memberId },
    orderBy: { createdAt: 'desc' },
    include: { days: { orderBy: { orderIndex: 'asc' } }, coach: true },
  });
}

module.exports = { create, current };
