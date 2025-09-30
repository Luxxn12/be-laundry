import { Router } from 'express';

import { authenticate } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validation.middleware';
import {
  addOrderItemHandler,
  addPaymentHandler,
  cancelOrderHandler,
  createOrderHandler,
  getOrderHandler,
  listOrdersHandler,
  removeOrderItemHandler,
  setPickupHandler,
  updateOrderHandler,
  updateOrderItemHandler,
} from './orders.controller';
import {
  addOrderItemSchema,
  cancelOrderSchema,
  createOrderSchema,
  createPaymentSchema,
  listOrdersSchema,
  orderIdParamSchema,
  orderItemIdParamSchema,
  pickupSchema,
  updateOrderItemSchema,
  updateOrderSchema,
} from './orders.schema';

const router = Router();

router.use(authenticate);

router.get('/', validate(listOrdersSchema), listOrdersHandler);
router.post('/', validate(createOrderSchema), createOrderHandler);
router.get('/:id', validate(orderIdParamSchema), getOrderHandler);
router.patch('/:id', validate(updateOrderSchema), updateOrderHandler);

router.post('/:id/items', validate(addOrderItemSchema), addOrderItemHandler);
router.patch('/:id/items/:itemId', validate(updateOrderItemSchema), updateOrderItemHandler);
router.delete('/:id/items/:itemId', validate(orderItemIdParamSchema), removeOrderItemHandler);

router.post('/:id/payments', validate(createPaymentSchema), addPaymentHandler);
router.post('/:id/pickup', validate(pickupSchema), setPickupHandler);
router.patch('/:id/pickup', validate(pickupSchema), setPickupHandler);
router.post('/:id/cancel', validate(cancelOrderSchema), cancelOrderHandler);

export default router;
