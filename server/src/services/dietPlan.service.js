/**
 * dietPlan.service.js — نفس منطق workoutPlan.service.js لكن للنظام الغذائي.
 */
const { prisma } = require('../config/db');
const ApiError = require('../utils/ApiError');

async function create({ memberId, coachId, title, startDate, endDate, notes, meals }) {
  const member = await prisma.member.findFirst({ where: { id: memberId, isActive: true } });
  if (!member) throw ApiError.notFound('العضو غير موجود');

  return prisma.dietPlan.create({
    data: {
      memberId, coachId: coachId || null, title, notes,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      meals: {
        create: meals.map((m, index) => ({ mealName: m.mealName, items: m.items, orderIndex: index })),
      },
    },
    include: { meals: { orderBy: { orderIndex: 'asc' } }, coach: true },
  });
}

async function current(memberId) {
  return prisma.dietPlan.findFirst({
    where: { memberId },
    orderBy: { createdAt: 'desc' },
    include: { meals: { orderBy: { orderIndex: 'asc' } }, coach: true },
  });
}

module.exports = { create, current };
