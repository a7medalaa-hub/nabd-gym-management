/**
 * measurement.service.js — سجل القياسات الجسدية (محيطات/نسبة دهون) لعضو.
 */
const { prisma } = require('../config/db');
const ApiError = require('../utils/ApiError');

async function create(payload) {
  const member = await prisma.member.findFirst({ where: { id: payload.memberId, isActive: true } });
  if (!member) throw ApiError.notFound('العضو غير موجود');

  return prisma.measurement.create({
    data: { ...payload, recordedAt: payload.recordedAt ? new Date(payload.recordedAt) : new Date() },
  });
}

async function listByMember(memberId) {
  return prisma.measurement.findMany({ where: { memberId }, orderBy: { recordedAt: 'desc' }, take: 24 });
}

module.exports = { create, listByMember };
