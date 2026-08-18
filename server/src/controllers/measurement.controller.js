const service = require('../services/measurement.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

const create = asyncHandler(async (req, res) => {
  const measurement = await service.create(req.body);
  new ApiResponse(201, measurement, 'تم تسجيل القياسات بنجاح').send(res);
});

const listByMember = asyncHandler(async (req, res) => {
  const rows = await service.listByMember(req.params.memberId);
  new ApiResponse(200, rows).send(res);
});

module.exports = { create, listByMember };
