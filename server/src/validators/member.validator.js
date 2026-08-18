/**
 * member.validator.js — مخططات إنشاء/تعديل/بحث المشتركين.
 * تطابق حقول نموذج "إضافة مشترك جديد" الموجود بالفعل في الواجهة الأمامية.
 */
const { z } = require('zod');

const egyptianPhone = z
  .string()
  .regex(/^01[0-9]{9}$/, 'رقم الهاتف غير صحيح — يجب أن يبدأ بـ 01 ويتكوّن من ١١ رقماً');

const create = z.object({
  body: z.object({
    fullName: z.string().min(2, 'الاسم قصير جداً'),
    phone: egyptianPhone,
    email: z.string().email('بريد إلكتروني غير صالح').optional().nullable(),
    gender: z.enum(['MALE', 'FEMALE']).optional(),
    birthDate: z.string().datetime().optional().nullable(),
    address: z.string().optional().nullable(),
    emergencyContact: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    startWeightKg: z.coerce.number().positive().optional().nullable(),
    goalWeightKg: z.coerce.number().positive().optional().nullable(),
    // بيانات الاشتراك الأول — تُنشئ Subscription + Payment تلقائياً في الخدمة
    subscriptionTypeId: z.string().uuid('نوع الاشتراك غير صالح'),
    startDate: z.string().datetime(),
    paymentMethod: z.enum(['CASH', 'CARD', 'WALLET', 'OTHER']).default('CASH'),
  }),
});

const update = z.object({
  params: z.object({ id: z.string().uuid('معرّف العضو غير صالح') }),
  body: z.object({
    fullName: z.string().min(2).optional(),
    phone: egyptianPhone.optional(),
    email: z.string().email().optional().nullable(),
    gender: z.enum(['MALE', 'FEMALE']).optional(),
    birthDate: z.string().datetime().optional().nullable(),
    address: z.string().optional().nullable(),
    emergencyContact: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    goalWeightKg: z.coerce.number().positive().optional().nullable(),
    isActive: z.boolean().optional(),
  }),
});

const list = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(), // بحث بالاسم أو الهاتف
    status: z.enum(['active', 'expired', 'all']).optional(),
  }),
});

const idParam = z.object({ params: z.object({ id: z.string().uuid('معرّف العضو غير صالح') }) });

module.exports = { create, update, list, idParam };
