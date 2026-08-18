/**
 * validate.middleware.js — يشغّل مخطط zod على body/query/params الطلب،
 * ويرفض الطلب بخطأ 400 مفصّل قبل أن يصل لأي controller أو قاعدة بيانات.
 *
 * الاستخدام: router.post('/', validate(memberValidator.create), ctrl.create)
 */
const ApiError = require('../utils/ApiError');

function validate(schema) {
  return function runValidation(req, res, next) {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.slice(1).join('.'), // نحذف أول مستوى (body/query/params) من رسالة الحقل
        message: issue.message,
      }));
      return next(ApiError.badRequest('بيانات غير صحيحة، تحقق من الحقول المُدخلة', details));
    }

    // نستبدل القيم بالقيم "المُنظّفة" التي أنتجها zod (بعد التحويلات مثل string->number)
    req.body = result.data.body ?? req.body;
    req.query = result.data.query ?? req.query;
    req.params = result.data.params ?? req.params;
    next();
  };
}

module.exports = validate;
