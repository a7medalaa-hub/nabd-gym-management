/**
 * postgres-manager.js — دورة حياة PostgreSQL المحلي المُجمَّع مع التطبيق:
 * تهيئة أول تشغيل (initdb)، التشغيل (pg_ctl start)، والإيقاف الآمن
 * (pg_ctl stop) عند إغلاق التطبيق.
 *
 * حل مسارات الملفات التنفيذية (binaries) واحد في كلا الوضعين — راجع
 * resolveBinDir أدناه للتفصيل الكامل. لا يوجد افتراض عن نظام تشغيل معيّن.
 *
 * هذا الملف عمداً لا يعتمد على أي شيء من Electron نفسه (app, BrowserWindow)
 * حتى يمكن اختباره بمعزل تام في Node عادي — وهو ما تم فعلاً في هذا الـ sandbox.
 */
const path = require('path');
const fs = require('fs');
const { spawn, execFile } = require('child_process');

/**
 * حل مسارات الملفات التنفيذية (binaries) — نفس المصدر في وضعي التطوير
 * والتطبيق المُجمَّع، بدون أي افتراض خاص بنظام تشغيل معيّن:
 * - التطبيق المُجمَّع (isPackaged=true): resources/pgsql/bin داخل حزمة
 *   التثبيت (تُضاف عبر extraResources في package.json الجذري).
 * - وضع التطوير (isPackaged=false): نفس المجلد resources/pgsql/bin لكن من
 *   جذر المشروع مباشرة — نفس الملفات المحمولة التي يستخدمها التطبيق
 *   المُجمَّع، فلا داعي لتثبيت PostgreSQL منفصل على جهاز التطوير، ولا وجود
 *   لأي افتراض عن نظام تشغيل بعينه (كان هنا سابقاً مسار خاص بلينكس فقط —
 *   وهو خطأ حقيقي تم تصحيحه). PG_BIN_DIR يبقى متاحاً كتجاوز اختياري فقط
 *   لمن يريد استخدام تثبيت Postgres آخر على مستوى النظام.
 */
function resolveBinDir({ isPackaged, resourcesPath }) {
  if (isPackaged) {
    return path.join(resourcesPath, 'pgsql', 'bin');
  }
  return process.env.PG_BIN_DIR || path.join(__dirname, '..', 'resources', 'pgsql', 'bin');
}

function execFileP(command, args, opts = {}) {
  return new Promise((resolve, reject) => {
    execFile(command, args, opts, (error, stdout, stderr) => {
      if (error) return reject(new Error(stderr || error.message));
      resolve(stdout);
    });
  });
}

class PostgresManager {
  /**
   * @param {object} options
   * @param {string} options.dataDir - مجلد بيانات Postgres المحلي (عادة داخل userData الخاص بـ Electron)
   * @param {number} options.port - المنفذ المحلي (يُفضَّل غير ٥٤٣٢ الافتراضي لتفادي تعارض مع أي تثبيت آخر)
   * @param {string} options.superuserPassword - كلمة مرور المستخدم postgres، مولَّدة عشوائياً عند أول تشغيل
   * @param {boolean} options.isPackaged - قيمة app.isPackaged من Electron
   * @param {string} options.resourcesPath - قيمة process.resourcesPath
   * @param {(msg:string)=>void} [options.logger]
   */
  constructor({ dataDir, port, superuserPassword, isPackaged, resourcesPath, logger = console.log }) {
    this.dataDir = dataDir;
    this.port = port;
    this.superuserPassword = superuserPassword;
    this.binDir = resolveBinDir({ isPackaged, resourcesPath });
    this.logger = logger;
    this.child = null;
  }

  bin(name) {
    // على ويندوز، الملفات التنفيذية تحمل امتداد .exe فعلياً على القرص،
    // وspawn/execFile لا يضيفانه تلقائياً عند إعطاء مسار كامل صريح (بخلاف
    // البحث عبر PATH). هذا خطأ حقيقي كان سيمنع التشغيل على ويندوز تحديداً.
    const exeName = process.platform === 'win32' ? `${name}.exe` : name;
    return path.join(this.binDir, exeName);
  }

  isInitialized() {
    return fs.existsSync(path.join(this.dataDir, 'PG_VERSION'));
  }

