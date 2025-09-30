import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';

import logger from '../config/logger';
import { ApiError } from '../utils/api-error';
import { errorResponse } from '../utils/response';

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json(errorResponse('Resource not found'));
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction): void {
  let statusCode = 500;
  let message = 'Internal server error';
  let details: unknown;

  if (error instanceof ApiError) {
    statusCode = error.statusCode;
    message = error.message;
    details = error.details;
  } else if (error instanceof ZodError) {
    statusCode = 400;
    message = 'Validation error';
    details = error.flatten();
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    statusCode = 400;
    message = 'Database request error';
    details = { code: error.code, meta: error.meta };
  } else if (error instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = 'Database validation error';
    details = error.message;
  }

  if (statusCode === 500) {
    logger.error({ err: error }, 'Unhandled error');
  } else {
    logger.warn({ err: error, statusCode }, 'Handled error');
  }

  res.status(statusCode).json(errorResponse(message, details));
}
