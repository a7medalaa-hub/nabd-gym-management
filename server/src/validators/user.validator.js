/**
 * user.validator.js — مخططات إنشاء/تعديل حسابات الموظفين (Users).
 */
const { z } = require('zod');

const create = z.object({
  body: z.object({
    fullName: z.string().min(2, 'الاسم قصير جداً'),
    username: z.string().min(3, 'اسم المستخدم يجب ألا يقل عن ٣ أحرف').regex(/^[a-zA-Z0-9._-]+$/, 'اسم المستخدم يجب أن يحتوي أحرفاً/أرقاماً إنجليزية فقط'),
    password: z.string().min(6, 'كلمة المرور يجب ألا تقل عن ٦ أحرف'),
    roleId: z.string().uuid('معرّف الدور غير صالح'),
  }),
});

const update = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    fullName: z.string().min(2).optional(),
    roleId: z.string().uuid().optional(),
    isActive: z.boolean().optional(),
  }),
});

const idParam = z.object({ params: z.object({ id: z.string().uuid('معرّف غير صالح') }) });

module.exports = { create, update, idParam };
