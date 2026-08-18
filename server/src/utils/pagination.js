/**
 * pagination.js — أدوات مشتركة للترقيم تُستخدم في كل خدمة تعرض قائمة
 * (أعضاء، اشتراكات، منتجات...) حتى يبقى شكل الاستجابة وسلوك الترقيم موحّداً.
 */
const { PAGINATION } = require('../config/constants');

/** يحوّل query params الخام (نصوص) إلى { page, limit, skip } آمنة الاستخدام. */
function parsePagination(query) {
  let page = parseInt(query.page, 10);
  let limit = parseInt(query.limit, 10);

  if (!Number.isInteger(page) || page < 1) page = PAGINATION.DEFAULT_PAGE;
  if (!Number.isInteger(limit) || limit < 1) limit = PAGINATION.DEFAULT_LIMIT;
  if (limit > PAGINATION.MAX_LIMIT) limit = PAGINATION.MAX_LIMIT;

  return { page, limit, skip: (page - 1) * limit };
}

/** يبني كائن meta موحّد لإرفاقه مع أي استجابة قائمة مُرقّمة. */
function buildMeta({ page, limit, total }) {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

module.exports = { parsePagination, buildMeta };
