const service = require('../services/subscriptionType.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

const list = asyncHandler(async (req, res) => {
  const includeInactive = req.query.includeInactive === 'true';
  const types = await service.list({ includeInactive });
  new ApiResponse(200, types).send(res);
});

const create = asyncHandler(async (req, res) => {
  const type = await service.create(req.body);
  new ApiResponse(201, type, 'تم إنشاء نوع الاشتراك بنجاح').send(res);
});

const update = asyncHandler(async (req, res) => {
  const type = await service.update(req.params.id, req.body);
  new ApiResponse(200, type, 'تم تحديث نوع الاشتراك').send(res);
});

const deactivate = asyncHandler(async (req, res) => {
  await service.deactivate(req.params.id);
  new ApiResponse(200, null, 'تم إيقاف نوع الاشتراك').send(res);
});

module.exports = { list, create, update, deactivate };
