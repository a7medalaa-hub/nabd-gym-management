/**
 * password.util.js — تشفير والتحقق من كلمات المرور عبر bcryptjs
 * (نسخة JS خالصة، بدون تبعيات native — أكثر أماناً عند التغليف مع Electron).
 */
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

async function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

async function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

module.exports = { hashPassword, comparePassword };
