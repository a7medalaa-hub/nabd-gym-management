/**
 * jwt.util.js — توليد والتحقق من رموز JWT لجلسات الموظفين.
 */
const jwt = require('jsonwebtoken');
const env = require('../config/env');

function signToken(payload) {
  return jwt.sign(payload, env.jwt.secret, { expiresIn: env.jwt.expiresIn });
}

function verifyToken(token) {
  return jwt.verify(token, env.jwt.secret); // يرمي استثناء تلقائياً إذا كان غير صالح/منتهياً
}

module.exports = { signToken, verifyToken };
