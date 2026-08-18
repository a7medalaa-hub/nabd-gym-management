const service = require('../services/coach.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

const list = asyncHandler(async (req, res) => {
  const includeInactive = req.query.includeInactive === 'true';
  const coaches = await service.list({ includeInactive });
  new ApiResponse(200, coaches).send(res);
});

const create = asyncHandler(async (req, res) => {
  const coach = await service.create(req.body);
  new ApiResponse(201, coach, 'تمت إضافة المدرب بنجاح').send(res);
});

const update = asyncHandler(async (req, res) => {
  const coach = await service.update(req.params.id, req.body);
  new ApiResponse(200, coach, 'تم تحديث بيانات المدرب').send(res);
});

module.exports = { list, create, update };
