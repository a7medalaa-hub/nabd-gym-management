/**
 * setup/firstRun.js — تهيئة كاملة عند أول تشغيل للتطبيق على جهاز جديد:
 * توليد .env بكلمات سر عشوائية، تهيئة PostgreSQL المحلي وتشغيله، تطبيق
 * المخططات (migrations)، وزرع البيانات الافتراضية — مرة واحدة فقط.
 *
 * لماذا تُطبَّق الـ migrations عبر تشغيل ملفات migration.sql مباشرة بواسطة
 * psql، وليس عبر "prisma migrate deploy"؟ لأن أمر Prisma CLI يحتاج تجميع
 * ثنائيات إضافية خاصة به داخل الحزمة المُثبَّتة، بينما psql ثنائي واحد
 * مُجمَّع بالفعل مع PostgreSQL نفسه. ملفات migration.sql تُنشَأ مرة واحدة
 * أثناء التطوير عبر `npm run prisma:migrate` (يتطلب اتصال إنترنت وقتها فقط
 * لتنزيل محرّك Prisma)، ثم تُحفظ في prisma/migrations/ وتُشحَن كجزء من
 * التطبيق — لا حاجة لإنترنت على جهاز الجيم نفسه إطلاقاً بعد ذلك.
 */
const os = require('os');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { execFile } = require('child_process');
const { PostgresManager, resolveExecutable } = require('../postgres-manager.js');

const LOCAL_DB_PORT = 55433; // منفذ غير قياسي لتفادي أي تعارض مع تثبيت Postgres آخر على نفس الجهاز

