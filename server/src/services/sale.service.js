/**
 * sale.service.js — إنشاء فاتورة بيع من بار الجيم (POS). كل شيء يحدث في
 * transaction واحدة ذرية: التحقق من توفر المخزون لكل عنصر أولاً (فيفشل
 * الطلب بالكامل بدل بيع بعض العناصر ونفاد غيرها)، ثم إنشاء الفاتورة
 * وعناصرها، ثم خصم المخزون مع تسجيل حركة SALE لكل عنصر.
 */
const { prisma } = require('../config/db');
const ApiError = require('../utils/ApiError');

function generateInvoiceNumber() {
  return `INV-${Date.now().toString(36).toUpperCase()}`;
}

function dayBounds(date = new Date()) {
  const start = new Date(date); start.setHours(0, 0, 0, 0);
  const end = new Date(date); end.setHours(23, 59, 59, 999);
  return { start, end };
}

async function create({ items, memberId, paymentMethod }, soldByUserId) {
  return prisma.$transaction(async (tx) => {
    let totalAmount = 0;
    const resolvedItems = [];

    // مرحلة التحقق أولاً — قبل أي كتابة، حتى لا تُخصم كمية جزئية ثم يفشل عنصر لاحق
    for (const item of items) {
      const product = await tx.product.findUnique({ where: { id: item.productId } });
      if (!product || !product.isActive) throw ApiError.badRequest('أحد المنتجات في الفاتورة غير متاح');
      if (product.stockQuantity < item.quantity) {
        throw ApiError.badRequest(`لا يوجد مخزون كافٍ من "${product.name}" (المتاح: ${product.stockQuantity})`);
      }
      const subtotal = Number(product.price) * item.quantity;
      totalAmount += subtotal;
      resolvedItems.push({ product, quantity: item.quantity, unitPrice: product.price, subtotal });
    }

    const sale = await tx.sale.create({
      data: {
        invoiceNumber: generateInvoiceNumber(),
        memberId: memberId || null,
        totalAmount,
        paymentMethod,
        soldByUserId,
        items: {
          create: resolvedItems.map((r) => ({
            productId: r.product.id, quantity: r.quantity, unitPrice: r.unitPrice, subtotal: r.subtotal,
          })),
        },
      },
      include: { items: { include: { product: true } }, member: { select: { id: true, fullName: true } } },
    });

    for (const r of resolvedItems) {
      await tx.product.update({ where: { id: r.product.id }, data: { stockQuantity: { decrement: r.quantity } } });
      await tx.inventoryTransaction.create({
        data: { productId: r.product.id, type: 'SALE', quantity: -r.quantity, note: `فاتورة ${sale.invoiceNumber}` },
      });
    }

    return sale;
  });
}

async function list({ page, limit, from, to }) {
  const { parsePagination, buildMeta } = require('../utils/pagination');
  const { skip, page: safePage, limit: safeLimit } = parsePagination({ page, limit });

  const where = from || to
    ? { createdAt: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } }
    : {};

  const [rows, total] = await Promise.all([
    prisma.sale.findMany({
      where, include: { items: true, member: { select: { fullName: true } } },
      orderBy: { createdAt: 'desc' }, skip, take: safeLimit,
    }),
    prisma.sale.count({ where }),
  ]);
  return { data: rows, meta: buildMeta({ page: safePage, limit: safeLimit, total }) };
}

async function todaySummary() {
  const { start, end } = dayBounds();
  const result = await prisma.sale.aggregate({
    where: { createdAt: { gte: start, lte: end } },
    _sum: { totalAmount: true },
    _count: true,
  });
  return { total: Number(result._sum.totalAmount || 0), count: result._count };
}

module.exports = { create, list, todaySummary };
