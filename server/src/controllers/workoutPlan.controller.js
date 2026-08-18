const service = require('../services/workoutPlan.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

const create = asyncHandler(async (req, res) => {
  const plan = await service.create(req.body);
  new ApiResponse(201, plan, 'تم حفظ خطة التمرين بنجاح').send(res);
});

const current = asyncHandler(async (req, res) => {
  const plan = await service.current(req.params.memberId);
  new ApiResponse(200, plan).send(res);
});

module.exports = { create, current };
