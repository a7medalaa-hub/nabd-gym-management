const { Router } = require('express');
const controller = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const authValidator = require('../validators/auth.validator');

const router = Router();

router.post('/login', validate(authValidator.login), controller.login);
router.get('/me', authenticate, controller.me);
router.post('/change-password', authenticate, validate(authValidator.changePassword), controller.changePassword);

module.exports = router;
