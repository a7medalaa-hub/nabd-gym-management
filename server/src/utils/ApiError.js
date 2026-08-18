/**
 * ApiError — خطأ موحّد الشكل لأي فشل متوقع (تحقق فاشل، غير مصرح، غير موجود...).
 * يُرمى (throw) من أي controller/service ويلتقطه error.middleware.js في مكان واحد.
 */
class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details; // مثال: قائمة أخطاء التحقق من zod
    this.isOperational = true; // يميّز الأخطاء المتوقعة عن أخطاء برمجية غير متوقعة
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, details) { return new ApiError(400, message, details); }
  static unauthorized(message = 'غير مصرح لك بالدخول') { return new ApiError(401, message); }
  static forbidden(message = 'ليس لديك صلاحية لتنفيذ هذا الإجراء') { return new ApiError(403, message); }
  static notFound(message = 'العنصر المطلوب غير موجود') { return new ApiError(404, message); }
  static conflict(message = 'تعارض في البيانات') { return new ApiError(409, message); }
  static internal(message = 'حدث خطأ غير متوقع في الخادم') { return new ApiError(500, message); }
}

module.exports = ApiError;
