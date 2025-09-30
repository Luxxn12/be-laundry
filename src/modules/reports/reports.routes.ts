import { Router } from 'express';

import { authenticate, roleGuard } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validation.middleware';
import { salesReportHandler, topServicesReportHandler } from './reports.controller';
import { salesReportSchema, topServicesSchema } from './reports.schema';

const router = Router();

router.use(authenticate, roleGuard('SUPERADMIN', 'ADMIN'));

router.get('/sales', validate(salesReportSchema), salesReportHandler);
router.get('/top-services', validate(topServicesSchema), topServicesReportHandler);

export default router;
