/**
 * db.js — عميل Prisma الوحيد (Singleton) في كامل التطبيق.
 * لا يجوز لأي ملف آخر عمل `new PrismaClient()` — الجميع يستورد من هنا فقط،
 * حتى لا نفتح أكثر من اتصال بقاعدة البيانات المحلية بدون داعٍ.
 */
const { PrismaClient } = require('@prisma/client');
const logger = require('./logger');
const env = require('./env');

const prisma = new PrismaClient({
  log: env.isProduction ? ['error', 'warn'] : ['error', 'warn', 'query'],
});

async function connectDatabase() {
  try {
    await prisma.$connect();
    logger.info('✅ متصل بقاعدة بيانات PostgreSQL المحلية بنجاح');
  } catch (err) {
    logger.error('❌ فشل الاتصال بقاعدة البيانات المحلية', { error: err.message });
    process.exit(1);
  }
}

async function disconnectDatabase() {
  await prisma.$disconnect();
}

module.exports = { prisma, connectDatabase, disconnectDatabase };
