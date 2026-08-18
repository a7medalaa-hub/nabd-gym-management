const userService = require('../services/user.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

const list = asyncHandler(async (req, res) => {
  const users = await userService.list();
  new ApiResponse(200, users).send(res);
});

const getById = asyncHandler(async (req, res) => {
  const user = await userService.getById(req.params.id);
  new ApiResponse(200, user).send(res);
});

const create = asyncHandler(async (req, res) => {
  const user = await userService.create(req.body);
  new ApiResponse(201, user, 'تم إنشاء حساب الموظف بنجاح').send(res);
});

const update = asyncHandler(async (req, res) => {
  const user = await userService.update(req.params.id, req.body);
  new ApiResponse(200, user, 'تم تحديث بيانات الموظف').send(res);
});

module.exports = { list, getById, create, update };
