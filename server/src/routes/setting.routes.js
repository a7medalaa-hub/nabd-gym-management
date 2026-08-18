const { Router } = require('express');
const controller = require('../controllers/setting.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requirePermission } = require('../middlewares/role.middleware');
const validate = require('../middlewares/validate.middleware');
const settingValidator = require('../validators/setting.validator');

const router = Router();
router.use(authenticate);

router.get('/', controller.getAll); // القراءة متاحة لأي مستخدم (تُستخدم لعرض اسم الجيم مثلاً)
router.patch('/', requirePermission('settings.manage'), validate(settingValidator.update), controller.update);

module.exports = router;
