const { Router } = require('express');
const controller = require('../controllers/payment.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requirePermission } = require('../middlewares/role.middleware');
const validate = require('../middlewares/validate.middleware');
const paymentValidator = require('../validators/payment.validator');

const router = Router();
router.use(authenticate, requirePermission('payments.view'));

router.get('/', validate(paymentValidator.list), controller.list);
router.get('/today-summary', controller.todaySummary);

module.exports = router;
