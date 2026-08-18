/**
 * workoutPlan.validator.js — إنشاء خطة تمرين أسبوعية لعضو VIP.
 * الأيام مصفوفة حرة الطول (وليست ٧ أيام إلزامياً) حتى يمكن للمدرب حذف
 * أي يوم راحة لا يريد كتابة تفاصيل له.
 */
const { z } = require('zod');

const dayInput = z.object({
  dayLabel: z.string().min(1, 'اسم اليوم مطلوب'),
  focus: z.string().min(1, 'محور التمرين مطلوب'),
  notes: z.string().optional().nullable(),
});

const create = z.object({
  body: z.object({
    memberId: z.string().uuid('معرّف العضو غير صالح'),
    coachId: z.string().uuid().optional().nullable(),
    title: z.string().min(2, 'عنوان الخطة قصير جداً'),
    startDate: z.string().datetime(),
    endDate: z.string().datetime().optional().nullable(),
    notes: z.string().optional().nullable(),
    days: z.array(dayInput).min(1, 'أضف يوماً واحداً على الأقل'),
  }),
});

const listByMember = z.object({ params: z.object({ memberId: z.string().uuid() }) });

module.exports = { create, listByMember };
