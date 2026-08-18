/**
 * product.validator.js — إدارة كتالوج منتجات بار الجيم والمخزون.
 */
const { z } = require('zod');

const create = z.object({
  body: z.object({
    name: z.string().min(2, 'اسم المنتج قصير جداً'),
    sku: z.string().optional().nullable(),
    category: z.string().optional().nullable(),
    price: z.coerce.number().nonnegative('السعر لا يمكن أن يكون سالباً'),
    costPrice: z.coerce.number().nonnegative().optional().nullable(),
    imageUrl: z.string().optional().nullable(),
    stockQuantity: z.coerce.number().int().nonnegative().default(0),
    lowStockThreshold: z.coerce.number().int().nonnegative().default(5),
  }),
});

const update = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    name: z.string().min(2).optional(),
    sku: z.string().optional().nullable(),
    category: z.string().optional().nullable(),
    price: z.coerce.number().nonnegative().optional(),
    costPrice: z.coerce.number().nonnegative().optional().nullable(),
    imageUrl: z.string().optional().nullable(),
    lowStockThreshold: z.coerce.number().int().nonnegative().optional(),
    isActive: z.boolean().optional(),
  }),
});

/**
 * stockAdjustment — دلالة حقل quantity تعتمد على النوع:
 * STOCK_IN/STOCK_OUT: كمية تُضاف/تُطرح من الرصيد الحالي.
 * ADJUSTMENT: الرصيد الجديد المطلق (تصحيح جرد).
 */
const stockAdjustment = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    type: z.enum(['STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT']),
    quantity: z.coerce.number().int().nonnegative('الكمية يجب أن تكون رقماً صحيحاً غير سالب'),
    note: z.string().optional().nullable(),
  }),
});

const idParam = z.object({ params: z.object({ id: z.string().uuid() }) });

module.exports = { create, update, stockAdjustment, idParam };
