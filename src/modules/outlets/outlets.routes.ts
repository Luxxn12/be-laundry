import { Router } from 'express';

import { authenticate, roleGuard } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validation.middleware';
import {
  createOutletHandler,
  deleteOutletHandler,
  getOutletHandler,
  listOutletsHandler,
  updateOutletHandler,
} from './outlets.controller';
import {
  createOutletSchema,
  listOutletsSchema,
  outletIdParamSchema,
  updateOutletSchema,
} from './outlets.schema';

const router = Router();

router.use(authenticate);

router.get('/', roleGuard('SUPERADMIN'), validate(listOutletsSchema), listOutletsHandler);
router.post('/', roleGuard('SUPERADMIN'), validate(createOutletSchema), createOutletHandler);
router.get('/:id', validate(outletIdParamSchema), getOutletHandler);
router.patch('/:id', roleGuard('SUPERADMIN'), validate(updateOutletSchema), updateOutletHandler);
router.delete('/:id', roleGuard('SUPERADMIN'), validate(outletIdParamSchema), deleteOutletHandler);

export default router;
