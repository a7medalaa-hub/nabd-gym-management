/**
 * routes/index.js — نقطة تجميع كل الموجّهات (routers) تحت بادئة /api واحدة.
 * أي مورد (resource) جديد يُضاف هنا فقط، ولا يلمس app.js إطلاقاً.
 */
const { Router } = require('express');

const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const memberRoutes = require('./member.routes');
const subscriptionTypeRoutes = require('./subscriptionType.routes');
const subscriptionRoutes = require('./subscription.routes');
const paymentRoutes = require('./payment.routes');
const dashboardRoutes = require('./dashboard.routes');
const attendanceRoutes = require('./attendance.routes');
const weightLogRoutes = require('./weightLog.routes');
const measurementRoutes = require('./measurement.routes');
const coachRoutes = require('./coach.routes');
const workoutPlanRoutes = require('./workoutPlan.routes');
const dietPlanRoutes = require('./dietPlan.routes');
const productRoutes = require('./product.routes');
const saleRoutes = require('./sale.routes');
const expenseRoutes = require('./expense.routes');
const notificationRoutes = require('./notification.routes');
const settingRoutes = require('./setting.routes');
const reportRoutes = require('./report.routes');
const exportRoutes = require('./export.routes');
const backupRoutes = require('./backup.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/members', memberRoutes);
router.use('/subscription-types', subscriptionTypeRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/payments', paymentRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/weight-logs', weightLogRoutes);
router.use('/measurements', measurementRoutes);
router.use('/coaches', coachRoutes);
router.use('/workout-plans', workoutPlanRoutes);
router.use('/diet-plans', dietPlanRoutes);
router.use('/products', productRoutes);
router.use('/sales', saleRoutes);
router.use('/expenses', expenseRoutes);
router.use('/notifications', notificationRoutes);
router.use('/settings', settingRoutes);
router.use('/reports', reportRoutes);
router.use('/exports', exportRoutes);
router.use('/backups', backupRoutes);

module.exports = router;
