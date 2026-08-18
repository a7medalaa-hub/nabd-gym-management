const service = require('../services/weightLog.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

const create = asyncHandler(async (req, res) => {
  const log = await service.create(req.body);
  new ApiResponse(201, log, 'تم تسجيل القياس بنجاح').send(res);
});

const listByMember = asyncHandler(async (req, res) => {
  const result = await service.listByMember(req.params.memberId);
  new ApiResponse(200, result).send(res);
});

module.exports = { create, listByMember };
