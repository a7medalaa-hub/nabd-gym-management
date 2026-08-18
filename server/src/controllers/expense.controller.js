const service = require('../services/expense.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

const create = asyncHandler(async (req, res) => {
  const expense = await service.create(req.body, req.user.id);
  new ApiResponse(201, expense, 'تم تسجيل المصروف بنجاح').send(res);
});

const list = asyncHandler(async (req, res) => {
  const { data, meta } = await service.list(req.query);
  new ApiResponse(200, data, 'سجل المصروفات', meta).send(res);
});

const remove = asyncHandler(async (req, res) => {
  await service.remove(req.params.id);
  new ApiResponse(200, null, 'تم حذف المصروف').send(res);
});

module.exports = { create, list, remove };
