const service = require('../services/subscription.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

const renew = asyncHandler(async (req, res) => {
  const result = await service.renew(req.params.memberId, req.body, req.user.id);
  new ApiResponse(201, result, 'تم تجديد الاشتراك وتسجيل الدفعة بنجاح').send(res);
});

const listByMember = asyncHandler(async (req, res) => {
  const subscriptions = await service.listByMember(req.params.memberId);
  new ApiResponse(200, subscriptions).send(res);
});

const expiringSoon = asyncHandler(async (req, res) => {
  const withinDays = req.query.withinDays ? Number(req.query.withinDays) : 10;
  const subscriptions = await service.expiringSoon(withinDays);
  new ApiResponse(200, subscriptions).send(res);
});

module.exports = { renew, listByMember, expiringSoon };
