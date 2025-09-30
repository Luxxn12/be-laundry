import { Router } from 'express';

import { authenticate } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validation.middleware';
import {
  createCustomerHandler,
  deleteCustomerHandler,
  getCustomerHandler,
  listCustomersHandler,
  updateCustomerHandler,
} from './customers.controller';
import {
  createCustomerSchema,
  customerIdParamSchema,
  listCustomersSchema,
  updateCustomerSchema,
} from './customers.schema';

const router = Router();

router.use(authenticate);

router.get('/', validate(listCustomersSchema), listCustomersHandler);
router.post('/', validate(createCustomerSchema), createCustomerHandler);
router.get('/:id', validate(customerIdParamSchema), getCustomerHandler);
router.patch('/:id', validate(updateCustomerSchema), updateCustomerHandler);
router.delete('/:id', validate(customerIdParamSchema), deleteCustomerHandler);

export default router;
