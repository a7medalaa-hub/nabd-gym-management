/**
 * auth.validator.js — مخططات التحقق الخاصة بتسجيل الدخول وإدارة كلمات المرور.
 */
const { z } = require('zod');

const login = z.object({
  body: z.object({
    username: z.string().min(3, 'اسم المستخدم قصير جداً'),
    password: z.string().min(6, 'كلمة المرور يجب ألا تقل عن ٦ أحرف'),
  }),
});

const changePassword = z.object({
  body: z.object({
    currentPassword: z.string().min(6),
    newPassword: z.string().min(6, 'كلمة المرور الجديدة يجب ألا تقل عن ٦ أحرف'),
  }),
});

module.exports = { login, changePassword };
