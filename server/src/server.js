/**
 * server.js — نقطة الدخول الفعلية: يتأكد من الاتصال بقاعدة البيانات أولاً،
 * ثم يبدأ الاستماع، مع إغلاق نظيف (graceful shutdown) عند إيقاف العملية —
 * مهم بشكل خاص هنا لأن Electron سيُشغّل/يوقف هذه العملية مع فتح/إغلاق التطبيق.
 */
const env = require('./config/env');
const logger = require('./config/logger');
const { connectDatabase, disconnectDatabase } = require('./config/db');
const app = require('./app');
const notificationService = require('./services/notification.service');

let server;

async function start() {
  await connectDatabase();

  // فحص إشعارات النظام مرة عند كل إقلاع — راجع التعليق التوضيحي الكامل
  // في notification.service.js لسبب عدم استخدام مجدول مهام حقيقي هنا.
  try {
    await notificationService.generateSystemNotifications();
  } catch (err) {
    logger.error('فشل توليد إشعارات النظام عند الإقلاع', { error: err.message });
  }

  server = app.listen(env.port, () => {
    logger.info(`🚀 خادم نبض يعمل على http://localhost:${env.port} [${env.nodeEnv}]`);
  });
}

async function shutdown(signal) {
  logger.info(`إيقاف الخادم بسبب ${signal}...`);
  if (server) server.close();
  await disconnectDatabase();
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Promise Rejection', { reason: reason?.message || reason });
});
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', { error: err.message, stack: err.stack });
  process.exit(1);
});

start();
