const service = require('../services/sale.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

const create = asyncHandler(async (req, res) => {
  const sale = await service.create(req.body, req.user.id);
  new ApiResponse(201, sale, 'تم إصدار الفاتورة بنجاح').send(res);
});

const list = asyncHandler(async (req, res) => {
  const { data, meta } = await service.list(req.query);
  new ApiResponse(200, data, 'سجل المبيعات', meta).send(res);
});

const todaySummary = asyncHandler(async (req, res) => {
  const summary = await service.todaySummary();
  new ApiResponse(200, summary).send(res);
});

module.exports = { create, list, todaySummary };
