import { Router } from 'express';

import { authenticate, roleGuard } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validation.middleware';
import {
  createVoucherHandler,
  deleteVoucherHandler,
  listVouchersHandler,
  updateVoucherHandler,
} from './vouchers.controller';
import {
  createVoucherSchema,
  listVoucherSchema,
  updateVoucherSchema,
  voucherIdParamSchema,
} from './vouchers.schema';

const router = Router();

router.use(authenticate);

router.get('/', validate(listVoucherSchema), listVouchersHandler);
router.post('/', roleGuard('SUPERADMIN', 'ADMIN'), validate(createVoucherSchema), createVoucherHandler);
router.patch('/:id', roleGuard('SUPERADMIN', 'ADMIN'), validate(updateVoucherSchema), updateVoucherHandler);
router.delete('/:id', roleGuard('SUPERADMIN', 'ADMIN'), validate(voucherIdParamSchema), deleteVoucherHandler);

export default router;
