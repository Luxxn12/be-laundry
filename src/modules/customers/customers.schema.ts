import { z } from 'zod';

const customerParams = z.object({
  id: z.string().cuid(),
});

export const listCustomersSchema = {
  query: z.object({
    search: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
};

export const createCustomerSchema = {
  body: z.object({
    name: z.string().min(1),
    phone: z.string().min(6),
    email: z.string().email().optional().nullable(),
    address: z.string().optional().nullable(),
  }),
};

export const updateCustomerSchema = {
  params: customerParams,
  body: z
    .object({
      name: z.string().min(1).optional(),
      phone: z.string().min(6).optional(),
      email: z.string().email().optional().nullable(),
      address: z.string().optional().nullable(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided',
    }),
};

export const customerIdParamSchema = {
  params: customerParams,
};
