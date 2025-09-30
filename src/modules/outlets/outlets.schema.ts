import { z } from 'zod';

const outletParams = z.object({
  id: z.string().cuid(),
});

export const listOutletsSchema = {
  query: z.object({
    search: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
};

export const createOutletSchema = {
  body: z.object({
    code: z.string().min(2).max(10).toUpperCase(),
    name: z.string().min(1),
    address: z.string().min(1),
    phone: z.string().optional().nullable(),
  }),
};

export const updateOutletSchema = {
  params: outletParams,
  body: z
    .object({
      code: z.string().min(2).max(10).toUpperCase().optional(),
      name: z.string().min(1).optional(),
      address: z.string().min(1).optional(),
      phone: z.string().optional().nullable(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided',
    }),
};

export const outletIdParamSchema = {
  params: outletParams,
};
