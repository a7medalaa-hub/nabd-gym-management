/**
 * auth.middleware.js — يتحقق من رمز JWT في هيدر Authorization، ويحمّل
 * المستخدم (مع دوره وصلاحياته) على req.user لاستخدامه في أي middleware/route لاحق.
 */
const { prisma } = require('../config/db');
const { verifyToken } = require('../utils/jwt.util');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw ApiError.unauthorized('يجب تسجيل الدخول أولاً — رمز الدخول مفقود');
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch (err) {
    throw ApiError.unauthorized('انتهت صلاحية الجلسة أو رمز الدخول غير صالح، سجّل الدخول من جديد');
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    include: { role: { include: { permissions: { include: { permission: true } } } } },
  });

  if (!user || !user.isActive) {
    throw ApiError.unauthorized('الحساب غير موجود أو تم إيقافه');
  }

  // نُرفق قائمة مفاتيح الصلاحيات كمصفوفة نصوص بسيطة لسهولة الاستخدام في role.middleware.js
  req.user = {
    id: user.id,
    fullName: user.fullName,
    username: user.username,
    roleId: user.roleId,
    roleName: user.role.name,
    permissions: user.role.permissions.map((rp) => rp.permission.key),
  };

  next();
});

module.exports = { authenticate };

/**
 * authenticateViaHeaderOrQuery — نفس منطق authenticate تماماً، لكنها تقبل
 * رمز JWT من ?token= في الرابط أيضاً وليس فقط من هيدر Authorization.
 *
 * الاستثناء موجود لسبب تقني واحد فقط: روابط تنزيل الملفات (Excel/PDF) التي
 * يفتحها المتصفح عبر التنقل المباشر (window.open أو <a href>) لا يمكنها
 * إرفاق ترويسات HTTP مخصصة — هذا قيد من المتصفح نفسه، وليس اختياراً معمارياً.
 * تُستخدم هذه النسخة فقط على مسارات /api/exports/*، ولا شيء غيرها.
 */
const authenticateViaHeaderOrQuery = asyncHandler(async (req, res, next) => {
  if (!req.headers.authorization && req.query.token) {
    req.headers.authorization = `Bearer ${req.query.token}`;
  }
  return authenticate(req, res, next);
});
module.exports.authenticateViaHeaderOrQuery = authenticateViaHeaderOrQuery;
