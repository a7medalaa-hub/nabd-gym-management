const { Router } = require('express');
const controller = require('../controllers/backup.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requirePermission } = require('../middlewares/role.middleware');

const router = Router();
router.use(authenticate, requirePermission('settings.manage'));

router.post('/', controller.create);
router.get('/', controller.list);
router.post('/restore', controller.restore);

module.exports = router;
