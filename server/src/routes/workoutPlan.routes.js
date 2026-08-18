const { Router } = require('express');
const controller = require('../controllers/workoutPlan.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requirePermission } = require('../middlewares/role.middleware');
const validate = require('../middlewares/validate.middleware');
const planValidator = require('../validators/workoutPlan.validator');

const router = Router();
router.use(authenticate);

router.post('/', requirePermission('plans.manage'), validate(planValidator.create), controller.create);
router.get('/member/:memberId/current', requirePermission('plans.view'), validate(planValidator.listByMember), controller.current);

module.exports = router;
