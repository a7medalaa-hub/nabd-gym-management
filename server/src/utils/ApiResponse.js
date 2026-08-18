/**
 * ApiResponse — شكل موحّد لكل استجابة ناجحة من الـ API، حتى يتعامل الـ
 * frontend مع بنية واحدة ثابتة بغض النظر عن المسار (endpoint).
 */
class ApiResponse {
  constructor(statusCode, data, message = 'تمت العملية بنجاح', meta = null) {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    if (meta) this.meta = meta; // للترقيم (pagination) مثلاً
  }

  send(res) {
    return res.status(this.statusCode).json(this);
  }
}

module.exports = ApiResponse;
