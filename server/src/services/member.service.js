/**
 * member.service.js — العمليات الأساسية على المشتركين. "الحالة" (نشط/منتهي)
 * ليست عموداً مخزَّناً يُعاد حسابه بمهمة مجدولة، بل تُحسب مباشرة من تاريخ
 * انتهاء آخر اشتراك مقارنة بالآن — هذا يبقيها صحيحة دائماً بدون أي cron job،
 * وهو مناسب تماماً لحجم بيانات جيم واحد على جهاز واحد.
 *
 * ملاحظة أداء موثّقة عمداً: البحث النصي (search) يُنفَّذ على مستوى قاعدة
 * البيانات، لكن فلترة "الحالة" تُطبَّق بعد الجلب لأنها محسوبة وليست عموداً
 * يمكن الاستعلام عنه مباشرة في Prisma بدون SQL خام. لعدد مشتركين بحجم
 * جيم واحد (عادة مئات إلى بضعة آلاف) هذا سريع بما يكفي؛ لو كبر الحجم كثيراً
 * يمكن الانتقال لاستعلام SQL خام أو عمود status محدَّث بمهمة مجدولة.
 */
const { prisma } = require('../config/db');
const ApiError = require('../utils/ApiError');
const { parsePagination, buildMeta } = require('../utils/pagination');
const subscriptionService = require('./subscription.service');

function computeStatus(latestSubscription) {
  if (!latestSubscription) return 'expired'; // لا يوجد أي اشتراك على الإطلاق
  if (latestSubscription.status === 'CANCELLED') return 'expired';
  return latestSubscription.endDate >= new Date() ? 'active' : 'expired';
}

function serializeMember(member) {
  const latest = member.subscriptions?.[0] || null;
  return {
    id: member.id,
    fullName: member.fullName,
    phone: member.phone,
    email: member.email,
    photoUrl: member.photoUrl,
    isActive: member.isActive,
    startWeightKg: member.startWeightKg,
    goalWeightKg: member.goalWeightKg,
    createdAt: member.createdAt,
    status: computeStatus(latest),
    isVip: latest?.subscriptionType?.isVip || false,
    currentSubscription: latest
      ? {
          id: latest.id,
          typeName: latest.subscriptionType.name,
          startDate: latest.startDate,
          endDate: latest.endDate,
          status: latest.status,
        }
      : null,
  };
}

async function list({ page, limit, search, status }) {
  const { skip, page: safePage, limit: safeLimit } = parsePagination({ page, limit });

  const where = {
    isActive: true, // عضو مُعطَّل (soft-deleted) لا يظهر في القوائم العادية
    ...(search
      ? {
          OR: [
            { fullName: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search } },
          ],
        }
      : {}),
  };

 const includeLatestSubscription = {
  include: {
    subscriptions: {
      orderBy: { endDate: 'desc' },
      take: 1,
      include: {
        subscriptionType: true,
      },
    },
  },
};

  if (!status || status === 'all') {
    const [rows, total] = await Promise.all([
      prisma.member.findMany({ where, ...includeLatestSubscription, orderBy: { createdAt: 'desc' }, skip, take: safeLimit }),
      prisma.member.count({ where }),
    ]);
    return { data: rows.map(serializeMember), meta: buildMeta({ page: safePage, limit: safeLimit, total }) };
  }

  // فلترة بالحالة المحسوبة — نجلب المطابقين للبحث فقط (بدون حد أقصى غير واقعي)
  // ثم نحسب الحالة ونطبّق الترقيم يدوياً. راجع الملاحظة أعلى الملف.
  const candidates = await prisma.member.findMany({ where, ...includeLatestSubscription, orderBy: { createdAt: 'desc' } });
  const filtered = candidates.map(serializeMember).filter((m) => m.status === status);
  const total = filtered.length;
  const pageItems = filtered.slice(skip, skip + safeLimit);

  return { data: pageItems, meta: buildMeta({ page: safePage, limit: safeLimit, total }) };
}

async function getById(id) {
  const member = await prisma.member.findFirst({
    where: { id, isActive: true },
    include: {
      subscriptions: { orderBy: { startDate: 'desc' }, include: { subscriptionType: true } },
    },
  });
  if (!member) throw ApiError.notFound('العضو غير موجود');

  return {
    ...serializeMember({ ...member, subscriptions: member.subscriptions.slice(0, 1) }),
    subscriptionHistory: member.subscriptions,
  };
}

async function create(payload) {
  const existingPhone = await prisma.member.findUnique({
    where: { phone: payload.phone },
  });

  if (existingPhone) {
    throw ApiError.conflict("يوجد عضو مسجَّل بنفس رقم الهاتف بالفعل");
  }

  const memberId = await prisma.$transaction(async (tx) => {
    const member = await tx.member.create({
      data: {
        fullName: payload.fullName,
        phone: payload.phone,
        email: payload.email ?? null,
        gender: payload.gender ?? null,
        birthDate: payload.birthDate
          ? new Date(payload.birthDate)
          : null,
        address: payload.address ?? null,
        emergencyContact: payload.emergencyContact ?? null,
        notes: payload.notes ?? null,
        startWeightKg: payload.startWeightKg ?? null,
        goalWeightKg: payload.goalWeightKg ?? null,
      },
    });

    await subscriptionService.createInitialSubscription(tx, {
      memberId: member.id,
      subscriptionTypeId: payload.subscriptionTypeId,
      startDate: payload.startDate,
      paymentMethod: payload.paymentMethod,
      createdByUserId: payload.createdByUserId,
    });

    if (payload.startWeightKg) {
      await tx.weightLog.create({
        data: {
          memberId: member.id,
          weightKg: payload.startWeightKg,
          recordedAt: new Date(payload.startDate),
        },
      });
    }

    return member.id;
  });

  return getById(memberId);
}

async function update(id, data) {
  const member = await prisma.member.findFirst({ where: { id, isActive: true } });
  if (!member) throw ApiError.notFound('العضو غير موجود');

  if (data.phone && data.phone !== member.phone) {
    const phoneTaken = await prisma.member.findUnique({ where: { phone: data.phone } });
    if (phoneTaken) throw ApiError.conflict('رقم الهاتف مستخدم بالفعل لعضو آخر');
  }

  await prisma.member.update({
    where: { id },
    data: { ...data, birthDate: data.birthDate ? new Date(data.birthDate) : undefined },
  });
  return getById(id);
}

/** حذف ناعم فقط — عضو له سجل مدفوعات/حضور لا يجوز حذفه فعلياً من القاعدة. */
async function softDelete(id) {
  const member = await prisma.member.findFirst({ where: { id, isActive: true } });
  if (!member) throw ApiError.notFound('العضو غير موجود');
  await prisma.member.update({ where: { id }, data: { isActive: false } });
}

async function setPhoto(id, photoUrl) {
  await prisma.member.findFirst({ where: { id, isActive: true } }).then((m) => {
    if (!m) throw ApiError.notFound('العضو غير موجود');
  });
  return prisma.member.update({ where: { id }, data: { photoUrl } });
}

module.exports = { list, getById, create, update, softDelete, setPhoto, computeStatus };
