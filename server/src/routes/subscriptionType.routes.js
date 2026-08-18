const { Router } = require('express');
const controller = require('../controllers/subscriptionType.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requirePermission } = require('../middlewares/role.middleware');
const validate = require('../middlewares/validate.middleware');
const typeValidator = require('../validators/subscriptionType.validator');

const router = Router();
router.use(authenticate);

// أي مستخدم مسجَّل دخول يمكنه قراءة الأنواع المتاحة (يحتاجها نموذج إضافة عضو)
router.get('/', controller.list);

router.post('/', requirePermission('subscriptiontypes.manage'), validate(typeValidator.create), controller.create);
router.patch('/:id', requirePermission('subscriptiontypes.manage'), validate(typeValidator.update), controller.update);
router.delete('/:id', requirePermission('subscriptiontypes.manage'), validate(typeValidator.idParam), controller.deactivate);

module.exports = router;
