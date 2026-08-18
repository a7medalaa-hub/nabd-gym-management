const service = require('../services/product.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

const list = asyncHandler(async (req, res) => {
  const includeInactive = req.query.includeInactive === 'true';
  const products = await service.list({ includeInactive });
  new ApiResponse(200, products).send(res);
});

const create = asyncHandler(async (req, res) => {
  const product = await service.create(req.body);
  new ApiResponse(201, product, 'تمت إضافة المنتج بنجاح').send(res);
});

const update = asyncHandler(async (req, res) => {
  const product = await service.update(req.params.id, req.body);
  new ApiResponse(200, product, 'تم تحديث المنتج').send(res);
});

const deactivate = asyncHandler(async (req, res) => {
  await service.deactivate(req.params.id);
  new ApiResponse(200, null, 'تم إيقاف المنتج').send(res);
});

const adjustStock = asyncHandler(async (req, res) => {
  const txn = await service.adjustStock(req.params.id, req.body, req.user.id);
  new ApiResponse(201, txn, 'تم تحديث المخزون بنجاح').send(res);
});

module.exports = { list, create, update, deactivate, adjustStock };
