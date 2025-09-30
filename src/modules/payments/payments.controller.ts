import type { Request, Response } from 'express';

import type { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { successResponse } from '../../utils/response';
import { listPayments } from './payments.service';

export const listPaymentsHandler = async (req: AuthenticatedRequest, res: Response) => {
  const result = await listPayments(req.user!, req.query);
  res.json(successResponse(result.data, 'Payments fetched', result.meta));
};
