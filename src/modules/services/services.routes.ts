import { Router } from 'express';

import { authenticate, roleGuard } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validation.middleware';
import {
  createServiceHandler,
  deleteServiceHandler,
  listServicesHandler,
  updateServiceHandler,
} from './services.controller';
import {
  createServiceSchema,
  listServicesSchema,
  serviceIdParamSchema,
  updateServiceSchema,
} from './services.schema';

const router = Router();

router.use(authenticate);

router.get('/', validate(listServicesSchema), listServicesHandler);
router.post('/', roleGuard('SUPERADMIN', 'ADMIN'), validate(createServiceSchema), createServiceHandler);
router.patch('/:id', roleGuard('SUPERADMIN', 'ADMIN'), validate(updateServiceSchema), updateServiceHandler);
router.delete('/:id', roleGuard('SUPERADMIN', 'ADMIN'), validate(serviceIdParamSchema), deleteServiceHandler);

export default router;
