const { Router } = require('express');
const controller = require('../controllers/notification.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const router = Router();
router.use(authenticate); // أي مستخدم مسجَّل دخول يرى إشعاراته الخاصة + العامة

router.get('/', controller.list);
router.patch('/:id/read', controller.markRead);

module.exports = router;
