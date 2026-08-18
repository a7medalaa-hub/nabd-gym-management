const service = require('../services/backup.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

const create = asyncHandler(async (req, res) => {
  const backup = await service.createBackup();
  new ApiResponse(201, backup, 'تم إنشاء نسخة احتياطية بنجاح').send(res);
});

const list = asyncHandler(async (req, res) => {
  const backups = await service.listBackups();
  new ApiResponse(200, backups).send(res);
});

const restore = asyncHandler(async (req, res) => {
  await service.restoreBackup(req.body.filename);
  new ApiResponse(200, null, 'تمت استعادة النسخة الاحتياطية بنجاح').send(res);
});

module.exports = { create, list, restore };
