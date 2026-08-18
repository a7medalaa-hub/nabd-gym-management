const { Router } = require('express');
const controller = require('../controllers/report.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requirePermission } = require('../middlewares/role.middleware');
const validate = require('../middlewares/validate.middleware');
const reportValidator = require('../validators/report.validator');

const router = Router();
router.get('/summary', authenticate, requirePermission('reports.view'), validate(reportValidator.dateRange), controller.summary);

module.exports = router;
