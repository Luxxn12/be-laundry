import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { JwtPayload } from 'jsonwebtoken';
import type { UserRole } from '@prisma/client';

import config from '../config/env';
import { ApiError } from '../utils/api-error';

export type AuthenticatedUser = {
  id: string;
  email: string;
  role: UserRole;
  outletId?: string | null;
};

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

interface TokenPayload extends JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  outletId?: string | null;
  type?: 'access' | 'refresh';
}

function extractToken(header?: string): string | null {
  if (!header) {
    return null;
  }

  const [scheme, token] = header.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return null;
  }

  return token;
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const request = req as AuthenticatedRequest;
  const token = extractToken(req.headers.authorization);

  if (!token) {
    throw new ApiError(401, 'Authentication required');
  }

  try {
    const payload = jwt.verify(token, config.JWT_ACCESS_SECRET) as TokenPayload;

    if (payload.type && payload.type !== 'access') {
      throw new ApiError(401, 'Invalid access token');
    }

    request.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      outletId: payload.outletId ?? null,
    };

    next();
  } catch (error) {
    throw new ApiError(401, 'Invalid or expired token', error);
  }
}

export function roleGuard(...roles: UserRole[]): (req: Request, res: Response, next: NextFunction) => void {
  return (req, _res, next) => {
    const request = req as AuthenticatedRequest;
    if (!request.user) {
      throw new ApiError(401, 'Authentication required');
    }

    if (!roles.includes(request.user.role)) {
      throw new ApiError(403, 'Insufficient permissions');
    }

    next();
  };
}

export function enforceOutletScope(req: Request, res: Response, next: NextFunction): void {
  const request = req as AuthenticatedRequest;
  if (!request.user) {
    throw new ApiError(401, 'Authentication required');
  }

  if (request.user.role === 'SUPERADMIN') {
    return next();
  }

  if (!request.user.outletId) {
    throw new ApiError(403, 'Outlet access required');
  }

  res.locals.outletId = request.user.outletId;
  next();
}
