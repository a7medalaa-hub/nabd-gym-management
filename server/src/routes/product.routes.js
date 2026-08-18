const { Router } = require('express');
const controller = require('../controllers/product.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requirePermission } = require('../middlewares/role.middleware');
const validate = require('../middlewares/validate.middleware');
const productValidator = require('../validators/product.validator');

const router = Router();
router.use(authenticate);

// أي مستخدم مسجّل دخول يحتاج القائمة لعرضها في شاشة نقطة البيع
router.get('/', controller.list);

router.post('/', requirePermission('products.manage'), validate(productValidator.create), controller.create);
router.patch('/:id', requirePermission('products.manage'), validate(productValidator.update), controller.update);
router.delete('/:id', requirePermission('products.manage'), validate(productValidator.idParam), controller.deactivate);
router.post('/:id/stock-adjustment', requirePermission('products.manage'), validate(productValidator.stockAdjustment), controller.adjustStock);

module.exports = router;
