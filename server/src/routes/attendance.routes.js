const { Router } = require('express');
const controller = require('../controllers/attendance.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requirePermission } = require('../middlewares/role.middleware');
const validate = require('../middlewares/validate.middleware');
const attendanceValidator = require('../validators/attendance.validator');

const router = Router();
router.use(authenticate);

router.post('/check-in', requirePermission('attendance.manage'), validate(attendanceValidator.checkIn), controller.checkIn);
router.get('/today', requirePermission('attendance.view'), controller.today);
router.get('/member/:memberId', requirePermission('attendance.view'), validate(attendanceValidator.listByMember), controller.listByMember);

module.exports = router;
