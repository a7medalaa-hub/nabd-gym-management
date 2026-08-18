/**
 * export.service.js — توليد ملفات حقيقية (.xlsx عبر exceljs، .pdf عبر
 * pdfkit) — كلتا المكتبتين JavaScript خالص بدون أي إضافات native، وهو
 * شرط مهم لتغليف التطبيق مع Electron لاحقاً في Phase 6 دون تعقيد.
 */
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const { prisma } = require('../config/db');
const ApiError = require('../utils/ApiError');

/** membersWorkbook — يبني ملف Excel لكل الأعضاء النشطين وحالتهم الحالية. */
async function membersWorkbook() {
  const members = await prisma.member.findMany({
    where: { isActive: true },
    include: { subscriptions: { orderBy: { endDate: 'desc' }, take: 1, include: { subscriptionType: true } } },
    orderBy: { createdAt: 'desc' },
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'نبض - نظام إدارة الجيم';
  const sheet = workbook.addWorksheet('المشتركون', { views: [{ rightToLeft: true }] });

  sheet.columns = [
    { header: 'الاسم', key: 'name', width: 28 },
    { header: 'الهاتف', key: 'phone', width: 16 },
    { header: 'نوع الاشتراك', key: 'type', width: 26 },
    { header: 'تاريخ الانتهاء', key: 'end', width: 16 },
    { header: 'الحالة', key: 'status', width: 12 },
  ];
  sheet.getRow(1).font = { bold: true };

  members.forEach((m) => {
    const latest = m.subscriptions[0];
    const isActive = latest && latest.status !== 'CANCELLED' && new Date(latest.endDate) >= new Date();
    sheet.addRow({
      name: m.fullName,
      phone: m.phone,
      type: latest?.subscriptionType.name || '—',
      end: latest ? new Date(latest.endDate).toLocaleDateString('ar-EG') : '—',
      status: isActive ? 'نشط' : 'منتهي',
    });
  });

  return workbook;
}

/**
 * invoicePdf — فاتورة بيع واحدة قابلة للطباعة.
 *
 * ⚠️ قيد معروف وموثَّق، وليس خطأً مخفياً: خطوط pdfkit المدمجة (Helvetica)
 * لا تدعم رسم الحروف العربية إطلاقاً ولا تنسيق RTL. النص العربي أدناه
 * سيظهر كمربعات فارغة أو غير مقروء حتى يُضاف خط عربي حقيقي (مثل Amiri أو
 * Cairo بصيغة .ttf) عبر doc.font('path/to/font.ttf') — مهمة تحسين لاحقة
 * موثّقة في PHASE5D_NOTES.md، وليست شيئاً يُفترض أنه يعمل الآن.
 */
async function invoicePdf(saleId) {
  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: { items: { include: { product: true } }, member: true, soldBy: true },
  });
  if (!sale) throw ApiError.notFound('الفاتورة غير موجودة');

  const doc = new PDFDocument({ size: 'A5', margin: 40 });

  doc.fontSize(18).text('نبض — فاتورة بيع', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(10).text(`رقم الفاتورة: ${sale.invoiceNumber}`);
  doc.text(`التاريخ: ${sale.createdAt.toLocaleString('en-GB')}`);
  doc.text(`العميل: ${sale.member?.fullName || 'عميل عابر'}`);
  doc.moveDown();

  sale.items.forEach((item) => {
    doc.text(`${item.product.name}  x${item.quantity}   —   ${item.subtotal} EGP`);
  });

  doc.moveDown();
  doc.fontSize(12).text(`الإجمالي: ${sale.totalAmount} EGP`, { align: 'left' });

  return doc; // stream غير منتهية عمداً — الـ controller يعمل doc.pipe(res) ثم doc.end()
}

module.exports = { membersWorkbook, invoicePdf };
