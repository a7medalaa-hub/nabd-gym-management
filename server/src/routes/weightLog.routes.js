const { Router } = require('express');
const controller = require('../controllers/weightLog.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requirePermission } = require('../middlewares/role.middleware');
const validate = require('../middlewares/validate.middleware');
const weightValidator = require('../validators/weightLog.validator');

const router = Router();
router.use(authenticate);

router.post('/', requirePermission('weight.manage'), validate(weightValidator.create), controller.create);
router.get('/member/:memberId', requirePermission('weight.view'), validate(weightValidator.listByMember), controller.listByMember);

module.exports = router;
