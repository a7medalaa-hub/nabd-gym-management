/**
 * measurement.validator.js — تسجيل قياسات جسدية (محيطات/نسبة دهون) لعضو.
 */
const { z } = require('zod');

const num = () => z.coerce.number().positive().max(300).optional().nullable();

const create = z.object({
  body: z.object({
    memberId: z.string().uuid('معرّف العضو غير صالح'),
    recordedAt: z.string().datetime().optional(),
    chestCm: num(), waistCm: num(), hipCm: num(), armCm: num(), thighCm: num(),
    bodyFatPct: z.coerce.number().min(0).max(100).optional().nullable(),
    notes: z.string().optional().nullable(),
  }),
});

const listByMember = z.object({ params: z.object({ memberId: z.string().uuid() }) });

module.exports = { create, listByMember };
