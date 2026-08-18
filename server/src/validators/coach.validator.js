/**
 * coach.validator.js — إدارة بيانات المدربين.
 */
const { z } = require('zod');

const create = z.object({
  body: z.object({
    name: z.string().min(2, 'اسم المدرب قصير جداً'),
    phone: z.string().optional().nullable(),
    specialization: z.string().optional().nullable(),
    bio: z.string().optional().nullable(),
  }),
});

const update = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    name: z.string().min(2).optional(),
    phone: z.string().optional().nullable(),
    specialization: z.string().optional().nullable(),
    bio: z.string().optional().nullable(),
    isActive: z.boolean().optional(),
  }),
});

module.exports = { create, update };