  /** initialize — تُستدعى مرة واحدة فقط عند أول تشغيل للتطبيق على هذا الجهاز. */
  async initialize() {
    if (this.isInitialized()) {
      this.logger('مجلد بيانات PostgreSQL موجود بالفعل — تخطّي initdb');
      return;
    }
    fs.mkdirSync(this.dataDir, { recursive: true });

    // كلمة المرور تُمرَّر عبر ملف مؤقت (--pwfile)، وليس كوسيط سطر أوامر مباشر،
    // حتى لا تظهر في قائمة العمليات (ps) على الجهاز.
    const pwFile = path.join(this.dataDir, '..', '.pg_pw_tmp');
    fs.writeFileSync(pwFile, this.superuserPassword, { mode: 0o600 });
    try {
      await execFileP(this.bin('initdb'), [
        '-D', this.dataDir,
        '-U', 'postgres',
        '--pwfile', pwFile,
        '--auth=scram-sha-256',
        '--encoding=UTF8',
      ]);
      this.logger('✅ تم تهيئة مجلد بيانات PostgreSQL جديد');
    } finally {
      fs.unlinkSync(pwFile);
    }
  }

  /** start — يشغّل خادم Postgres كعملية فرعية على المنفذ المحلي المحدَّد فقط (127.0.0.1). */
  async start() {
    if (this.child) return;
    await new Promise((resolve, reject) => {
      this.child = spawn(this.bin('postgres'), [
        '-D', this.dataDir,
        '-p', String(this.port),
        '-h', '127.0.0.1', // استماع محلي فقط — لا اتصال شبكي خارجي إطلاقاً، يطابق قرار "بدون إنترنت"
        // المسار الافتراضي لملف قفل مقبس Unix (عادة /var/run/postgresql) قد لا
        // يملك المستخدم الحالي صلاحية الكتابة فيه على كل الأجهزة. تثبيته هنا
        // داخل مجلد بيانات التطبيق نفسه يضمن أنه دائماً قابل للكتابة — هذا خطأ
        // حقيقي اكتُشف أثناء اختبار فعلي في هذا الـ sandbox، وليس احتياطاً نظرياً.
        '-c', `unix_socket_directories=${this.dataDir}`,
      ]);

      let started = false;
      const onData = (data) => {
        const text = data.toString();
        if (!started && /database system is ready to accept connections/.test(text)) {
          started = true;
          this.logger(`✅ PostgreSQL يعمل محلياً على المنفذ ${this.port}`);
          resolve();
        }
      };
      this.child.stdout.on('data', onData);
      this.child.stderr.on('data', onData); // Postgres يكتب سجلّاته الافتراضية على stderr
      this.child.on('error', reject);
      this.child.on('exit', (code) => {
        this.child = null;
        if (!started) reject(new Error(`فشل تشغيل PostgreSQL (كود الخروج: ${code})`));
      });

      setTimeout(() => { if (!started) reject(new Error('انتهت مهلة انتظار تشغيل PostgreSQL')); }, 15000);
    });
  }

  /** stop — إيقاف آمن (graceful) — تُستدعى دائماً عند إغلاق نافذة التطبيق. */
  async stop() {
    if (!this.child) return;
    const pid = this.child.pid;
    this.child.kill('SIGTERM'); // Postgres يتعامل مع SIGTERM كإيقاف نظيف (Smart Shutdown)
    await new Promise((resolve) => {
      this.child.once('exit', resolve);
      setTimeout(resolve, 8000); // شبكة أمان — لا ننتظر إلى الأبد
    });
    this.child = null;
    this.logger(`تم إيقاف PostgreSQL (كانت العملية رقم ${pid})`);
  }

  connectionString(database = 'postgres') {
    return `postgresql://postgres:${encodeURIComponent(this.superuserPassword)}@127.0.0.1:${this.port}/${database}?schema=public`;
  }
}

/** resolveExecutable — نفس منطق PostgresManager#bin لكن كدالة مستقلة قابلة
 *  لإعادة الاستخدام من أي مكان (مثال: firstRun.js عند تشغيل psql مباشرة
 *  خارج نطاق كائن PostgresManager). */
function resolveExecutable(binDir, name) {
  const exeName = process.platform === 'win32' ? `${name}.exe` : name;
  return path.join(binDir, exeName);
}

module.exports = { PostgresManager, resolveBinDir, resolveExecutable };
