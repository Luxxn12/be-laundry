import { z } from 'zod';

import { UserRole } from '@prisma/client';

const baseParams = z.object({
  id: z.string().cuid(),
});

export const listUsersSchema = {
  query: z.object({
    search: z.string().optional(),
    role: z.nativeEnum(UserRole).optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
};

export const createUserSchema = {
  body: z.object({
    email: z.string().email(),
    name: z.string().min(1),
    password: z.string().min(8),
    role: z.nativeEnum(UserRole),
    outletId: z.string().cuid().optional().nullable(),
    isActive: z.boolean().optional(),
  }),
};

export const updateUserSchema = {
  params: baseParams,
  body: z
    .object({
      name: z.string().min(1).optional(),
      password: z.string().min(8).optional(),
      role: z.nativeEnum(UserRole).optional(),
      outletId: z.string().cuid().optional().nullable(),
      isActive: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided',
    }),
};

export const userIdParamSchema = {
  params: baseParams,
};
