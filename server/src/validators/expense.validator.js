/**
 * expense.validator.js — تسجيل مصروف تشغيلي (إيجار، صيانة، رواتب...).
 */
const { z } = require('zod');

const create = z.object({
  body: z.object({
    category: z.string().min(2, 'التصنيف مطلوب'),
    description: z.string().optional().nullable(),
    amount: z.coerce.number().positive('المبلغ يجب أن يكون رقماً موجباً'),
    expenseDate: z.string().datetime().optional(),
  }),
});

const list = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
  }),
});

const idParam = z.object({ params: z.object({ id: z.string().uuid() }) });

module.exports = { create, list, idParam };
