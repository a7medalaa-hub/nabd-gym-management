/**
 * subscriptionType.validator.js — مخططات إدارة أنواع الاشتراكات (فضي/ذهبي/VIP...).
 */
const { z } = require('zod');

const create = z.object({
  body: z.object({
    name: z.string().min(2, 'اسم نوع الاشتراك قصير جداً'),
    durationDays: z.coerce.number().int().positive('المدة يجب أن تكون رقماً موجباً'),
    price: z.coerce.number().nonnegative('السعر لا يمكن أن يكون سالباً'),
    description: z.string().optional().nullable(),
    isVip: z.boolean().optional(),
  }),
});

const update = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    name: z.string().min(2).optional(),
    durationDays: z.coerce.number().int().positive().optional(),
    price: z.coerce.number().nonnegative().optional(),
    description: z.string().optional().nullable(),
    isVip: z.boolean().optional(),
    isActive: z.boolean().optional(),
  }),
});

const idParam = z.object({ params: z.object({ id: z.string().uuid() }) });

module.exports = { create, update, idParam };
