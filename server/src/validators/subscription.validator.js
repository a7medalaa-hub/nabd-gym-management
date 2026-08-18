/**
 * subscription.validator.js — مخطط تجديد/إنشاء اشتراك لعضو موجود بالفعل.
 */
const { z } = require('zod');

const renew = z.object({
  params: z.object({ memberId: z.string().uuid('معرّف العضو غير صالح') }),
  body: z.object({
    subscriptionTypeId: z.string().uuid('نوع الاشتراك غير صالح'),
    paymentMethod: z.enum(['CASH', 'CARD', 'WALLET', 'OTHER']).default('CASH'),
  }),
});

const listByMember = z.object({
  params: z.object({ memberId: z.string().uuid() }),
});

const expiringSoon = z.object({
  query: z.object({
    withinDays: z.string().optional(), // نص، يُحوَّل داخل الخدمة إلى رقم
  }),
});

module.exports = { renew, listByMember, expiringSoon };
