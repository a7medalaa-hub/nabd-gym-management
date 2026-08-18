/**
 * sale.validator.js — إنشاء فاتورة بيع من بار الجيم (POS).
 */
const { z } = require('zod');

const create = z.object({
  body: z.object({
    memberId: z.string().uuid().optional().nullable(), // فارغ = عميل عابر (walk-in)
    paymentMethod: z.enum(['CASH', 'CARD', 'WALLET', 'OTHER']).default('CASH'),
    items: z
      .array(z.object({
        productId: z.string().uuid('معرّف المنتج غير صالح'),
        quantity: z.coerce.number().int().positive('الكمية يجب أن تكون رقماً موجباً'),
      }))
      .min(1, 'الفاتورة يجب أن تحتوي على عنصر واحد على الأقل'),
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

module.exports = { create, list };
