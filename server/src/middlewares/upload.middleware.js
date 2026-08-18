/**
 * upload.middleware.js — إعداد Multer لرفع الصور (عضو أو منتج) إلى القرص
 * المحلي مباشرة تحت server/uploads/، مع تحقق من النوع والحجم قبل الحفظ.
 */
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const ApiError = require('../utils/ApiError');
const { UPLOAD_LIMITS } = require('../config/constants');

function buildStorage(subfolder) {
  return multer.diskStorage({
    destination: path.join(__dirname, '..', '..', 'uploads', subfolder),
    filename: (req, file, cb) => {
      const uniqueSuffix = crypto.randomBytes(8).toString('hex');
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${Date.now()}-${uniqueSuffix}${ext}`);
    },
  });
}

function imageFileFilter(req, file, cb) {
  if (!UPLOAD_LIMITS.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(ApiError.badRequest('صيغة الصورة غير مدعومة — المسموح: JPG, PNG, WEBP فقط'));
  }
  cb(null, true);
}

function makeImageUploader(subfolder) {
  return multer({
    storage: buildStorage(subfolder),
    fileFilter: imageFileFilter,
    limits: { fileSize: UPLOAD_LIMITS.MAX_IMAGE_SIZE_MB * 1024 * 1024 },
  });
}

module.exports = {
  uploadMemberPhoto: makeImageUploader('members').single('photo'),
  uploadProductImage: makeImageUploader('products').single('image'),
};
