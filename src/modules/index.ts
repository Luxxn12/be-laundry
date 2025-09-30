import { Router } from 'express';

import authRoutes from './auth/auth.routes';
import customerRoutes from './customers/customers.routes';
import orderRoutes from './orders/orders.routes';
import outletRoutes from './outlets/outlets.routes';
import paymentRoutes from './payments/payments.routes';
import reportRoutes from './reports/reports.routes';
import serviceRoutes from './services/services.routes';
import userRoutes from './users/users.routes';
import voucherRoutes from './vouchers/vouchers.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/outlets', outletRoutes);
router.use('/customers', customerRoutes);
router.use('/services', serviceRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);
router.use('/vouchers', voucherRoutes);
router.use('/reports', reportRoutes);

export default router;
