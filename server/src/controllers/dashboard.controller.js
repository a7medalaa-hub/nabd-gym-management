const service = require('../services/dashboard.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

const stats = asyncHandler(async (req, res) => {
  const data = await service.getStats();
  new ApiResponse(200, data, 'إحصائيات لوحة التحكم').send(res);
});

module.exports = { stats };
