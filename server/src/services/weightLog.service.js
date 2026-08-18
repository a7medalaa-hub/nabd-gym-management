/**
 * weightLog.service.js — سجل الوزن الشهري/الدوري لعضو.
 */
const { prisma } = require('../config/db');
const ApiError = require('../utils/ApiError');

async function create({ memberId, weightKg, recordedAt, notes }) {
  const member = await prisma.member.findFirst({ where: { id: memberId, isActive: true } });
  if (!member) throw ApiError.notFound('العضو غير موجود');

  return prisma.weightLog.create({
    data: { memberId, weightKg, notes, recordedAt: recordedAt ? new Date(recordedAt) : new Date() },
  });
}

async function listByMember(memberId) {
  const member = await prisma.member.findFirst({ where: { id: memberId, isActive: true } });
  if (!member) throw ApiError.notFound('العضو غير موجود');

  const logs = await prisma.weightLog.findMany({ where: { memberId }, orderBy: { recordedAt: 'asc' } });
  return {
    member: { id: member.id, fullName: member.fullName, startWeightKg: member.startWeightKg, goalWeightKg: member.goalWeightKg },
    logs,
  };
}

module.exports = { create, listByMember };
