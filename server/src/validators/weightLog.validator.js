/**
 * weightLog.validator.js — تسجيل قياس وزن جديد لعضو.
 */
const { z } = require('zod');

const create = z.object({
  body: z.object({
    memberId: z.string().uuid('معرّف العضو غير صالح'),
    weightKg: z.coerce.number().positive('الوزن يجب أن يكون رقماً موجباً').max(400, 'قيمة غير واقعية'),
    recordedAt: z.string().datetime().optional(),
    notes: z.string().optional().nullable(),
  }),
});

const listByMember = z.object({ params: z.object({ memberId: z.string().uuid() }) });

module.exports = { create, listByMember };
