/**
 * error.middleware.js — معالج الأخطاء المركزي الوحيد في التطبيق.
 * كل خطأ — متوقع (ApiError) أو غير متوقع — يمر من هنا ليخرج بشكل استجابة
 * JSON موحّد، ويُسجَّل في الـ logs دون تسريب تفاصيل حساسة في وضع الإنتاج.
 */
const logger = require('../config/logger');
const env = require('../config/env');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const isOperational = err.isOperational === true;
  const statusCode = err.statusCode || 500;
  const message = isOperational ? err.message : 'حدث خطأ غير متوقع في الخادم';

  logger.error(err.message, {
    statusCode,
    path: req.originalUrl,
    method: req.method,
    stack: err.stack,
    isOperational,
  });

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    details: err.details || undefined,
    // تفاصيل الاستثناء الكاملة تظهر فقط في التطوير، أبداً في الإنتاج
    stack: env.isProduction ? undefined : err.stack,
  });
}

module.exports = errorHandler;
