const service = require('../services/payment.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

const list = asyncHandler(async (req, res) => {
  const { data, meta } = await service.list(req.query);
  new ApiResponse(200, data, 'سجل المدفوعات', meta).send(res);
});

const todaySummary = asyncHandler(async (req, res) => {
  const summary = await service.todaySummary();
  new ApiResponse(200, summary).send(res);
});

module.exports = { list, todaySummary };
