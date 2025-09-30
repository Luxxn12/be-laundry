import type { Request, Response } from 'express';

import type { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { successResponse } from '../../utils/response';
import { getSalesReport, getTopServices } from './reports.service';

export const salesReportHandler = async (req: AuthenticatedRequest, res: Response) => {
  const report = await getSalesReport(req.user!, req.query);
  res.json(successResponse(report, 'Sales report'));
};

export const topServicesReportHandler = async (req: AuthenticatedRequest, res: Response) => {
  const report = await getTopServices(req.user!, { ...req.query, limit: req.query.limit ? Number(req.query.limit) : undefined });
  res.json(successResponse(report, 'Top services report'));
};
