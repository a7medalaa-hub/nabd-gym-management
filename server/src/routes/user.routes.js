const { Router } = require('express');
const controller = require('../controllers/user.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requirePermission } = require('../middlewares/role.middleware');
const validate = require('../middlewares/validate.middleware');
const userValidator = require('../validators/user.validator');

const router = Router();
router.use(authenticate, requirePermission('users.manage'));

router.get('/', controller.list);
router.get('/:id', validate(userValidator.idParam), controller.getById);
router.post('/', validate(userValidator.create), controller.create);
router.patch('/:id', validate(userValidator.update), controller.update);

module.exports = router;
