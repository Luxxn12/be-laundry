import type { Request, Response } from 'express';

import type { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { successResponse } from '../../utils/response';
import {
  createOutlet,
  deleteOutlet,
  getOutlet,
  listOutlets,
  updateOutlet,
} from './outlets.service';

export const listOutletsHandler = async (req: AuthenticatedRequest, res: Response) => {
  const result = await listOutlets(req.user!, req.query);
  res.json(successResponse(result.data, 'Outlets fetched', result.meta));
};

export const getOutletHandler = async (req: AuthenticatedRequest, res: Response) => {
  const outlet = await getOutlet(req.user!, req.params.id);
  res.json(successResponse(outlet, 'Outlet detail'));
};

export const createOutletHandler = async (req: AuthenticatedRequest, res: Response) => {
  const outlet = await createOutlet(req.user!, req.body);
  res.status(201).json(successResponse(outlet, 'Outlet created'));
};

export const updateOutletHandler = async (req: AuthenticatedRequest, res: Response) => {
  const outlet = await updateOutlet(req.user!, req.params.id, req.body);
  res.json(successResponse(outlet, 'Outlet updated'));
};

export const deleteOutletHandler = async (req: AuthenticatedRequest, res: Response) => {
  await deleteOutlet(req.user!, req.params.id);
  res.status(204).send();
};
