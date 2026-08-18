/**
 * report.validator.js — نطاق تاريخي اختياري لكل تقارير المالية.
 */
const { z } = require('zod');

const dateRange = z.object({
  query: z.object({
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
  }),
});

module.exports = { dateRange };
