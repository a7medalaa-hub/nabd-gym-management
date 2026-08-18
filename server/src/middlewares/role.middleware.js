/**
 * role.middleware.js — تفويض (Authorization) قائم على الصلاحيات وليس على
 * اسم الدور مباشرة، حتى يمكن إعادة توزيع الصلاحيات على الأدوار من لوحة
 * الإعدادات مستقبلاً دون تعديل الكود.
 *
 * الاستخدام: router.post('/', authenticate, requirePermission('members.create'), ctrl.create)
 */
const ApiError = require('../utils/ApiError');

function requirePermission(...requiredKeys) {
  return function checkPermission(req, res, next) {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }
    const hasPermission = requiredKeys.some((key) => req.user.permissions.includes(key));
    if (!hasPermission) {
      return next(ApiError.forbidden(`هذا الإجراء يتطلب صلاحية: ${requiredKeys.join(' أو ')}`));
    }
    next();
  };
}

module.exports = { requirePermission };
