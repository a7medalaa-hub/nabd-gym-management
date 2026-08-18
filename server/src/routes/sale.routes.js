const { Router } = require('express');
const controller = require('../controllers/sale.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requirePermission } = require('../middlewares/role.middleware');
const validate = require('../middlewares/validate.middleware');
const saleValidator = require('../validators/sale.validator');

const router = Router();
router.use(authenticate);

router.post('/', requirePermission('pos.sell'), validate(saleValidator.create), controller.create);
router.get('/', requirePermission('pos.view'), validate(saleValidator.list), controller.list);
router.get('/today-summary', requirePermission('pos.view'), controller.todaySummary);

module.exports = router;
