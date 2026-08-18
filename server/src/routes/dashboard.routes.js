const { Router } = require('express');
const controller = require('../controllers/dashboard.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requirePermission } = require('../middlewares/role.middleware');

const router = Router();
router.get('/stats', authenticate, requirePermission('dashboard.view'), controller.stats);

module.exports = router;
