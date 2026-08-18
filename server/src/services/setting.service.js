/**
 * setting.service.js — تخزين مفتاح/قيمة بسيط لإعدادات الجيم العامة.
 */
const { prisma } = require('../config/db');

async function getAll() {
  const rows = await prisma.setting.findMany();
  // نحوّلها لكائن مسطّح {key: value} أسهل للواجهة الأمامية من التعامل معه كمصفوفة
  return rows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {});
}

async function updateMany(settingsObj) {
  await prisma.$transaction(
    Object.entries(settingsObj).map(([key, value]) =>
      prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } })
    )
  );
  return getAll();
}

module.exports = { getAll, updateMany };
