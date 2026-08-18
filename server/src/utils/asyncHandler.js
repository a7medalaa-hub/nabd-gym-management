/**
 * asyncHandler — يلف أي controller غير متزامن (async) ويمرر أي استثناء
 * تلقائياً إلى next(err)، حتى لا نكتب try/catch يدوياً في كل controller.
 */
function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
