/**
 * backup.service.js — نسخ احتياطي/استعادة عبر pg_dump/psql فعلياً (وليس
 * محاكاة). يفترض أن هذين الأمرين متاحان في PATH — وهو ما سيضمنه مثبّت
 * التطبيق في Phase 6 عند تثبيت PostgreSQL المحلي المُجمَّع مع التطبيق.
 * الملفات تُحفظ محلياً في server/backups/ على نفس جهاز الجيم فقط؛ لا يوجد
 * رفع لأي خادم خارجي — يتماشى هذا مع قرار "بدون اتصال بالإنترنت إطلاقاً".
 */
const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');
const ApiError = require('../utils/ApiError');
const env = require('../config/env');
const logger = require('../config/logger');

const BACKUPS_DIR = path.join(__dirname, '..', '..', 'backups');
if (!fs.existsSync(BACKUPS_DIR)) fs.mkdirSync(BACKUPS_DIR, { recursive: true });

/** parseDatabaseUrl — يحوّل DATABASE_URL إلى مكوّناته دون أي مكتبة إضافية. */
function parseDatabaseUrl() {
  const url = new URL(env.databaseUrl);
  return {
    host: url.hostname,
    port: url.port || '5432',
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ''),
  };
}

function runCommand(command, args, extraEnv) {
  return new Promise((resolve, reject) => {
    execFile(command, args, { env: { ...process.env, ...extraEnv } }, (error, stdout, stderr) => {
      if (error) return reject(new Error(stderr || error.message));
      resolve(stdout);
    });
  });
}

async function createBackup() {
  const { host, port, user, password, database } = parseDatabaseUrl();
  const filename = `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.sql`;
  const filepath = path.join(BACKUPS_DIR, filename);

  try {
    await runCommand(
      'pg_dump',
      ['-h', host, '-p', port, '-U', user, '-d', database, '-F', 'p', '-f', filepath],
      { PGPASSWORD: password }
    );
    logger.info(`✅ تم إنشاء نسخة احتياطية: ${filename}`);
    return { filename, createdAt: new Date().toISOString(), sizeBytes: fs.statSync(filepath).size };
  } catch (err) {
    logger.error('فشل إنشاء النسخة الاحتياطية', { error: err.message });
    throw ApiError.internal('فشل إنشاء النسخة الاحتياطية — تأكد من تثبيت أدوات PostgreSQL (pg_dump) على الجهاز');
  }
}

async function listBackups() {
  return fs.readdirSync(BACKUPS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .map((filename) => {
      const stat = fs.statSync(path.join(BACKUPS_DIR, filename));
      return { filename, sizeBytes: stat.size, createdAt: stat.birthtime };
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

async function restoreBackup(filename) {
  const safeName = path.basename(filename); // يمنع أي محاولة الخروج من مجلد backups عبر ../
  const filepath = path.join(BACKUPS_DIR, safeName);
  if (!fs.existsSync(filepath)) throw ApiError.notFound('ملف النسخة الاحتياطية غير موجود');

  const { host, port, user, password, database } = parseDatabaseUrl();
  try {
    await runCommand(
      'psql',
      ['-h', host, '-p', port, '-U', user, '-d', database, '-f', filepath],
      { PGPASSWORD: password }
    );
    logger.info(`✅ تمت الاستعادة من: ${safeName}`);
  } catch (err) {
    logger.error('فشلت الاستعادة من النسخة الاحتياطية', { error: err.message });
    throw ApiError.internal('فشلت عملية الاستعادة — راجع سجلات الخادم للتفاصيل');
  }
}

module.exports = { createBackup, listBackups, restoreBackup };
