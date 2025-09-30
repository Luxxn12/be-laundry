import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import type { AnyZodObject, ZodEffects, ZodSchema } from 'zod';

import { ApiError } from '../utils/api-error';

interface ValidationSchema {
  body?: ZodSchema | AnyZodObject | ZodEffects<AnyZodObject>;
  query?: ZodSchema | AnyZodObject | ZodEffects<AnyZodObject>;
  params?: ZodSchema | AnyZodObject | ZodEffects<AnyZodObject>;
}

export function validate(schema: ValidationSchema) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schema.body) {
        req.body = await schema.body.parseAsync(req.body);
      }
      if (schema.query) {
        const parsedQuery = await schema.query.parseAsync(req.query);
        Object.assign(req.query as Record<string, unknown>, parsedQuery);
      }
      if (schema.params) {
        req.params = await schema.params.parseAsync(req.params);
      }
      return next();
    } catch (error) {
      if (error instanceof ApiError) {
        return next(error);
      }

      if (error instanceof ZodError) {
        return next(new ApiError(400, 'Validation error', error.flatten()));
      }

      return next(new ApiError(400, 'Validation error', error));
    }
  };
}
