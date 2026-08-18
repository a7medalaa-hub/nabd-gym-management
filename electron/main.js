/**
 * electron/main.js — عملية Electron الرئيسية. مسؤولة عن:
 * (١) تهيئة/تشغيل PostgreSQL المحلي أولاً،
 * (٢) تشغيل خادم Express كعملية فرعية منفصلة (fork) بعد استعداد القاعدة،
 * (٣) إنشاء نافذة التطبيق وتحميل شاشة الدخول،
 * (٤) إيقاف كل شيء بأمان (Postgres ثم Express) عند إغلاق التطبيق.
 *
 * لا يوجد أي منطق أعمال هنا — هذا الملف تنسيق (orchestration) فقط.
 */
const path = require('path');
const { app, BrowserWindow, Menu, shell } = require('electron');
const { fork } = require('child_process');
const { autoUpdater } = require('electron-updater');
const { runFirstTimeSetup } = require('./setup/firstRun');

const isPackaged = app.isPackaged;
const resourcesPath = process.resourcesPath;

let mainWindow = null;
let postgresManager = null;
let serverProcess = null;
const EXPRESS_PORT = 4000;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    show: false, // نُظهرها فقط بعد اكتمال التحميل — يمنع "ومضة" شاشة بيضاء
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false, // أمان: الواجهة (renderer) لا تصل لـ Node مباشرة إطلاقاً
    },
  });

  Menu.setApplicationMenu(null); // لا حاجة لقائمة تحرير/عرض افتراضية في تطبيق جيم محلي

  const indexPath = isPackaged
    ? path.join(process.resourcesPath, 'client', 'pages', 'login.html')
    : path.join(__dirname, '..', 'client', 'pages', 'login.html');
  mainWindow.loadFile(indexPath);

  mainWindow.once('ready-to-show', () => mainWindow.show());

  // أي رابط خارجي (مثل صفحة تنزيل التحديث) يُفتح في متصفح النظام لا داخل التطبيق
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

/** startExpressServer — يشغّل server/src/server.js كعملية Node منفصلة تماماً،
 *  حتى لا يؤدي أي عطل فيها لإسقاط نافذة التطبيق نفسها. */
function startExpressServer(databaseUrl, jwtSecret) {
  return new Promise((resolve, reject) => {
    const serverEntry = isPackaged
      ? path.join(resourcesPath, 'server', 'src', 'server.js')
      : path.join(__dirname, '..', 'server', 'src', 'server.js');

    serverProcess = fork(serverEntry, [], {
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl,
        JWT_SECRET: jwtSecret,
        PORT: String(EXPRESS_PORT),
        NODE_ENV: isPackaged ? 'production' : 'development',
      },
      silent: true,
    });

    serverProcess.stdout.on('data', (d) => console.log(`[server] ${d}`.trim()));
    serverProcess.stderr.on('data', (d) => console.error(`[server] ${d}`.trim()));

    let resolved = false;
    // خادم Express يطبع سطر "🚀 خادم نبض يعمل" عند نجاح الإقلاع — راجع server.js
    serverProcess.stdout.on('data', (d) => {
      if (!resolved && d.toString().includes('🚀')) { resolved = true; resolve(); }
    });
    serverProcess.on('error', reject);
    serverProcess.on('exit', (code) => {
      if (!resolved) reject(new Error(`فشل تشغيل خادم Express (كود الخروج: ${code})`));
    });
    setTimeout(() => { if (!resolved) reject(new Error('انتهت مهلة انتظار إقلاع خادم Express')); }, 15000);
  });
}

async function bootstrap() {
  try {
    const { postgres, databaseUrl } = await runFirstTimeSetup({
      userDataPath: app.getPath('userData'),
      isPackaged,
      resourcesPath,
      logger: console.log,
    });
    postgresManager = postgres;

    const fs = require('fs');
    const envPath = path.join(app.getPath('userData'), '.env');
    const jwtSecretLine = fs.readFileSync(envPath, 'utf8').match(/JWT_SECRET="(.+)"/);
    await startExpressServer(databaseUrl, jwtSecretLine[1]);

    createWindow();

    if (isPackaged) autoUpdater.checkForUpdatesAndNotify().catch(() => {
      // لا اتصال إنترنت؟ لا مشكلة — هذا تطبيق يعمل بالكامل بدون إنترنت أصلاً،
      // التحقق من التحديثات مجرد تحسين اختياري إن توفر الاتصال، وليس شرطاً.
    });
  } catch (err) {
    console.error('فشل إقلاع التطبيق:', err);
    const { dialog } = require('electron');
    dialog.showErrorBox('تعذّر تشغيل نبض', `حدث خطأ أثناء بدء التشغيل:\n${err.message}`);
    app.quit();
  }
}

async function shutdown() {
  if (serverProcess) { serverProcess.kill(); serverProcess = null; }
  if (postgresManager) { await postgresManager.stop(); }
}

app.whenReady().then(bootstrap);

app.on('window-all-closed', async () => {
  await shutdown();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', async (e) => {
  if (postgresManager?.child || serverProcess) {
    e.preventDefault();
    await shutdown();
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
