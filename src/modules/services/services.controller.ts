import type { Request, Response } from 'express';

import type { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { successResponse } from '../../utils/response';
import {
  createService,
  deleteService,
  listServices,
  updateService,
} from './services.service';

export const listServicesHandler = async (req: AuthenticatedRequest, res: Response) => {
  const result = await listServices(req.user!, req.query);
  res.json(successResponse(result.data, 'Services fetched', result.meta));
};

export const createServiceHandler = async (req: AuthenticatedRequest, res: Response) => {
  const service = await createService(req.user!, req.body);
  res.status(201).json(successResponse(service, 'Service created'));
};

export const updateServiceHandler = async (req: AuthenticatedRequest, res: Response) => {
  const service = await updateService(req.user!, req.params.id, req.body);
  res.json(successResponse(service, 'Service updated'));
};

export const deleteServiceHandler = async (req: AuthenticatedRequest, res: Response) => {
  await deleteService(req.user!, req.params.id);
  res.status(204).send();
};
