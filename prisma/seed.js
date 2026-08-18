/**
 * prisma/seed.js — يُشغَّل مرة عند إعداد التثبيت لأول مرة (npm run prisma:seed
 * من داخل server/). يزرع: الأدوار + الصلاحيات + حساب مدير افتراضي + أنواع
 * الاشتراكات الافتراضية + إعدادات الجيم الأساسية.
 *
 * ملاحظة عن المسارات: هذا الملف يعيش في prisma/ بينما @prisma/client
 * وbcryptjs مُثبَّتان داخل server/node_modules (راجع output في schema.prisma
 * وscripts في server/package.json) — لذلك نستوردهما بمسار نسبي صريح بدل
 * الاعتماد على تحليل Node التلقائي للموديولات، الذي لن يجدهما من هنا.
 */
const { PrismaClient } = require('../server/node_modules/@prisma/client');
const bcrypt = require('../server/node_modules/bcryptjs');

const prisma = new PrismaClient();

const PERMISSIONS = [
  { key: 'users.manage', description: 'إنشاء/تعديل حسابات الموظفين' },
  { key: 'members.view', description: 'عرض المشتركين' },
  { key: 'members.create', description: 'إضافة مشترك جديد' },
  { key: 'members.update', description: 'تعديل بيانات مشترك' },
  { key: 'members.delete', description: 'إلغاء تفعيل مشترك' },
  { key: 'subscriptiontypes.manage', description: 'إدارة أنواع الاشتراكات' },
  { key: 'subscriptions.manage', description: 'إنشاء وتجديد الاشتراكات' },
  { key: 'payments.view', description: 'عرض سجل المدفوعات' },
  { key: 'dashboard.view', description: 'عرض لوحة التحكم والإحصائيات' },
  { key: 'attendance.manage', description: 'تسجيل حضور المشتركين' },
  { key: 'attendance.view', description: 'عرض سجل الحضور' },
  { key: 'weight.manage', description: 'تسجيل أوزان وقياسات المشتركين' },
  { key: 'weight.view', description: 'عرض سجل الأوزان والقياسات' },
  { key: 'coaches.manage', description: 'إدارة بيانات المدربين' },
  { key: 'plans.manage', description: 'إنشاء خطط تمرين وتغذية' },
  { key: 'plans.view', description: 'عرض خطط التمرين والتغذية' },
  { key: 'products.manage', description: 'إدارة المنتجات والمخزون' },
  { key: 'pos.sell', description: 'إصدار فواتير بيع من بار الجيم' },
  { key: 'pos.view', description: 'عرض سجل المبيعات' },
  { key: 'expenses.manage', description: 'تسجيل وعرض مصروفات الجيم' },
  { key: 'settings.manage', description: 'تعديل إعدادات الجيم والنسخ الاحتياطي' },
  { key: 'reports.view', description: 'عرض التقارير المالية' },
];

const ROLE_PERMISSIONS = {
  Owner: PERMISSIONS.map((p) => p.key), // كل الصلاحيات
  Manager: PERMISSIONS.map((p) => p.key).filter((k) => k !== 'users.manage' && k !== 'settings.manage'),
  Receptionist: [
    'members.view', 'members.create', 'members.update', 'subscriptions.manage',
    'payments.view', 'dashboard.view', 'attendance.manage', 'attendance.view',
    'weight.manage', 'weight.view', 'plans.view', 'pos.sell', 'pos.view',
  ],
  Coach: [
    'members.view', 'dashboard.view', 'attendance.view', 'weight.manage', 'weight.view',
    'plans.manage', 'plans.view',
  ],
};

const SUBSCRIPTION_TYPES = [
  { name: 'اشتراك شهري — فضي', durationDays: 30, price: 450, isVip: false },
  { name: 'اشتراك شهري — ذهبي', durationDays: 30, price: 600, isVip: false },
  { name: 'اشتراك سنوي — بلاتيني (VIP)', durationDays: 365, price: 990, isVip: true },
];

const DEFAULT_SETTINGS = [
  { key: 'gym_name', value: 'نبض' },
  { key: 'currency', value: 'EGP' },
  { key: 'language', value: 'ar' },
  { key: 'theme', value: 'dark' },
];

