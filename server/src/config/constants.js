/**
 * constants.js — قيم ثابتة يُعاد استخدامها في أكثر من ملف، حتى لا تتكرر
 * كنصوص سحرية (magic strings) متفرقة عبر المشروع.
 */
module.exports = {
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
  },
  SUBSCRIPTION_STATUS: {
    ACTIVE: 'ACTIVE',
    EXPIRED: 'EXPIRED',
    CANCELLED: 'CANCELLED',
  },
  PAYMENT_TYPE: {
    NEW_SUBSCRIPTION: 'NEW_SUBSCRIPTION',
    RENEWAL: 'RENEWAL',
    OTHER: 'OTHER',
  },
  PAYMENT_METHOD: {
    CASH: 'CASH',
    CARD: 'CARD',
    WALLET: 'WALLET',
    OTHER: 'OTHER',
  },
  UPLOAD_LIMITS: {
    MAX_IMAGE_SIZE_MB: 5,
    ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  },
};
