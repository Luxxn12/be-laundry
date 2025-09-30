import { Router } from 'express';

import { authenticate, roleGuard } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validation.middleware';
import { listPaymentsHandler } from './payments.controller';
import { listPaymentsSchema } from './payments.schema';

const router = Router();

router.use(authenticate, roleGuard('SUPERADMIN', 'ADMIN'));
router.get('/', validate(listPaymentsSchema), listPaymentsHandler);

export default router;