const DEFAULT_PRODUCTS = [
  { name: 'بروتين شيك', price: 65, costPrice: 40, category: 'مشروبات', stockQuantity: 50, lowStockThreshold: 10 },
  { name: 'مياه معدنية', price: 10, costPrice: 5, category: 'مشروبات', stockQuantity: 200, lowStockThreshold: 30 },
  { name: 'باور بار', price: 35, costPrice: 20, category: 'وجبات خفيفة', stockQuantity: 60, lowStockThreshold: 10 },
  { name: 'مكمل كرياتين', price: 120, costPrice: 80, category: 'مكملات', stockQuantity: 20, lowStockThreshold: 5 },
  { name: 'قهوة سوداء', price: 25, costPrice: 10, category: 'مشروبات', stockQuantity: 80, lowStockThreshold: 15 },
  { name: 'عصير طبيعي', price: 30, costPrice: 15, category: 'مشروبات', stockQuantity: 50, lowStockThreshold: 10 },
  { name: 'مكمل BCAA', price: 150, costPrice: 100, category: 'مكملات', stockQuantity: 15, lowStockThreshold: 5 },
  { name: 'تيشيرت الجيم', price: 220, costPrice: 130, category: 'ملابس', stockQuantity: 25, lowStockThreshold: 5 },
  { name: 'قفازات تدريب', price: 90, costPrice: 50, category: 'إكسسوارات', stockQuantity: 30, lowStockThreshold: 5 },
];

async function main() {
  console.log('🌱 بدء زرع البيانات الأساسية...');

  // 1) الصلاحيات — upsert حتى يمكن تشغيل السكريبت أكثر من مرة بأمان
  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({ where: { key: perm.key }, update: {}, create: perm });
  }

  // 2) الأدوار + ربطها بالصلاحيات
  for (const [roleName, permissionKeys] of Object.entries(ROLE_PERMISSIONS)) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
    });

    for (const key of permissionKeys) {
      const permission = await prisma.permission.findUnique({ where: { key } });
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      });
    }
  }
  console.log(`✅ تم زرع ${Object.keys(ROLE_PERMISSIONS).length} أدوار و ${PERMISSIONS.length} صلاحية`);

  // 3) حساب المدير الافتراضي — كلمة المرور يجب تغييرها فوراً بعد أول دخول
  const ownerRole = await prisma.role.findUnique({ where: { name: 'Owner' } });
  const existingAdmin = await prisma.user.findUnique({ where: { username: 'admin' } });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('Admin@12345', 10);
    await prisma.user.create({
      data: { fullName: 'مدير النظام', username: 'admin', passwordHash, roleId: ownerRole.id },
    });
    console.log('✅ تم إنشاء حساب المدير الافتراضي — admin / Admin@12345 (غيّرها فوراً)');
  } else {
    console.log('ℹ️  حساب admin موجود بالفعل، تم تجاوزه');
  }

  // 4) أنواع الاشتراكات الافتراضية
  for (const type of SUBSCRIPTION_TYPES) {
    await prisma.subscriptionType.upsert({ where: { name: type.name }, update: {}, create: type });
  }
  console.log(`✅ تم زرع ${SUBSCRIPTION_TYPES.length} أنواع اشتراكات`);

  // 5) إعدادات الجيم الأساسية
  for (const setting of DEFAULT_SETTINGS) {
    await prisma.setting.upsert({ where: { key: setting.key }, update: {}, create: setting });
  }
  console.log(`✅ تم زرع ${DEFAULT_SETTINGS.length} إعدادات افتراضية`);

  // 6) كتالوج منتجات بار الجيم الافتراضي، مع تسجيل رصيد افتتاحي لكل منتج
  for (const product of DEFAULT_PRODUCTS) {
    const existing = await prisma.product.findFirst({ where: { name: product.name } });
    if (existing) continue;
    const created = await prisma.product.create({ data: product });
    await prisma.inventoryTransaction.create({
      data: { productId: created.id, type: 'STOCK_IN', quantity: product.stockQuantity, note: 'رصيد افتتاحي' },
    });
  }
  console.log(`✅ تم زرع ${DEFAULT_PRODUCTS.length} منتجات في كتالوج البار`);

  console.log('🎉 اكتمل الزرع بنجاح');
}

main()
  .catch((err) => {
    console.error('❌ فشل الزرع:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
