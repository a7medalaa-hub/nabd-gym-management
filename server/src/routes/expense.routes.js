const { Router } = require('express');
const controller = require('../controllers/expense.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requirePermission } = require('../middlewares/role.middleware');
const validate = require('../middlewares/validate.middleware');
const expenseValidator = require('../validators/expense.validator');

const router = Router();
router.use(authenticate, requirePermission('expenses.manage'));

router.post('/', validate(expenseValidator.create), controller.create);
router.get('/', validate(expenseValidator.list), controller.list);
router.delete('/:id', validate(expenseValidator.idParam), controller.remove);

module.exports = router;