function generateSecret(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

function writeEnvIfMissing(envPath, values) {
  if (fs.existsSync(envPath)) return false;
  const content = Object.entries(values).map(([k, v]) => `${k}="${v}"`).join('\n') + '\n';
  fs.writeFileSync(envPath, content, { mode: 0o600 });
  return true;
}

function loadEnvFile(envPath) {
  const raw = fs.readFileSync(envPath, 'utf8');
  const values = {};
  raw.split('\n').forEach((line) => {
    const match = line.match(/^([A-Z_]+)="(.*)"$/);
    if (match) values[match[1]] = match[2];
  });
  return values;
}

function psqlExec(binDir, connectionEnv, sqlFilePath, database = 'gms_db') {
  return new Promise((resolve, reject) => {
    execFile(
      resolveExecutable(binDir, 'psql'),
      ['-h', '127.0.0.1', '-p', String(LOCAL_DB_PORT), '-U', 'postgres', '-d', database, '-v', 'ON_ERROR_STOP=1', '-f', sqlFilePath],
      { env: { ...process.env, PGPASSWORD: connectionEnv.password } },
      (error, stdout, stderr) => (error ? reject(new Error(stderr || error.message)) : resolve(stdout))
    );
  });
}

/** psqlQuery — ينفّذ استعلاماً واحداً ويعيد ناتجه كنص خام (بلا محاذاة ولا
 *  عناوين أعمدة، عبر -tA)، يُستخدم لفحوصات الوجود (exists checks) البسيطة. */
function psqlQuery(binDir, password, database, sql) {
  return new Promise((resolve, reject) => {
    execFile(
      resolveExecutable(binDir, 'psql'),
      ['-h', '127.0.0.1', '-p', String(LOCAL_DB_PORT), '-U', 'postgres', '-d', database, '-tA', '-c', sql],
      { env: { ...process.env, PGPASSWORD: password } },
      (error, stdout, stderr) => (error ? reject(new Error(stderr || error.message)) : resolve(stdout.trim()))
    );
  });
}

/**
 * ensureDatabaseExists — يتحقق أولاً عبر pg_database بدل تنفيذ CREATE
 * DATABASE بشكل أعمى. هذا يصلح خطأً حقيقياً: لو فشلت خطوة لاحقة (تطبيق
 * migrations أو seed) في تشغيل سابق، كانت gms_db تبقى موجودة لكن علامة
 * .setup-complete لا تُكتب أبداً — فتُعاد محاولة CREATE DATABASE من جديد
 * عند كل إعادة تشغيل وتفشل بخطأ "database already exists"، مانعةً حتى
 * محاولة تطبيق الـ migrations أو الزرع من الأساس.
 */
async function ensureDatabaseExists({ binDir, password, databaseName }) {
  const exists = await psqlQuery(binDir, password, 'postgres', `SELECT 1 FROM pg_database WHERE datname='${databaseName}';`);
  if (exists === '1') return false; // موجودة بالفعل — لا شيء يُفعل
  await psqlExec(binDir, { password }, writeTempSql(`CREATE DATABASE "${databaseName}";`), 'postgres');
  return true;
}

/**
 * applyMigrations — يطبّق كل مجلدات prisma/migrations/*\/migration.sql
 * بالترتيب الأبجدي (Prisma يسمّيها بترتيب زمني بادئةً، فهذا يطابق ترتيب
 * الإنشاء الفعلي تلقائياً)، لكن بشكل آمن للتكرار الآن: كل migration مُطبَّقة
 * تُسجَّل في جدول "_migrations_applied" داخل gms_db نفسها، وأي محاولة
 * لاحقة تتخطى ما طُبِّق بالفعل بدل إعادة تنفيذ CREATE TABLE على جداول
 * موجودة أصلاً (وهو تحديداً ما كان سيحدث لو فشلت خطوة الزرع (seed) بعد
 * نجاح الـ migrations في تشغيل سابق).
 */
async function applyMigrations({ binDir, password, migrationsDir }) {
  if (!fs.existsSync(migrationsDir)) {
    throw new Error(`مجلد migrations غير موجود: ${migrationsDir} — شغّل "npm run prisma:migrate" أثناء التطوير أولاً`);
  }

  await psqlExec(binDir, { password }, writeTempSql(
    'CREATE TABLE IF NOT EXISTS "_migrations_applied" ("name" TEXT PRIMARY KEY, "appliedAt" TIMESTAMP NOT NULL DEFAULT now());'
  ));

  const folders = fs.readdirSync(migrationsDir).filter((f) =>
    fs.statSync(path.join(migrationsDir, f)).isDirectory()
  ).sort();

  let appliedCount = 0;
  for (const folder of folders) {
    const sqlFile = path.join(migrationsDir, folder, 'migration.sql');
    if (!fs.existsSync(sqlFile)) continue;

    const already = await psqlQuery(binDir, password, 'gms_db',
      `SELECT 1 FROM "_migrations_applied" WHERE "name"='${folder}';`);
    if (already === '1') continue; // طُبِّقت من قبل — تخطَّها

    await psqlExec(binDir, { password }, sqlFile);
    await psqlExec(binDir, { password }, writeTempSql(
      `INSERT INTO "_migrations_applied" ("name") VALUES ('${folder}');`
    ));
    appliedCount += 1;
  }
  return appliedCount;
}

/**
 * runFirstTimeSetup — الدالة الرئيسية التي يستدعيها main.js عند إقلاع
 * التطبيق. آمنة للاستدعاء في كل مرة يُفتح فيها التطبيق — تتحقق من علامة
 * .setup-complete وتتخطى كل الخطوات إن كانت موجودة بالفعل.
 *
 * @returns {{ postgres: PostgresManager, databaseUrl: string }}
 */
async function runFirstTimeSetup({ userDataPath, isPackaged, resourcesPath, logger = console.log }) {
  const dataDir = path.join(userDataPath, 'pgdata');
  const envPath = path.join(userDataPath, '.env');
  const setupMarker = path.join(userDataPath, '.setup-complete');

  const created = writeEnvIfMissing(envPath, {
    JWT_SECRET: generateSecret(32),
    DB_PASSWORD: generateSecret(16),
  });
  if (created) logger('✅ تم توليد ملف إعدادات جديد بكلمات سر عشوائية (.env)');
  const env = loadEnvFile(envPath);

  const postgres = new PostgresManager({
    dataDir,
    port: LOCAL_DB_PORT,
    superuserPassword: env.DB_PASSWORD,
    isPackaged,
    resourcesPath,
    logger,
  });

  await postgres.initialize();
  await postgres.start();

  if (!fs.existsSync(setupMarker)) {
    // إنشاء قاعدة البيانات الفعلية إن لم تكن موجودة بالفعل — آمن للتكرار
    // الآن (راجع ensureDatabaseExists لتفصيل الخطأ الذي كان يحدث سابقاً).
    const createdDb = await ensureDatabaseExists({ binDir: postgres.binDir, password: env.DB_PASSWORD, databaseName: 'gms_db' });
    logger(createdDb ? '✅ تم إنشاء قاعدة البيانات gms_db' : 'ℹ️  قاعدة البيانات gms_db موجودة بالفعل — تخطّي الإنشاء');

    const migrationsDir = path.join(isPackaged ? resourcesPath : path.join(__dirname, '..', '..'), 'prisma', 'migrations');
    const count = await applyMigrations({ binDir: postgres.binDir, password: env.DB_PASSWORD, migrationsDir });
    logger(`✅ تم تطبيق ${count} migration(s) جديدة`);

    // seed.js يستخدم @prisma/client (وليس psql)، لذا يُشغَّل كعملية Node منفصلة
    // بعد التأكد من أن قاعدة البيانات والجداول موجودة. seed.js نفسه آمن
    // للتكرار (upsert في كل مكان)، فلا ضرر من تشغيله حتى لو نجح جزئياً قبلاً.
    await runSeed({ databaseUrl: postgres.connectionString('gms_db'), isPackaged, resourcesPath, logger });

    fs.writeFileSync(setupMarker, new Date().toISOString());
    logger('🎉 اكتمل إعداد أول تشغيل بنجاح');
  }

  return { postgres, databaseUrl: postgres.connectionString('gms_db') };
}

/** writeTempSql — يكتب نصاً SQL قصيراً إلى ملف مؤقت في مجلد نظام التشغيل
 *  المؤقت (لا علاقة له بأي مجلد بيانات محدَّد، فيمكن استدعاؤه من أي مكان). */
function writeTempSql(sql) {
  const file = path.join(os.tmpdir(), `nabd-setup-${Date.now()}-${Math.random().toString(36).slice(2)}.sql`);
  fs.writeFileSync(file, sql);
  return file;
}

function runSeed({ databaseUrl, isPackaged, resourcesPath, logger }) {
  return new Promise((resolve, reject) => {
    const serverRoot = isPackaged ? path.join(resourcesPath, 'server') : path.join(__dirname, '..', '..', 'server');
    const seedPath = path.join(isPackaged ? resourcesPath : path.join(__dirname, '..', '..'), 'prisma', 'seed.js');
    execFile(process.execPath, [seedPath], {
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl,
        // process.execPath داخل عملية Electron الرئيسية يشير لثنائي Electron
        // نفسه، وليس Node عادي. بدون هذا المتغير، تحاول العملية الفرعية
        // إقلاع Electron من جديد بدلاً من تشغيل seed.js كسكريبت Node بسيط —
        // وهو خطأ حقيقي تم اكتشافه أثناء اختبار فعلي، وليس احتياطاً نظرياً.
        ELECTRON_RUN_AS_NODE: '1',
      },
      cwd: serverRoot,
    }, (error, stdout, stderr) => {
      if (stdout) logger(stdout);
      if (error) return reject(new Error(stderr || error.message));
      resolve();
    });
  });
}

module.exports = { runFirstTimeSetup, applyMigrations, ensureDatabaseExists, generateSecret, LOCAL_DB_PORT };