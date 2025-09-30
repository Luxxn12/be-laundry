import type { Request, Response } from 'express';

import { successResponse } from '../../utils/response';
import {
  createCustomer,
  deleteCustomer,
  getCustomer,
  listCustomers,
  updateCustomer,
} from './customers.service';

export const listCustomersHandler = async (req: Request, res: Response) => {
  const result = await listCustomers(req.query);
  res.json(successResponse(result.data, 'Customers fetched', result.meta));
};

export const createCustomerHandler = async (req: Request, res: Response) => {
  const customer = await createCustomer(req.body);
  res.status(201).json(successResponse(customer, 'Customer created'));
};

export const getCustomerHandler = async (req: Request, res: Response) => {
  const customer = await getCustomer(req.params.id);
  res.json(successResponse(customer, 'Customer detail'));
};

export const updateCustomerHandler = async (req: Request, res: Response) => {
  const customer = await updateCustomer(req.params.id, req.body);
  res.json(successResponse(customer, 'Customer updated'));
};

export const deleteCustomerHandler = async (req: Request, res: Response) => {
  await deleteCustomer(req.params.id);
  res.status(204).send();
};
