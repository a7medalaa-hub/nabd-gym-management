const { Router } = require('express');
const controller = require('../controllers/export.controller');
const { authenticateViaHeaderOrQuery } = require('../middlewares/auth.middleware');
const { requirePermission } = require('../middlewares/role.middleware');

const router = Router();
router.use(authenticateViaHeaderOrQuery);

router.get('/members.xlsx', requirePermission('members.view'), controller.membersExcel);
router.get('/sales/:saleId/invoice.pdf', requirePermission('pos.view'), controller.invoicePdf);

module.exports = router;
