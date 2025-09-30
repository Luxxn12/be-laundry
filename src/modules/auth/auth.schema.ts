import { z } from 'zod';

import { UserRole } from '@prisma/client';

const registerBody = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(8),
  role: z.nativeEnum(UserRole),
  outletId: z.string().cuid().optional().nullable(),
  isActive: z.boolean().optional(),
});

const loginBody = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const tokenBody = z.object({
  refreshToken: z.string().min(1),
});

export const registerSchema = { body: registerBody };
export const loginSchema = { body: loginBody };
export const refreshSchema = { body: tokenBody };
export const logoutSchema = { body: tokenBody };
