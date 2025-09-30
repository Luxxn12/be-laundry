import type { Request, Response } from 'express';

import type { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { successResponse } from '../../utils/response';
import {
  addOrderItem,
  addPayment,
  cancelOrder,
  createOrder,
  getOrder,
  listOrders,
  removeOrderItem,
  setPickup,
  updateOrder,
  updateOrderItem,
} from './orders.service';

export const listOrdersHandler = async (req: AuthenticatedRequest, res: Response) => {
  const result = await listOrders(req.user!, req.query as Record<string, any>);
  res.json(successResponse(result.data, 'Orders fetched', result.meta));
};

export const createOrderHandler = async (req: AuthenticatedRequest, res: Response) => {
  const order = await createOrder(req.user!, req.body);
  res.status(201).json(successResponse(order, 'Order created'));
};

export const getOrderHandler = async (req: AuthenticatedRequest, res: Response) => {
  const order = await getOrder(req.user!, req.params.id);
  res.json(successResponse(order, 'Order detail'));
};

export const updateOrderHandler = async (req: AuthenticatedRequest, res: Response) => {
  const order = await updateOrder(req.user!, req.params.id, req.body);
  res.json(successResponse(order, 'Order updated'));
};

export const addOrderItemHandler = async (req: AuthenticatedRequest, res: Response) => {
  const order = await addOrderItem(req.user!, req.params.id, req.body);
  res.status(201).json(successResponse(order, 'Order item added'));
};

export const updateOrderItemHandler = async (req: AuthenticatedRequest, res: Response) => {
  const order = await updateOrderItem(req.user!, req.params.id, req.params.itemId, req.body.qty);
  res.json(successResponse(order, 'Order item updated'));
};

export const removeOrderItemHandler = async (req: AuthenticatedRequest, res: Response) => {
  const order = await removeOrderItem(req.user!, req.params.id, req.params.itemId);
  res.json(successResponse(order, 'Order item removed'));
};

export const addPaymentHandler = async (req: AuthenticatedRequest, res: Response) => {
  const payment = await addPayment(req.user!, req.params.id, req.body);
  res.status(201).json(successResponse(payment, 'Payment recorded'));
};

export const setPickupHandler = async (req: AuthenticatedRequest, res: Response) => {
  const pickup = await setPickup(req.user!, req.params.id, req.body);
  res.json(successResponse(pickup, 'Pickup updated'));
};

export const cancelOrderHandler = async (req: AuthenticatedRequest, res: Response) => {
  const order = await cancelOrder(req.user!, req.params.id, req.body.reason);
  res.json(successResponse(order, 'Order canceled'));
};
