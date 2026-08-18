const service = require('../services/setting.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

const getAll = asyncHandler(async (req, res) => {
  const settings = await service.getAll();
  new ApiResponse(200, settings).send(res);
});

const update = asyncHandler(async (req, res) => {
  const settings = await service.updateMany(req.body.settings);
  new ApiResponse(200, settings, 'تم حفظ الإعدادات بنجاح').send(res);
});

module.exports = { getAll, update };
