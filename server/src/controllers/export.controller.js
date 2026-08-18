/**
 * export.controller.js — يتولى تفاصيل بروتوكول HTTP للتنزيل (الترويسات
 * وربط الـ streams بالاستجابة)، بينما export.service.js يبني المحتوى فقط.
 */
const service = require('../services/export.service');
const asyncHandler = require('../utils/asyncHandler');

const membersExcel = asyncHandler(async (req, res) => {
  const workbook = await service.membersWorkbook();
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="members.xlsx"');
  await workbook.xlsx.write(res);
  res.end();
});

const invoicePdf = asyncHandler(async (req, res) => {
  const doc = await service.invoicePdf(req.params.saleId);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="invoice-${req.params.saleId}.pdf"`);
  doc.pipe(res); // يجب تعليق pipe قبل end() حتى لا تُفقد البيانات المُخزَّنة مؤقتاً
  doc.end();
});

module.exports = { membersExcel, invoicePdf };
