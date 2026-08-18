/**
 * attendance.validator.js — تسجيل حضور عضو وقراءة سجل الحضور.
 */
const { z } = require('zod');

const checkIn = z.object({
  body: z.object({ memberId: z.string().uuid('معرّف العضو غير صالح') }),
});

const listByMember = z.object({
  params: z.object({ memberId: z.string().uuid() }),
});

module.exports = { checkIn, listByMember };
