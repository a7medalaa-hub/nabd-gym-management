/**
 * auth.service.js — منطق تسجيل الدخول وتغيير كلمة المرور.
 * لا يوجد تسجيل عام (public registration) — حسابات الموظفين تُنشأ فقط عبر
 * user.service.js من قِبل مستخدم يملك صلاحية users.manage (عادة المالك).
 */
const { prisma } = require('../config/db');
const { hashPassword, comparePassword } = require('../utils/password.util');
const { signToken } = require('../utils/jwt.util');
const ApiError = require('../utils/ApiError');

async function login({ username, password }) {
  const user = await prisma.user.findUnique({
    where: { username },
    include: { role: { include: { permissions: { include: { permission: true } } } } },
  });

  if (!user || !user.isActive) {
    throw ApiError.unauthorized('اسم المستخدم أو كلمة المرور غير صحيحة');
  }

  const isMatch = await comparePassword(password, user.passwordHash);
  if (!isMatch) {
    throw ApiError.unauthorized('اسم المستخدم أو كلمة المرور غير صحيحة');
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  const permissions = user.role.permissions.map((rp) => rp.permission.key);
  const token = signToken({ sub: user.id, roleId: user.roleId });

  return {
    token,
    user: {
      id: user.id,
      fullName: user.fullName,
      username: user.username,
      roleId: user.roleId,
      roleName: user.role.name,
      permissions,
    },
  };
}

async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.notFound('المستخدم غير موجود');

  const isMatch = await comparePassword(currentPassword, user.passwordHash);
  if (!isMatch) throw ApiError.badRequest('كلمة المرور الحالية غير صحيحة');

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
}

module.exports = { login, changePassword };
