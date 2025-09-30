import type { UserRole } from '@prisma/client';

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      role: UserRole;
      outletId?: string | null;
    }

    interface Request {
      user?: User;
    }

    interface Locals {
      outletId?: string;
    }
  }
}

export {};
