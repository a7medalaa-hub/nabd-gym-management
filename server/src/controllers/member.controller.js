const memberService = require('../services/member.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

const list = asyncHandler(async (req, res) => {
  const { data, meta } = await memberService.list(req.query);
  new ApiResponse(200, data, 'قائمة المشتركين', meta).send(res);
});

const getById = asyncHandler(async (req, res) => {
  const member = await memberService.getById(req.params.id);
  new ApiResponse(200, member).send(res);
});

const create = asyncHandler(async (req, res) => {
  const member = await memberService.create({ ...req.body, createdByUserId: req.user.id });
  new ApiResponse(201, member, 'تمت إضافة المشترك بنجاح').send(res);
});

const update = asyncHandler(async (req, res) => {
  const member = await memberService.update(req.params.id, req.body);
  new ApiResponse(200, member, 'تم تحديث بيانات المشترك').send(res);
});

const softDelete = asyncHandler(async (req, res) => {
  await memberService.softDelete(req.params.id);
  new ApiResponse(200, null, 'تم إلغاء تفعيل المشترك').send(res);
});

const uploadPhoto = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('لم يتم إرفاق أي صورة');
  const photoUrl = `/uploads/members/${req.file.filename}`;
  const member = await memberService.setPhoto(req.params.id, photoUrl);
  new ApiResponse(200, member, 'تم رفع صورة العضو بنجاح').send(res);
});

module.exports = { list, getById, create, update, softDelete, uploadPhoto };
