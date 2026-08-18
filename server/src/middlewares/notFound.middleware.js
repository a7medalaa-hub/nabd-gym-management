/**
 * notFound.middleware.js — يُلتقط أي طلب لمسار غير معرّف بالكامل، ويحوّله
 * إلى ApiError.notFound بدل استجابة HTML الافتراضية من Express.
 */
const ApiError = require('../utils/ApiError');

function notFound(req, res, next) {
  next(ApiError.notFound(`المسار غير موجود: ${req.method} ${req.originalUrl}`));
}

module.exports = notFound;
