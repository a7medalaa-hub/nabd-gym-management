const { Router } = require('express');
const controller = require('../controllers/member.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requirePermission } = require('../middlewares/role.middleware');
const validate = require('../middlewares/validate.middleware');
const memberValidator = require('../validators/member.validator');
const { uploadMemberPhoto } = require('../middlewares/upload.middleware');

const router = Router();
router.use(authenticate);

router.get('/', requirePermission('members.view'), validate(memberValidator.list), controller.list);
router.get('/:id', requirePermission('members.view'), validate(memberValidator.idParam), controller.getById);
router.post('/', requirePermission('members.create'), validate(memberValidator.create), controller.create);
router.patch('/:id', requirePermission('members.update'), validate(memberValidator.update), controller.update);
router.delete('/:id', requirePermission('members.delete'), validate(memberValidator.idParam), controller.softDelete);
router.post(
  '/:id/photo',
  requirePermission('members.update'),
  validate(memberValidator.idParam),
  uploadMemberPhoto,
  controller.uploadPhoto
);

module.exports = router;
