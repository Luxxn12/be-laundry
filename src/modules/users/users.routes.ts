import { Router } from 'express';

import { authenticate, roleGuard } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validation.middleware';
import {
  createUserHandler,
  deleteUserHandler,
  listUsersHandler,
  updateUserHandler,
} from './users.controller';
import {
  createUserSchema,
  listUsersSchema,
  updateUserSchema,
  userIdParamSchema,
} from './users.schema';

const router = Router();

router.use(authenticate, roleGuard('SUPERADMIN', 'ADMIN'));

router.get('/', validate(listUsersSchema), listUsersHandler);
router.post('/', validate(createUserSchema), createUserHandler);
router.patch('/:id', validate(updateUserSchema), updateUserHandler);
router.delete('/:id', validate(userIdParamSchema), deleteUserHandler);

export default router;
