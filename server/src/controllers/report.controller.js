const service = require('../services/report.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

const summary = asyncHandler(async (req, res) => {
  const data = await service.summary(req.query.from, req.query.to);
  new ApiResponse(200, data).send(res);
});

module.exports = { summary };
