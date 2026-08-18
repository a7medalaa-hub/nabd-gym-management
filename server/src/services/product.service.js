/**
 * product.service.js — كتالوج المنتجات وحركات المخزون. لا يُعدَّل
 * stockQuantity مباشرة أبداً خارج adjustStock/الشراء — كل تغيير في الرصيد
 * يُسجَّل كصف InventoryTransaction، حتى يبقى هناك سجل تدقيق كامل قابل
 * للمراجعة (من غيّر الكمية، متى، ولماذا).
 */
const { prisma } = require('../config/db');
const ApiError = require('../utils/ApiError');

async function list({ includeInactive = false } = {}) {
  return prisma.product.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: { name: 'asc' },
  });
}

async function getById(id) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw ApiError.notFound('المنتج غير موجود');
  return product;
}

async function create({ stockQuantity, ...rest }) {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.create({ data: { ...rest, stockQuantity } });
    if (stockQuantity > 0) {
      await tx.inventoryTransaction.create({
        data: { productId: product.id, type: 'STOCK_IN', quantity: stockQuantity, note: 'رصيد افتتاحي' },
      });
    }
    return product;
  });
}

async function update(id, data) {
  await getById(id);
  return prisma.product.update({ where: { id }, data });
}

async function deactivate(id) {
  await getById(id);
  return prisma.product.update({ where: { id }, data: { isActive: false } });
}

async function adjustStock(id, { type, quantity, note }, changedByUserId) {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id } });
    if (!product) throw ApiError.notFound('المنتج غير موجود');

    let newQuantity;
    let loggedDelta;
    if (type === 'STOCK_IN') {
      newQuantity = product.stockQuantity + quantity;
      loggedDelta = quantity;
    } else if (type === 'STOCK_OUT') {
      newQuantity = product.stockQuantity - quantity;
      loggedDelta = -quantity;
      if (newQuantity < 0) throw ApiError.badRequest('الكمية المطلوب سحبها أكبر من الرصيد المتاح');
    } else {
      // ADJUSTMENT: quantity هنا هي الرصيد الجديد المطلق (تصحيح جرد)
      newQuantity = quantity;
      loggedDelta = quantity - product.stockQuantity;
    }

    await tx.product.update({ where: { id }, data: { stockQuantity: newQuantity } });
    return tx.inventoryTransaction.create({
      data: { productId: id, type, quantity: loggedDelta, note, changedByUserId },
    });
  });
}

module.exports = { list, getById, create, update, deactivate, adjustStock };
