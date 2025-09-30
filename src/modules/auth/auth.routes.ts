import { Router } from 'express';

import { authenticate, roleGuard } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validation.middleware';
import {
  loginHandler,
  logoutHandler,
  meHandler,
  refreshHandler,
  registerHandler,
} from './auth.controller';
import { loginSchema, logoutSchema, refreshSchema, registerSchema } from './auth.schema';

const router = Router();

router.post('/login', validate(loginSchema), loginHandler);
router.post('/refresh', validate(refreshSchema), refreshHandler);
router.post('/logout', validate(logoutSchema), logoutHandler);

router.post(
  '/register',
  authenticate,
  roleGuard('SUPERADMIN', 'ADMIN'),
  validate(registerSchema),
  registerHandler,
);

router.get('/me', authenticate, meHandler);

export default router;
