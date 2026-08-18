/**
 * payment.validator.js — مخطط البحث/الفلترة في سجل المدفوعات.
 */
const { z } = require('zod');

const list = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    from: z.string().datetime().optional(), // فلترة بمدى تاريخي
    to: z.string().datetime().optional(),
    memberId: z.string().uuid().optional(),
  }),
});

module.exports = { list };
