const { Router } = require('express');
const controller = require('../controllers/subscription.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requirePermission } = require('../middlewares/role.middleware');
const validate = require('../middlewares/validate.middleware');
const subValidator = require('../validators/subscription.validator');

const router = Router();
router.use(authenticate, requirePermission('subscriptions.manage'));

router.get('/expiring-soon', validate(subValidator.expiringSoon), controller.expiringSoon);
router.get('/member/:memberId', validate(subValidator.listByMember), controller.listByMember);
router.post('/member/:memberId/renew', validate(subValidator.renew), controller.renew);

module.exports = router;
