/**
 * setting.validator.js — تحديث إعدادات الجيم (مفتاح/قيمة متعددة دفعة واحدة).
 */
const { z } = require('zod');

const update = z.object({
  body: z.object({
    settings: z.record(z.string(), z.string()).refine((obj) => Object.keys(obj).length > 0, 'لا توجد إعدادات لتحديثها'),
  }),
});

module.exports = { update };
