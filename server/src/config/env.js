/**
 * env.js — يقرأ ويتحقق من متغيرات البيئة مرة واحدة عند بدء التشغيل.
 * أي متغير ناقص يوقف التطبيق فوراً بخطأ واضح بدلاً من فشل غامض لاحقاً.
 */
require('dotenv').config();

const REQUIRED_VARS = ['DATABASE_URL', 'JWT_SECRET'];

function assertRequiredEnv() {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);
  if (missing.length) {
    // eslint-disable-next-line no-console
    console.error(`❌ متغيرات بيئة ناقصة في .env: ${missing.join(', ')}`);
    process.exit(1);
  }
}
assertRequiredEnv();

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 4000,
  databaseUrl: process.env.DATABASE_URL,
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  },
  isProduction: process.env.NODE_ENV === 'production',
};
