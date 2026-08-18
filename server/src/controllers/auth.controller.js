/**
 * auth.controller.js — طبقة رقيقة فقط: تستخرج المدخلات وتستدعي الخدمة
 * وتُشكِّل الاستجابة. لا يوجد أي منطق أعمال هنا عمداً.
 */
const authService = require('../services/auth.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  new ApiResponse(200, result, 'تم تسجيل الدخول بنجاح').send(res);
});

const me = asyncHandler(async (req, res) => {
  new ApiResponse(200, req.user, 'بيانات المستخدم الحالي').send(res);
});

const changePassword = asyncHandler(async (req, res) => {
  await authService.changePassword(req.user.id, req.body);
  new ApiResponse(200, null, 'تم تغيير كلمة المرور بنجاح').send(res);
});

module.exports = { login, me, changePassword };
