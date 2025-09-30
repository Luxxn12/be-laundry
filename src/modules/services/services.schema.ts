import { z } from 'zod';

const serviceParams = z.object({
  id: z.string().cuid(),
});

export const listServicesSchema = {
  query: z.object({
    type: z.string().optional(),
    isActive: z.enum(['true', 'false']).optional(),
    outletId: z.string().cuid().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
};

export const createServiceSchema = {
  body: z.object({
    outletId: z.string().cuid(),
    name: z.string().min(1),
    type: z.string().min(1),
    unit: z.string().min(1),
    price: z.coerce.number().positive(),
    isActive: z.boolean().optional(),
  }),
};

export const updateServiceSchema = {
  params: serviceParams,
  body: z
    .object({
      name: z.string().min(1).optional(),
      type: z.string().min(1).optional(),
      unit: z.string().min(1).optional(),
      price: z.coerce.number().positive().optional(),
      isActive: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided',
    }),
};

export const serviceIdParamSchema = {
  params: serviceParams,
};
