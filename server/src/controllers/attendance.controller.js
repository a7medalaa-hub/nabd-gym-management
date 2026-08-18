const service = require('../services/attendance.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

const checkIn = asyncHandler(async (req, res) => {
  const attendance = await service.checkIn(req.body.memberId, req.user.id);
  new ApiResponse(201, attendance, 'تم تسجيل الحضور بنجاح').send(res);
});

const today = asyncHandler(async (req, res) => {
  const rows = await service.todayList();
  new ApiResponse(200, rows).send(res);
});

const listByMember = asyncHandler(async (req, res) => {
  const rows = await service.listByMember(req.params.memberId);
  new ApiResponse(200, rows).send(res);
});

module.exports = { checkIn, today, listByMember };
