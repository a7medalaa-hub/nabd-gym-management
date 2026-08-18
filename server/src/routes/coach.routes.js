const { Router } = require('express');
const controller = require('../controllers/coach.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requirePermission } = require('../middlewares/role.middleware');
const validate = require('../middlewares/validate.middleware');
const coachValidator = require('../validators/coach.validator');

const router = Router();
router.use(authenticate);

router.get('/', controller.list); // أي مستخدم مسجّل دخول يحتاج القائمة عند إسناد خطة لمدرب
router.post('/', requirePermission('coaches.manage'), validate(coachValidator.create), controller.create);
router.patch('/:id', requirePermission('coaches.manage'), validate(coachValidator.update), controller.update);

module.exports = router;
