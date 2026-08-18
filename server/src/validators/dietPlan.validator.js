/**
 * dietPlan.validator.js — إنشاء نظام غذائي لعضو VIP.
 */
const { z } = require('zod');

const mealInput = z.object({
  mealName: z.string().min(1, 'اسم الوجبة مطلوب'),
  items: z.string().min(1, 'تفاصيل الوجبة مطلوبة'),
});

const create = z.object({
  body: z.object({
    memberId: z.string().uuid('معرّف العضو غير صالح'),
    coachId: z.string().uuid().optional().nullable(),
    title: z.string().min(2, 'عنوان الخطة قصير جداً'),
    startDate: z.string().datetime(),
    endDate: z.string().datetime().optional().nullable(),
    notes: z.string().optional().nullable(),
    meals: z.array(mealInput).min(1, 'أضف وجبة واحدة على الأقل'),
  }),
});

const listByMember = z.object({ params: z.object({ memberId: z.string().uuid() }) });

module.exports = { create, listByMember };
