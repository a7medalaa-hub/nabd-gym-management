const service = require('../services/notification.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

const list = asyncHandler(async (req, res) => {
  const { data, meta, unreadCount } = await service.listForCurrentUser(req.user.id, req.query);
  new ApiResponse(200, data, 'الإشعارات', { ...meta, unreadCount }).send(res);
});

const markRead = asyncHandler(async (req, res) => {
  const notification = await service.markRead(req.params.id);
  new ApiResponse(200, notification, 'تم تعليم الإشعار كمقروء').send(res);
});

module.exports = { list, markRead };
