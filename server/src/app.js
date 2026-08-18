/**
 * app.js — تجميع تطبيق Express: middlewares عامة، تقديم الملفات المرفوعة
 * بشكل ثابت، تركيب كل مسارات /api، ثم معالجات "غير موجود" والأخطاء
 * في النهاية دائماً (ترتيبهما إلزامي في Express).
 */
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const routes = require('./routes');
const requestLogger = require('./middlewares/requestLogger.middleware');
const notFound = require('./middlewares/notFound.middleware');
const errorHandler = require('./middlewares/error.middleware');

const app = express();

// تطبيق سطح مكتب محلي بالكامل — الواجهة تُحمَّل من نفس الجهاز غالباً عبر
// Electron (file:// أو localhost)، فـ CORS مفتوح محلياً لكنه يبقى مُفعَّلاً
// كطبقة أمان أساسية بدل تعطيله كلياً.
app.use(cors());
app.use(helmet({ crossOriginResourcePolicy: false })); // معطَّلة لصور /uploads كي تُعرض من الواجهة
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// حماية بسيطة من الطلبات المفرطة (مفيدة حتى محلياً ضد أخطاء برمجية تُغرق الخادم)
app.use(
  '/api',
  rateLimit({ windowMs: 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false })
);

// الصور المرفوعة (صور الأعضاء والمنتجات) تُقدَّم مباشرة كملفات ثابتة
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));
app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
