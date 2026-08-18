/**
 * subscription.service.js — إنشاء وتجديد الاشتراكات، مرتبطة دائماً بعملية
 * دفع (Payment) تُسجَّل تلقائياً — بالضبط كما يفعل renewMember() في نموذج app.js
 * الأصلي للواجهة، لكن الآن كعملية قاعدة بيانات حقيقية وذرية (transaction).
 */
const { prisma } = require('../config/db');
const ApiError = require('../utils/ApiError');
const { PAYMENT_TYPE } = require('../config/constants');

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** الاشتراك الأحدث لعضو (بحسب تاريخ الانتهاء)، بغض النظر عن كونه فعّالاً أم لا. */
async function getLatestSubscription(memberId) {
  return prisma.subscription.findFirst({
    where: { memberId },
    orderBy: { endDate: 'desc' },
    include: { subscriptionType: true },
  });
}

/**
 * createInitialSubscription — تُستدعى من member.service.js داخل نفس الـ
 * transaction عند إضافة عضو جديد. لا تُنشئ transaction خاصة بها.
 */
async function createInitialSubscription(tx, { memberId, subscriptionTypeId, startDate, paymentMethod, createdByUserId }) {
  const type = await tx.subscriptionType.findUnique({ where: { id: subscriptionTypeId } });
  if (!type || !type.isActive) throw ApiError.badRequest('نوع الاشتراك غير موجود أو غير فعّال');

  const start = new Date(startDate);
  const end = addDays(start, type.durationDays);

  const subscription = await tx.subscription.create({
    data: {
      memberId, subscriptionTypeId, startDate: start, endDate: end,
      status: 'ACTIVE', priceAtPurchase: type.price, createdByUserId,
    },
  });

  const payment = await tx.payment.create({
    data: {
      memberId, subscriptionId: subscription.id, amount: type.price,
      method: paymentMethod, type: PAYMENT_TYPE.NEW_SUBSCRIPTION,
      receivedByUserId: createdByUserId,
    },
  });

  return { subscription, payment };
}

/**
 * renew — يمدّد اشتراك عضو موجود. إن كان لديه اشتراك لم ينتهِ بعد، يُضاف
 * التجديد فوق تاريخ انتهائه الحالي (بدل استبداله) حتى لا يخسر العضو أي مدة
 * دفعها بالفعل؛ وإلا يبدأ التجديد من اليوم.
 */
async function renew(memberId, { subscriptionTypeId, paymentMethod }, createdByUserId) {
  const member = await prisma.member.findUnique({ where: { id: memberId } });
  if (!member) throw ApiError.notFound('العضو غير موجود');

  const type = await prisma.subscriptionType.findUnique({ where: { id: subscriptionTypeId } });
  if (!type || !type.isActive) throw ApiError.badRequest('نوع الاشتراك غير موجود أو غير فعّال');

  const latest = await getLatestSubscription(memberId);
  const now = new Date();
  const base = latest && latest.status !== 'CANCELLED' && latest.endDate > now ? latest.endDate : now;
  const start = base;
  const end = addDays(base, type.durationDays);

  return prisma.$transaction(async (tx) => {
    const subscription = await tx.subscription.create({
      data: {
        memberId, subscriptionTypeId, startDate: start, endDate: end,
        status: 'ACTIVE', priceAtPurchase: type.price, createdByUserId,
      },
    });
    const payment = await tx.payment.create({
      data: {
        memberId, subscriptionId: subscription.id, amount: type.price,
        method: paymentMethod, type: PAYMENT_TYPE.RENEWAL, receivedByUserId: createdByUserId,
      },
    });
    return { subscription, payment };
  });
}

async function listByMember(memberId) {
  return prisma.subscription.findMany({
    where: { memberId },
    include: { subscriptionType: true },
    orderBy: { startDate: 'desc' },
  });
}

/**
 * expiringSoon — كل اشتراك فعّال (غير مُلغى) ينتهي خلال withinDays أيام
 * من الآن، ويشمل أيضاً ما انتهى فعلاً خلال آخر ٣٠ يوماً (نفس منطق الواجهة
 * الأصلية، حتى لا تختفي التنبيهات فجأة بمجرد انتهاء الاشتراك).
 */
async function expiringSoon(withinDays = 10) {
  const now = new Date();
  const upperBound = addDays(now, withinDays);
  const lowerBound = addDays(now, -30);

  return prisma.subscription.findMany({
    where: {
      status: { not: 'CANCELLED' },
      endDate: { gte: lowerBound, lte: upperBound },
    },
    include: { member: true, subscriptionType: true },
    orderBy: { endDate: 'asc' },
  });
}

module.exports = { getLatestSubscription, createInitialSubscription, renew, listByMember, expiringSoon, addDays };
