/**
 * requestLogger.middleware.js — يوجّه سجلات Morgan (طلبات HTTP) عبر Winston
 * بدلاً من console.log مباشرة، حتى تنتهي كل السجلات في مكان واحد موحّد.
 */
const morgan = require('morgan');
const logger = require('../config/logger');

const stream = { write: (message) => logger.info(message.trim()) };

module.exports = morgan(
  ':method :url :status :res[content-length] - :response-time ms',
  { stream }
);
