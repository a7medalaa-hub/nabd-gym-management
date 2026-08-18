const { Router } = require('express');
const controller = require('../controllers/measurement.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requirePermission } = require('../middlewares/role.middleware');
const validate = require('../middlewares/validate.middleware');
const measurementValidator = require('../validators/measurement.validator');

const router = Router();
router.use(authenticate);

router.post('/', requirePermission('weight.manage'), validate(measurementValidator.create), controller.create);
router.get('/member/:memberId', requirePermission('weight.view'), validate(measurementValidator.listByMember), controller.listByMember);

module.exports = router;
